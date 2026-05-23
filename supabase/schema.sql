-- EstateElevate Database Schema
-- Run this in your Supabase SQL editor

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- ============================================================
-- ENUMS
-- Drop old versions first so we can recreate with correct values.
-- ============================================================
do $$ begin
  drop type if exists property_type cascade;
  drop type if exists listing_status cascade;
  drop type if exists lead_status cascade;
  drop type if exists plan_type cascade;
  drop type if exists profile_role cascade;
  drop type if exists subscription_status cascade;
  drop type if exists support_ticket_status cascade;
  drop type if exists support_ticket_priority cascade;
  -- Legacy enums from old schema
  drop type if exists property_status cascade;
  drop type if exists listing_purpose cascade;
  drop type if exists transaction_status cascade;
  drop type if exists tour_status cascade;
  drop type if exists user_role cascade;
exception when others then null;
end $$;

create type property_type as enum ('house', 'apartment', 'condo', 'land', 'commercial');
create type listing_status as enum ('active', 'pending', 'sold', 'draft');
create type lead_status as enum ('new', 'contacted', 'qualified', 'negotiating', 'closed');
create type plan_type as enum ('free', 'pro', 'elite');
create type profile_role as enum ('buyer', 'seller', 'agent', 'admin', 'banned');
create type subscription_status as enum ('active', 'trialing', 'past_due', 'cancelled', 'unpaid', 'grace_period');
create type support_ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
create type support_ticket_priority as enum ('low', 'medium', 'high', 'urgent');

-- ============================================================
-- DROP LEGACY / OLD TABLES (safe — cascade handles dependents)
-- ============================================================
drop table if exists public.admin_audit_logs cascade;
drop table if exists public.webhook_events cascade;
drop table if exists public.support_tickets cascade;
drop table if exists public.favorites cascade;
drop table if exists public.leads cascade;
drop table if exists public.listing_slots cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.listing_views cascade;
drop table if exists public.listings cascade;
drop table if exists public.transactions cascade;
drop table if exists public.contact_messages cascade;
drop table if exists public.tour_requests cascade;
drop table if exists public.properties cascade;
drop table if exists public.profiles cascade;

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  avatar_url text,
  whatsapp text,
  agency_name text,
  bio text,
  website text,
  verified boolean not null default false,
  role profile_role not null default 'agent',
  plan plan_type not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- ============================================================
