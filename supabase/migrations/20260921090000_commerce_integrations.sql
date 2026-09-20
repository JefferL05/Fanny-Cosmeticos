-- Adds server-side foundations for shipping-by-state, payment-gateway tracking
-- and full admin catalog management. All pricing stays computed in the
-- database; no privileged logic moves to the browser.

create table public.shipping_zones (
  uf text primary key check (uf ~ '^[A-Z]{2}$'),
  label text not null,
  price numeric(12,2) not null check (price >= 0),
  eta_days integer not null check (eta_days between 1 and 60)
);
alter table public.shipping_zones enable row level security;
revoke all on public.shipping_zones from anon, authenticated;
grant select on public.shipping_zones to anon, authenticated;
create policy shipping_zones_read on public.shipping_zones for select to anon, authenticated using (true);

-- Demonstration rates by state (flat rate per UF); replace with live carrier
-- quotes (Melhor Envio/Correios) once real fulfillment starts.
insert into public.shipping_zones(uf,label,price,eta_days) values
('SP','São Paulo',14.90,2),('RJ','Rio de Janeiro',18.90,3),('MG','Minas Gerais',18.90,3),
('ES','Espírito Santo',19.90,3),('PR','Paraná',19.90,3),('SC','Santa Catarina',19.90,3),
('RS','Rio Grande do Sul',22.90,4),('DF','Distrito Federal',21.90,3),('GO','Goiás',22.90,4),
('MT','Mato Grosso',26.90,5),('MS','Mato Grosso do Sul',24.90,4),('BA','Bahia',24.90,4),
('SE','Sergipe',26.90,5),('AL','Alagoas',26.90,5),('PE','Pernambuco',26.90,5),
('PB','Paraíba',27.90,5),('RN','Rio Grande do Norte',27.90,5),('CE','Ceará',27.90,5),
('PI','Piauí',28.90,6),('MA','Maranhão',28.90,6),('PA','Pará',31.90,7),
('AP','Amapá',34.90,8),('TO','Tocantins',28.90,6),('RO','Rondônia',31.90,7),
('AC','Acre',34.90,8),('AM','Amazonas',34.90,8),('RR','Roraima',36.90,9)
on conflict (uf) do nothing;

alter table public.orders add column shipping_uf text check (shipping_uf ~ '^[A-Z]{2}$');
alter table public.orders add column payment_provider text check (payment_provider in ('mercado_pago'));
alter table public.orders add column payment_reference text;
alter table public.orders add column payment_status text not null default 'pending'
  check (payment_status in ('pending','paid','failed','refunded'));
create unique index orders_payment_reference_idx on public.orders(payment_reference) where payment_reference is not null;
grant insert(shipping_uf) on public.orders to authenticated;

create or replace function private.prepare_order() returns trigger language plpgsql security definer set search_path = '' as $$
declare entry jsonb; p public.products%rowtype; qty integer; subtotal numeric := 0; discounted numeric := 0; snapshot jsonb := '[]'; zone_price numeric;
begin
  if auth.uid() is null or new.user_id is distinct from auth.uid() then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text,0));
  if (select count(*) from public.orders where user_id = auth.uid() and created_at > now() - interval '1 minute') >= 5 then
    raise exception 'Too many requests';
  end if;
  if jsonb_typeof(new.requested_items) is distinct from 'array' or jsonb_array_length(new.requested_items) not between 1 and 30 then
    raise exception 'Invalid cart';
  end if;
  if (select count(distinct value->>'id') from jsonb_array_elements(new.requested_items)) <> jsonb_array_length(new.requested_items) then
    raise exception 'Duplicate or missing product';
  end if;
  select price into zone_price from public.shipping_zones where uf = new.shipping_uf;
  if zone_price is null then raise exception 'Unknown shipping destination'; end if;
  for entry in select value from jsonb_array_elements(new.requested_items) order by value->>'id' loop
    if jsonb_typeof(entry->'quantity') is distinct from 'number' or (entry->>'quantity') !~ '^[1-9][0-9]{0,2}$' then raise exception 'Invalid quantity'; end if;
    qty := (entry->>'quantity')::integer;
    select * into p from public.products where id = entry->>'id' and active for share;
    if not found or qty > p.stock-p.reserved then raise exception 'Product unavailable'; end if;
    subtotal := subtotal + (p.details->>'price')::numeric * qty;
    discounted := discounted + (case when new.payment_method = 'pix' then (p.details->>'pixPrice')::numeric else (p.details->>'price')::numeric end) * qty;
    snapshot := snapshot || jsonb_build_array(jsonb_build_object('id',p.id,'name',p.details->>'name','quantity',qty,'unit_price',case when new.payment_method='pix' then (p.details->>'pixPrice')::numeric else (p.details->>'price')::numeric end));
  end loop;
  new.items := snapshot;
  new.shipping := case when subtotal >= 299 then 0 else zone_price end;
  new.total := discounted + new.shipping;
  new.status := 'demo'; new.payment_status := 'pending'; new.created_at := now();
  return new;
end $$;

-- Admins manage the full catalog (new products, pricing, activation), not just stock.
create policy admin_catalog_insert on public.products for insert to authenticated
with check (exists(select 1 from public.store_admins where user_id = (select auth.uid())));
grant insert(id,details,stock,active) on public.products to authenticated;
grant update(details,active) on public.products to authenticated;

-- Payment webhooks run with the service role key and bypass RLS, so no grant
-- is added for authenticated/anon on payment_status/payment_reference: only
-- supabase/functions/mercadopago-webhook may set them.
