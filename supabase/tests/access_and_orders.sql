begin;
insert into auth.users(id, email) values ('00000000-0000-4000-8000-000000000001','fixture-a@example.invalid'), ('00000000-0000-4000-8000-000000000002','fixture-b@example.invalid');
set local role anon;
do $$ begin
  if (select count(*) from public.products) <> 9 then raise exception 'Catalog missing'; end if;
  begin
    perform * from public.orders;
    raise exception 'Anonymous order access allowed';
  exception when insufficient_privilege then null; end;
  begin
    update public.products set stock = 900 where id = 'p1';
    raise exception 'Anonymous stock write allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
insert into public.orders(id,user_id,customer_name,payment_method,shipping_uf,requested_items)
values('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001','Cliente de teste','pix','SP','[{"id":"p1","quantity":2}]');
do $$ begin
  if (select total from public.orders where id='00000000-0000-4000-8000-000000000003') <> 284.80 then raise exception 'Incorrect server price'; end if;
  if (select shipping from public.orders where id='00000000-0000-4000-8000-000000000003') <> 0 then raise exception 'Incorrect shipping'; end if;
  if (select payment_status from public.orders where id='00000000-0000-4000-8000-000000000003') <> 'pending' then raise exception 'Incorrect default payment status'; end if;
  begin
    insert into public.orders(user_id,customer_name,payment_method,shipping_uf,requested_items)
    values('00000000-0000-4000-8000-000000000001','Cliente teste','pix','ZZ','[{"id":"p3","quantity":1}]');
    raise exception 'Unknown shipping destination accepted';
  exception when raise_exception then if sqlerrm <> 'Unknown shipping destination' then raise; end if; end;
  insert into public.orders(user_id,customer_name,payment_method,shipping_uf,requested_items)
  values('00000000-0000-4000-8000-000000000001','Cliente teste','pix','AM','[{"id":"p3","quantity":1}]');
  if (select shipping from public.orders where customer_name='Cliente teste' and shipping_uf='AM') <> 34.90 then raise exception 'Incorrect zone shipping'; end if;
  begin
    insert into public.orders(user_id,customer_name,payment_method,shipping_uf,requested_items)
    values('00000000-0000-4000-8000-000000000002','Outra pessoa','pix','SP','[{"id":"p1","quantity":1}]');
    raise exception 'Spoofed owner accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.orders(user_id,customer_name,payment_method,shipping_uf,requested_items,total)
    values('00000000-0000-4000-8000-000000000001','Cliente teste','pix','SP','[{"id":"p1","quantity":1}]',0);
    raise exception 'Client price accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.orders(user_id,customer_name,payment_method,shipping_uf,requested_items)
    values('00000000-0000-4000-8000-000000000001','Cliente teste','pix','SP','[{"id":"p1","quantity":999}]');
    raise exception 'Overselling accepted';
  exception when raise_exception then if sqlerrm <> 'Product unavailable' then raise; end if; end;
  begin
    insert into public.orders(user_id,customer_name,payment_method,shipping_uf,requested_items)
    values('00000000-0000-4000-8000-000000000001','Cliente teste','pix','SP','[{"id":"p1","quantity":1},{"id":"p1","quantity":1}]');
    raise exception 'Duplicate products accepted';
  exception when raise_exception then if sqlerrm <> 'Duplicate or missing product' then raise; end if; end;
  begin
    insert into public.products(id,details,stock) values('pX','{"price":1,"pixPrice":1}'::jsonb,1);
    raise exception 'Non-admin catalog insert accepted';
  exception when insufficient_privilege then null; end;
  update public.products set stock=900 where id='p1';
  if found then raise exception 'Customer changed stock'; end if;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.orders) then raise exception 'Cross-customer order leak'; end if;
end $$;
reset role;
insert into public.store_admins(user_id) values('00000000-0000-4000-8000-000000000002');
set local role authenticated;
update public.products set stock=19 where id='p1';
do $$ begin
  if (select stock from public.products where id='p1') <> 19 then raise exception 'Admin stock update failed'; end if;
  if not exists(select 1 from public.inventory_movements where product_id='p1' and previous_stock=18 and new_stock=19) then raise exception 'Audit missing'; end if;
  if (select count(*) from public.orders) <> 2 then raise exception 'Admin cannot see orders'; end if;
  insert into public.products(id,details,stock) values('pX','{"price":1,"pixPrice":1}'::jsonb,1);
  if not exists(select 1 from public.products where id='pX') then raise exception 'Admin catalog insert failed'; end if;
end $$;
reset role;
select 'PASS: catalog, anonymous denial, ownership, server pricing, shipping, stock limits, duplicates, customer isolation, admin update, audit. All fixtures rolled back.' as verification;
rollback;