-- LISTINGS
-- ============================================================
create table public.listings (
  id uuid primary key default uuid_generate_v4(),
  agent_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text not null unique,
  description text not null,
  property_type property_type not null,
  status listing_status not null default 'active',
  featured boolean not null default false,
  price numeric(15,2) not null,
  currency text not null default 'MXN',
  -- Location
  address text not null,
  neighborhood text,
  city text not null,
  state text not null,
  country text not null default 'México',
  postal_code text,
  lat numeric(10,8),
  lng numeric(11,8),
  -- Features
  bedrooms integer,
  bathrooms numeric(3,1),
  parking_spots integer,
  total_area numeric(10,2),
  built_area numeric(10,2),
  -- Amenities & Media
  amenities jsonb not null default '[]',
  images jsonb not null default '[]',
  virtual_tour_url text,
  video_url text,
  -- Meta
  views integer not null default 0,
  year_built integer,
  maintenance_fee numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listings enable row level security;

create policy "Listings viewable by everyone"
  on public.listings for select using (true);

create policy "Agents can insert own listings"
  on public.listings for insert
  with check (auth.uid() = agent_id);

create policy "Agents can update own listings"
  on public.listings for update
  using (auth.uid() = agent_id);

create policy "Agents can delete own listings"
  on public.listings for delete
  using (auth.uid() = agent_id);

create index listings_fts_idx on public.listings
  using gin(to_tsvector('spanish', title || ' ' || description || ' ' || city || ' ' || coalesce(neighborhood, '')));

create index listings_city_idx on public.listings(city);
create index listings_type_idx on public.listings(property_type);
create index listings_status_idx on public.listings(status);
create index listings_price_idx on public.listings(price);
create index listings_featured_idx on public.listings(featured) where featured = true;
create index listings_agent_idx on public.listings(agent_id);

-- ============================================================
-- LISTING VIEWS (deduplication)
-- ============================================================
create table public.listing_views (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  ip_hash text not null,
  viewed_at timestamptz not null default now()
);

alter table public.listing_views enable row level security;

create policy "Anyone can insert listing views"
  on public.listing_views for insert with check (true);

create index listing_views_lookup_idx on public.listing_views(listing_id, ip_hash, viewed_at);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  agent_id uuid not null unique references public.profiles(id) on delete cascade,
  plan plan_type not null default 'free',
  status subscription_status not null default 'active',
  conekta_customer_id text,
  conekta_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  grace_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Agents can view own subscription"
  on public.subscriptions for select using (auth.uid() = agent_id);

create policy "Service role can manage subscriptions"
  on public.subscriptions for all using (true);

-- ============================================================
-- LISTING SLOTS (per-listing paid slots)
-- ============================================================
create table public.listing_slots (
  id uuid primary key default uuid_generate_v4(),
  agent_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  conekta_order_id text not null,
  active boolean not null default true,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.listing_slots enable row level security;

create policy "Agents can view own slots"
  on public.listing_slots for select using (auth.uid() = agent_id);

create index listing_slots_agent_idx on public.listing_slots(agent_id);
create index listing_slots_active_idx on public.listing_slots(active, expires_at);

-- ============================================================
-- LEADS (contact & tour requests)
-- ============================================================
create table public.leads (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references public.listings(id) on delete set null,
  agent_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  message text not null,
  status lead_status not null default 'new',
  read boolean not null default false,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads enable row level security;

create policy "Agents can view own leads"
  on public.leads for select using (auth.uid() = agent_id);

create policy "Anyone can submit a lead"
  on public.leads for insert with check (true);

create policy "Agents can update own leads"
  on public.leads for update using (auth.uid() = agent_id);

create index leads_agent_idx on public.leads(agent_id);
create index leads_listing_idx on public.leads(listing_id);

-- ============================================================
-- FAVORITES
-- ============================================================
create table public.favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, listing_id)
);

alter table public.favorites enable row level security;

create policy "Users can view own favorites"
  on public.favorites for select using (auth.uid() = user_id);

create policy "Users can insert own favorites"
  on public.favorites for insert with check (auth.uid() = user_id);

create policy "Users can delete own favorites"
  on public.favorites for delete using (auth.uid() = user_id);

-- ============================================================
-- SUPPORT TICKETS
-- ============================================================
create table public.support_tickets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  email text not null,
  subject text not null,
  message text not null,
  status support_ticket_status not null default 'open',
  priority support_ticket_priority not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.support_tickets enable row level security;

create policy "Users can view own tickets"
  on public.support_tickets for select
  using (auth.uid() = user_id);

create policy "Anyone can create a ticket"
  on public.support_tickets for insert with check (true);

create policy "Admins can manage tickets"
  on public.support_tickets for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ============================================================
-- WEBHOOK EVENTS
-- ============================================================
create table public.webhook_events (
  id uuid primary key default uuid_generate_v4(),
  provider text not null,
  event_type text not null,
  payload jsonb not null default '{}',
  processed boolean not null default false,
  error text,
  created_at timestamptz not null default now()
);

alter table public.webhook_events enable row level security;

create policy "Service role only"
  on public.webhook_events for all using (false);

create index webhook_events_provider_idx on public.webhook_events(provider, event_type);

-- ============================================================
-- ADMIN AUDIT LOGS
-- ============================================================
create table public.admin_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id text not null,
  before jsonb,
  after jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_logs enable row level security;

create policy "Admins can view audit logs"
  on public.admin_audit_logs for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create index audit_logs_admin_idx on public.admin_audit_logs(admin_id);
create index audit_logs_target_idx on public.admin_audit_logs(target_type, target_id);

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_listings_updated_at before update on public.listings
  for each row execute function public.handle_updated_at();

create trigger set_leads_updated_at before update on public.leads
  for each row execute function public.handle_updated_at();

create trigger set_subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.handle_updated_at();

create trigger set_support_tickets_updated_at before update on public.support_tickets
  for each row execute function public.handle_updated_at();

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- FUNCTION: increment listing views
-- ============================================================
create or replace function public.increment_listing_views(listing_id uuid)
returns void language sql security definer as $$
  update public.listings set views = views + 1 where id = listing_id;
$$;

-- ============================================================
-- DATA API GRANTS (required from Oct 30, 2026 for all projects)
-- Without these, PostgREST returns 42501 for each missing grant.
-- RLS policies still enforce row-level access on top of these.
-- ============================================================

-- anon: unauthenticated public access
grant select on public.listings to anon;
grant select on public.profiles to anon;
grant insert on public.leads to anon;
grant insert on public.listing_views to anon;

-- authenticated: logged-in users
grant select, insert, update, delete on public.listings to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.listing_views to authenticated;
grant select on public.subscriptions to authenticated;
grant select, insert, update, delete on public.listing_slots to authenticated;
grant select, insert, update, delete on public.leads to authenticated;
grant select, insert, update, delete on public.favorites to authenticated;
grant select, insert, update, delete on public.support_tickets to authenticated;

-- service_role: backend/admin (bypasses RLS but still needs grants for PostgREST)
grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.listings to service_role;
grant select, insert, update, delete on public.listing_views to service_role;
grant select, insert, update, delete on public.subscriptions to service_role;
grant select, insert, update, delete on public.listing_slots to service_role;
grant select, insert, update, delete on public.leads to service_role;
grant select, insert, update, delete on public.favorites to service_role;
grant select, insert, update, delete on public.support_tickets to service_role;
grant select, insert, update, delete on public.webhook_events to service_role;
grant select, insert, update, delete on public.admin_audit_logs to service_role;
