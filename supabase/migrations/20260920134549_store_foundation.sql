create schema if not exists private;
revoke all on schema private from public;

create table public.store_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.store_admins enable row level security;
revoke all on public.store_admins from anon, authenticated;
grant select on public.store_admins to authenticated;
create policy own_admin_membership on public.store_admins for select to authenticated using (user_id = (select auth.uid()));

create table public.products (
  id text primary key,
  details jsonb not null check (jsonb_typeof(details) = 'object'),
  stock integer not null default 0 check (stock >= 0),
  reserved integer not null default 0 check (reserved >= 0 and reserved <= stock),
  active boolean not null default true,
  constraint positive_prices check (
    details ? 'price' and details ? 'pixPrice' and
    (details->>'price')::numeric >= 0 and (details->>'pixPrice')::numeric >= 0 and
    (details->>'pixPrice')::numeric <= (details->>'price')::numeric
  )
);
alter table public.products enable row level security;
revoke all on public.products from anon, authenticated;
grant select on public.products to anon, authenticated;
grant update(stock) on public.products to authenticated;
create policy catalog_read on public.products for select to anon, authenticated using (active);
create policy admin_stock_update on public.products for update to authenticated
using (exists(select 1 from public.store_admins where user_id = (select auth.uid())))
with check (exists(select 1 from public.store_admins where user_id = (select auth.uid())));

create table public.inventory_movements (
  id bigint generated always as identity primary key,
  product_id text not null references public.products(id),
  actor_id uuid references auth.users(id) on delete set null,
  previous_stock integer not null,
  new_stock integer not null,
  created_at timestamptz not null default now()
);
create index inventory_movements_product_idx on public.inventory_movements(product_id);
create index inventory_movements_actor_idx on public.inventory_movements(actor_id);
alter table public.inventory_movements enable row level security;
revoke all on public.inventory_movements from anon, authenticated;
grant select on public.inventory_movements to authenticated;
create policy admin_movements_read on public.inventory_movements for select to authenticated
using (exists(select 1 from public.store_admins where user_id = (select auth.uid())));
create function private.audit_stock() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists(select 1 from public.store_admins where user_id = auth.uid()) then
    raise exception 'Administrator required' using errcode = '42501';
  end if;
  if new.stock is distinct from old.stock then
    insert into public.inventory_movements(product_id, actor_id, previous_stock, new_stock)
    values(new.id, auth.uid(), old.stock, new.stock);
  end if;
  return new;
end $$;
revoke all on function private.audit_stock() from public, anon, authenticated;
create trigger audit_stock after update of stock on public.products for each row execute function private.audit_stock();

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null check(length(trim(customer_name)) between 2 and 120),
  payment_method text not null check(payment_method in ('pix','card','boleto')),
  requested_items jsonb not null,
  items jsonb not null default '[]',
  total numeric(12,2) not null default 0,
  shipping numeric(12,2) not null default 0,
  status text not null default 'demo' check(status = 'demo'),
  created_at timestamptz not null default now()
);
create index orders_user_created_idx on public.orders(user_id,created_at desc);
alter table public.orders enable row level security;
revoke all on public.orders from anon, authenticated;
grant select on public.orders to authenticated;
grant insert(id,user_id,customer_name,payment_method,requested_items) on public.orders to authenticated;
create policy own_orders_read on public.orders for select to authenticated using (
 user_id = (select auth.uid()) or exists(select 1 from public.store_admins where user_id = (select auth.uid()))
);
create policy own_orders_insert on public.orders for insert to authenticated with check(user_id = (select auth.uid()));
-- Trigger-only privileged code computes immutable snapshots from authoritative prices.
create function private.prepare_order() returns trigger language plpgsql security definer set search_path = '' as $$
declare entry jsonb; p public.products%rowtype; qty integer; subtotal numeric := 0; discounted numeric := 0; snapshot jsonb := '[]';
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
  new.shipping := case when subtotal >= 299 then 0 else 18.90 end;
  new.total := discounted + new.shipping;
  new.status := 'demo'; new.created_at := now();
  return new;
end $$;
revoke all on function private.prepare_order() from public, anon, authenticated;
create trigger prepare_order before insert on public.orders for each row execute function private.prepare_order();
