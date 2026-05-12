-- ============================================================
-- EconoConnect Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES (Create if not exists)
-- ============================================================

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  account_type text check (account_type in ('business', 'supplier', 'guest')) default 'guest',
  company_name text,
  location text,
  phone text,
  bio text,
  avatar_url text,
  is_email_verified boolean default false,
  is_phone_verified boolean default false,
  is_id_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.companies (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  company_name text not null,
  company_logo text,
  business_type text,
  business_email text,
  phone_number text,
  address text,
  description text,
  verification_status text check (verification_status in ('pending', 'verified', 'rejected')) default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.products (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  category text not null,
  price numeric(12, 2),
  price_display text,
  location text,
  contact_number text,
  description text,
  image_url text,
  listing_type text check (listing_type in ('product', 'supply')) default 'product',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_name text not null,
  category text,
  description text,
  quantity integer,
  budget numeric(12, 2),
  budget_display text,
  deadline date,
  location text,
  status text check (status in ('pending', 'in-progress', 'completed', 'cancelled')) default 'pending',
  offers_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.offers (
  id uuid default uuid_generate_v4() primary key,
  request_id uuid references public.requests on delete cascade not null,
  supplier_id uuid references public.profiles(id) on delete cascade not null,
  price numeric(12, 2) not null,
  description text,
  delivery_time text,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.conversations (
  id uuid default uuid_generate_v4() primary key,
  participant1_id uuid references public.profiles(id) on delete cascade not null,
  participant2_id uuid references public.profiles(id) on delete cascade not null,
  product_name text,
  order_id text,
  last_message text,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(participant1_id, participant2_id)
);

create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id text primary key,
  buyer_id uuid references public.profiles(id) on delete set null,
  seller_id uuid references public.profiles(id) on delete set null,
  product_id uuid references public.products on delete set null,
  product_name text not null,
  quantity integer default 1,
  total_price numeric(12, 2),
  total_price_display text,
  status text check (status in ('to-ship', 'completed', 'refund', 'cancelled')) default 'to-ship',
  customer_name text,
  order_date date default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.inventory (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  group_number text,
  group_name text,
  quantity integer default 0,
  available boolean default true,
  cost_per_unit numeric(12, 2),
  cost_per_unit_display text,
  total_cost numeric(12, 2),
  total_cost_display text,
  category text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- SCHEMA MIGRATIONS (Ensure columns exist)
-- ============================================================

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inventory' AND column_name='company_id') THEN
        ALTER TABLE public.inventory ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update offers_count when offer is inserted/deleted
create or replace function public.update_offers_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.requests set offers_count = offers_count + 1 where id = new.request_id;
  elsif (TG_OP = 'DELETE') then
    update public.requests set offers_count = offers_count - 1 where id = old.request_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_offer_change on public.offers;
create trigger on_offer_change
  after insert or delete on public.offers
  for each row execute procedure public.update_offers_count();

-- Update conversation last_message on new message
create or replace function public.update_conversation_last_message()
returns trigger as $$
begin
  update public.conversations
  set last_message = new.content, last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_message_insert on public.messages;
create trigger on_message_insert
  after insert on public.messages
  for each row execute procedure public.update_conversation_last_message();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.requests enable row level security;
alter table public.offers enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.orders enable row level security;
alter table public.inventory enable row level security;
alter table public.companies enable row level security;

-- DROP ALL EXISTING POLICIES FIRST TO PREVENT ERRORS
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON ' || quote_ident(pol.tablename);
    END LOOP;
END $$;

-- Profiles: users can read all, managed by owner
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Companies: viewable by all, managed by owner
create policy "Companies are viewable by everyone" on public.companies for select using (true);
create policy "Users can manage own companies" on public.companies for all using (auth.uid() = owner_id);

-- Products: viewable by all, managed by owner
create policy "Products are viewable by everyone" on public.products for select using (true);
create policy "Users can insert own products" on public.products for insert with check (auth.uid() = user_id);
create policy "Users can update own products" on public.products for update using (auth.uid() = user_id);
create policy "Users can delete own products" on public.products for delete using (auth.uid() = user_id);

-- Requests: viewable by all, managed by owner
create policy "Requests are viewable by everyone" on public.requests for select using (true);
create policy "Users can insert own requests" on public.requests for insert with check (auth.uid() = user_id);
create policy "Users can update own requests" on public.requests for update using (auth.uid() = user_id);
create policy "Users can delete own requests" on public.requests for delete using (auth.uid() = user_id);

-- Offers: viewable by request owner and offer creator
create policy "Offers viewable by parties" on public.offers for select using (
  auth.uid() = supplier_id or
  auth.uid() = (select user_id from public.requests where id = request_id)
);
create policy "Suppliers can insert offers" on public.offers for insert with check (auth.uid() = supplier_id);
create policy "Suppliers can update own offers" on public.offers for update using (auth.uid() = supplier_id);

-- Conversations: only participants can see
create policy "Conversations viewable by participants" on public.conversations for select using (
  auth.uid() = participant1_id or auth.uid() = participant2_id
);
create policy "Users can create conversations" on public.conversations for insert with check (
  auth.uid() = participant1_id or auth.uid() = participant2_id
);
create policy "Participants can update conversations" on public.conversations for update using (
  auth.uid() = participant1_id or auth.uid() = participant2_id
);

-- Messages: only conversation participants
create policy "Messages viewable by conversation participants" on public.messages for select using (
  auth.uid() in (
    select participant1_id from public.conversations where id = conversation_id
    union
    select participant2_id from public.conversations where id = conversation_id
  )
);
create policy "Users can send messages in their conversations" on public.messages for insert with check (
  auth.uid() = sender_id and
  auth.uid() in (
    select participant1_id from public.conversations where id = conversation_id
    union
    select participant2_id from public.conversations where id = conversation_id
  )
);

-- Orders: buyer and seller can see their orders
create policy "Orders viewable by parties" on public.orders for select using (
  auth.uid() = buyer_id or auth.uid() = seller_id
);
create policy "Users can create orders" on public.orders for insert with check (
  auth.uid() = buyer_id or auth.uid() = seller_id
);
create policy "Parties can update orders" on public.orders for update using (
  auth.uid() = buyer_id or auth.uid() = seller_id
);

-- Inventory: owner and company owner only
create policy "Inventory viewable by owner" on public.inventory for select using (
  auth.uid() = user_id or 
  exists (select 1 from public.companies where id = company_id and owner_id = auth.uid())
);
create policy "Users can insert own inventory" on public.inventory for insert with check (
  auth.uid() = user_id and
  (company_id is null or exists (select 1 from public.companies where id = company_id and owner_id = auth.uid()))
);
create policy "Users can update own inventory" on public.inventory for update using (
  auth.uid() = user_id or 
  exists (select 1 from public.companies where id = company_id and owner_id = auth.uid())
);
create policy "Users can delete own inventory" on public.inventory for delete using (
  auth.uid() = user_id or 
  exists (select 1 from public.companies where id = company_id and owner_id = auth.uid())
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_profiles_account_type on public.profiles(account_type);
create index if not exists idx_companies_owner_id on public.companies(owner_id);
create index if not exists idx_inventory_user_id on public.inventory(user_id);
create index if not exists idx_inventory_company_id on public.inventory(company_id);
create index if not exists idx_products_user_id on public.products(user_id);
create index if not exists idx_requests_user_id on public.requests(user_id);
create index if not exists idx_offers_request_id on public.offers(request_id);
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_orders_buyer_id on public.orders(buyer_id);
create index if not exists idx_orders_seller_id on public.orders(seller_id);

-- ============================================================
-- Enable realtime for key tables
-- ============================================================
DO $$
BEGIN
  -- Messages & Conversations (Chat)
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
  
  -- Products & Requests (Feed)
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'products') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;
  END IF;
END $$;
