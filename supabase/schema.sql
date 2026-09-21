-- Marketplace schema extras — run in Supabase SQL Editor.

alter table public.products
  add column if not exists badges text[] default '{}';

alter table public.products
  add column if not exists sold_count integer default 0;

alter table public.settings
  add column if not exists support_email text;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create index if not exists categories_sort_idx on public.categories (sort_order);

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text,
  subtitle text,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.categories enable row level security;
alter table public.banners enable row level security;

drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories for select using (true);

drop policy if exists "banners_public_read" on public.banners;
create policy "banners_public_read" on public.banners for select using (true);

-- Order status helpers
alter table public.orders add column if not exists payment_status text default 'pending';
alter table public.orders add column if not exists status text default 'new';
-- payment_status: pending | unpaid | paid | failed
-- status: new | processing | preparing | out_for_delivery | delivered

alter table public.settings add column if not exists delivery_fee_local numeric default 50;
alter table public.settings add column if not exists delivery_fee_outside numeric default 100;


alter table public.categories add column if not exists icon text;
alter table public.categories add column if not exists icon_url text;


-- Create a public storage bucket in Supabase Dashboard:
-- Storage → New bucket → name: public-assets (or images) → Public
-- Policy: allow authenticated upload, public read


-- Shop invites + admins
create table if not exists public.shop_invites (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade,
  email text not null,
  accepted boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.shop_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  shop_id uuid references public.shops(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.shops add column if not exists logo_url text;

-- Optional RPC (client also has fallback)
create or replace function public.accept_shop_invite()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_uid uuid;
  v_shop uuid;
  v_invite_id uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    return null;
  end if;
  select lower(email) into v_email from auth.users where id = v_uid;
  if v_email is null then
    return null;
  end if;
  select id, shop_id into v_invite_id, v_shop
  from public.shop_invites
  where lower(email) = v_email and accepted = false
  order by created_at desc
  limit 1;
  if v_shop is null then
    return null;
  end if;
  insert into public.shop_admins (user_id, shop_id)
  values (v_uid, v_shop)
  on conflict (user_id) do update set shop_id = excluded.shop_id;
  update public.shop_invites set accepted = true where id = v_invite_id;
  return v_shop;
end;
$$;

-- Riders linked to a shop (managed from Shop Admin)
create table if not exists public.riders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  shop_id uuid references public.shops(id) on delete cascade not null,
  name text,
  phone text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index if not exists riders_shop_idx on public.riders (shop_id);
create index if not exists riders_user_idx on public.riders (user_id);

alter table public.riders enable row level security;

drop policy if exists "riders_shop_admin_all" on public.riders;
-- Shop admins can manage riders for their shop (client-side checks + RLS as needed)
create policy "riders_select_authenticated" on public.riders
  for select to authenticated using (true);

create policy "riders_insert_authenticated" on public.riders
  for insert to authenticated with check (true);

create policy "riders_update_authenticated" on public.riders
  for update to authenticated using (true);

-- Banner ↔ product links (promotions)
create table if not exists public.banner_products (
  banner_id uuid not null references public.banners(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  primary key (banner_id, product_id)
);

alter table public.banner_products enable row level security;

drop policy if exists "banner_products_public_read" on public.banner_products;
create policy "banner_products_public_read" on public.banner_products for select using (true);

drop policy if exists "banner_products_auth_write" on public.banner_products;
create policy "banner_products_auth_write" on public.banner_products
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Product extras for For You / Recommended / multi-image
alter table public.products add column if not exists description text;
alter table public.products add column if not exists images text[] default '{}';
alter table public.products add column if not exists is_recommended boolean default false;
alter table public.products add column if not exists is_you_might_like boolean default false;
alter table public.products add column if not exists original_price numeric;

-- Stronger banner_products policies (re-run safely)
drop policy if exists "banner_products_auth_write" on public.banner_products;
create policy "banner_products_auth_insert" on public.banner_products
  for insert to authenticated
  with check (true);
create policy "banner_products_auth_update" on public.banner_products
  for update to authenticated
  using (true) with check (true);
create policy "banner_products_auth_delete" on public.banner_products
  for delete to authenticated
  using (true);

alter table public.shops add column if not exists whatsapp_number text;
