-- Add listing_type to distinguish for-sale vs for-rent listings.
-- Run this in the Supabase SQL Editor. Safe to re-run (idempotent).

-- 1. Create the enum type (skip if already exists)
do $$ begin
  create type listing_type as enum ('for_sale', 'for_rent', 'both');
exception when duplicate_object then null;
end $$;

-- 2. Add the column (skip if already exists)
alter table public.listings
  add column if not exists listing_type listing_type not null default 'for_sale';

-- 3. Index for fast filtering (skip if already exists)
create index if not exists listings_type_idx on public.listings(listing_type);

-- 4. Verify
select slug, listing_type from public.listings order by created_at desc limit 10;
