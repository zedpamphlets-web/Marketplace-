-- Security fixes — run this in the Supabase SQL Editor AFTER schema.sql.
--
-- WHY: shop_admins and shop_invites had no Row Level Security, and the
-- app writes to shop_admins directly from the client as a fallback
-- (lib/adminActions.ts). Without RLS, any signed-in user could call
-- supabase.from('shop_admins').upsert({ user_id: me, shop_id: ANY })
-- from the client and grant themselves shop-admin access to any shop.
-- riders also allowed any authenticated user to insert/update any row.
-- This script closes those gaps without changing app behavior for
-- legitimate users.

-- Helper: is the current user a platform (super) admin?
create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins where user_id = auth.uid()
  );
$$;

-- Helper: is the current user a shop_admin for a given shop?
create or replace function public.is_shop_admin(target_shop uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.shop_admins
    where user_id = auth.uid() and shop_id = target_shop
  );
$$;

-- platform_admins: everyone needs to read their OWN row (role check on login).
-- No client insert/update policy — keep managing this table from the SQL
-- editor, exactly as README already instructs.
alter table public.platform_admins enable row level security;
drop policy if exists "platform_admins_self_read" on public.platform_admins;
create policy "platform_admins_self_read" on public.platform_admins
  for select to authenticated using (user_id = auth.uid());

-- shop_admins: users can see their own admin link; platform admins can see all.
-- Deliberately NO insert/update/delete policy — writes must go through the
-- accept_shop_invite() RPC (security definer) or the SQL editor. This is
-- the actual fix for the privilege-escalation gap.
alter table public.shop_admins enable row level security;
drop policy if exists "shop_admins_self_or_platform_read" on public.shop_admins;
create policy "shop_admins_self_or_platform_read" on public.shop_admins
  for select to authenticated
  using (user_id = auth.uid() or public.is_platform_admin());

-- shop_invites: only platform admins create/view invites; accept_shop_invite()
-- (security definer) still reads/updates rows fine, bypassing RLS.
alter table public.shop_invites enable row level security;
drop policy if exists "shop_invites_platform_admin_read" on public.shop_invites;
create policy "shop_invites_platform_admin_read" on public.shop_invites
  for select to authenticated using (public.is_platform_admin());

drop policy if exists "shop_invites_platform_admin_insert" on public.shop_invites;
create policy "shop_invites_platform_admin_insert" on public.shop_invites
  for insert to authenticated with check (public.is_platform_admin());

-- riders: replace the "true" (anyone-can-write) policies with real checks —
-- only the shop's own admin (or a platform admin) can add/update its riders.
-- Anyone signed in may still read (matches original intent for tracking).
drop policy if exists "riders_select_authenticated" on public.riders;
create policy "riders_select_authenticated" on public.riders
  for select to authenticated using (true);

drop policy if exists "riders_insert_authenticated" on public.riders;
create policy "riders_insert_authenticated" on public.riders
  for insert to authenticated
  with check (public.is_shop_admin(shop_id) or public.is_platform_admin());

drop policy if exists "riders_update_authenticated" on public.riders;
create policy "riders_update_authenticated" on public.riders
  for update to authenticated
  using (public.is_shop_admin(shop_id) or public.is_platform_admin());


-- =====================================================================
-- PART 2 — orders, order_items, products, shops, settings
-- =====================================================================
-- These tables existed before this zip, so their current RLS is unknown
-- to me. The policies below are inferred from how the app actually reads
-- and writes each table (checked against every .from("orders") /
-- .from("products") / .from("shops") / .from("settings") call in the
-- codebase). Read them before running — if a column name here doesn't
-- match your live table, that statement will just error out harmlessly;
-- fix the column name and re-run.

-- --- price tampering fix -------------------------------------------------
-- checkout.tsx currently computes subtotal/delivery_fee/total on the
-- DEVICE (from the on-device cart) and inserts that straight into
-- `orders`. Anyone could edit the stored cart or replay the network
-- request with a lower price and pay less than the real total — the
-- payment step only charges whatever `orders.total` says. This RPC moves
-- the price calculation onto the server, where it can't be tampered with.

create or replace function public.create_order(
  p_shop_id uuid,
  p_items jsonb, -- [{ "product_id": uuid, "qty": int }, ...]
  p_full_name text,
  p_phone text,
  p_location text,
  p_payment_method text
)
returns table(order_id uuid, total numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_subtotal numeric := 0;
  v_delivery_fee numeric := 50;
  v_order_id uuid;
  item record;
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;

  select coalesce(delivery_fee_local, 50) into v_delivery_fee
  from public.settings where id = 'global';

  -- price each line from the CURRENT product row, ignoring any client price
  for item in
    select (elem->>'product_id')::uuid as product_id,
           greatest((elem->>'qty')::int, 1) as qty
    from jsonb_array_elements(p_items) as elem
  loop
    v_subtotal := v_subtotal + (
      select p.price * item.qty
      from public.products p
      where p.id = item.product_id and p.shop_id = p_shop_id
    );
  end loop;

  if v_subtotal <= 0 then
    raise exception 'Could not price this order — check the cart.';
  end if;

  insert into public.orders (
    shop_id, customer_id, subtotal, delivery_fee, total,
    payment_method, payment_status, status, delivery_address
  ) values (
    p_shop_id, v_uid, v_subtotal, v_delivery_fee, v_subtotal + v_delivery_fee,
    p_payment_method, 'pending', 'new',
    jsonb_build_object('full_name', p_full_name, 'phone', p_phone, 'location', p_location)
  ) returning id into v_order_id;

  insert into public.order_items (order_id, product_id, quantity, price_at_purchase)
  select v_order_id, (elem->>'product_id')::uuid, greatest((elem->>'qty')::int, 1),
         (select price from public.products where id = (elem->>'product_id')::uuid)
  from jsonb_array_elements(p_items) as elem;

  return query select v_order_id, v_subtotal + v_delivery_fee;
end;
$$;

-- orders / order_items: lock direct writes down to this RPC only.
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "orders_owner_or_staff_read" on public.orders;
create policy "orders_owner_or_staff_read" on public.orders
  for select to authenticated
  using (
    customer_id = auth.uid()
    or public.is_shop_admin(shop_id)
    or public.is_platform_admin()
  );

-- Only shop admins / platform admins may change status or payment_status —
-- this is the check the app's admin screens were relying on the UI for.
drop policy if exists "orders_staff_update" on public.orders;
create policy "orders_staff_update" on public.orders
  for update to authenticated
  using (public.is_shop_admin(shop_id) or public.is_platform_admin())
  with check (public.is_shop_admin(shop_id) or public.is_platform_admin());

-- No insert policy on orders/order_items for regular users on purpose —
-- creating an order must go through create_order() above.

drop policy if exists "order_items_owner_or_staff_read" on public.order_items;
create policy "order_items_owner_or_staff_read" on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.customer_id = auth.uid() or public.is_shop_admin(o.shop_id) or public.is_platform_admin())
    )
  );

-- --- products --------------------------------------------------------
alter table public.products enable row level security;

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select using (true);

drop policy if exists "products_staff_write" on public.products;
create policy "products_staff_write" on public.products
  for all to authenticated
  using (public.is_shop_admin(shop_id) or public.is_platform_admin())
  with check (public.is_shop_admin(shop_id) or public.is_platform_admin());

-- --- shops -------------------------------------------------------------
alter table public.shops enable row level security;

drop policy if exists "shops_public_read" on public.shops;
create policy "shops_public_read" on public.shops
  for select using (true);

drop policy if exists "shops_staff_update" on public.shops;
create policy "shops_staff_update" on public.shops
  for update to authenticated
  using (public.is_shop_admin(id) or public.is_platform_admin())
  with check (public.is_shop_admin(id) or public.is_platform_admin());

drop policy if exists "shops_platform_insert" on public.shops;
create policy "shops_platform_insert" on public.shops
  for insert to authenticated with check (public.is_platform_admin());

-- --- settings (single "global" row) ------------------------------------
alter table public.settings enable row level security;

drop policy if exists "settings_public_read" on public.settings;
create policy "settings_public_read" on public.settings
  for select using (true);

drop policy if exists "settings_platform_update" on public.settings;
create policy "settings_platform_update" on public.settings
  for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());


-- =====================================================================
-- PART 3 — storage buckets (public-assets / images)
-- =====================================================================
-- lib/uploadImage.ts uploads to these buckets. schema.sql only left a
-- comment about the intended policy ("allow authenticated upload, public
-- read") — it was never actually created, so check in Supabase → Storage
-- whether these buckets currently have NO policy (usually means fully
-- open) or a policy already. This adds the intended one safely either way.

drop policy if exists "public_assets_read" on storage.objects;
create policy "public_assets_read" on storage.objects
  for select using (bucket_id in ('public-assets', 'images'));

drop policy if exists "public_assets_authenticated_write" on storage.objects;
create policy "public_assets_authenticated_write" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('public-assets', 'images'));

drop policy if exists "public_assets_authenticated_update" on storage.objects;
create policy "public_assets_authenticated_update" on storage.objects
  for update to authenticated
  using (bucket_id in ('public-assets', 'images'));

-- Anonymous/guest users can never upload — only browse and sign in can.
-- File-size and content-type limits aren't set here; configure those on
-- the bucket itself in Supabase → Storage → (bucket) → Settings.
