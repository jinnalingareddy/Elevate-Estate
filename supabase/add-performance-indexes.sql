-- Performance indexes for EstateElevate
-- Run these in Supabase SQL Editor → New query → Run
-- All statements use IF NOT EXISTS so they are safe to re-run.

-- 1. View deduplication: speeds up the 24-hour unique-view check in incrementViews()
CREATE INDEX IF NOT EXISTS idx_listing_views_dedup
  ON listing_views (listing_id, ip_hash, viewed_at DESC);

-- 2. Dashboard & analytics: speeds up view aggregation queries by listing_id + date
CREATE INDEX IF NOT EXISTS idx_listing_views_listing_viewed
  ON listing_views (listing_id, viewed_at DESC);

-- 3. Agent listings queries: speeds up getAgentListings() and admin listings count
CREATE INDEX IF NOT EXISTS idx_listings_agent_status
  ON listings (agent_id, status);

-- 4. Status + sort: speeds up public listing browse (getListings sort by featured/created_at)
CREATE INDEX IF NOT EXISTS idx_listings_status_featured_created
  ON listings (status, featured DESC, created_at DESC);

-- 5. Slug lookup: speeds up getListingBySlug() — slug is likely already unique-indexed,
--    but adding it explicitly if not present.
CREATE INDEX IF NOT EXISTS idx_listings_slug
  ON listings (slug);

-- 6. City search: speeds up search-suggestions ilike query.
--    Requires pg_trgm extension (enabled by default on Supabase).
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_listings_city_trgm
  ON listings USING gin (city gin_trgm_ops);

-- 7. Leads by listing: speeds up agent listings page lead-count aggregation
CREATE INDEX IF NOT EXISTS idx_leads_listing_id
  ON leads (listing_id);

-- 10. Leads by agent + status: speeds up status-filtered COUNT queries and
--     the get_agent_lead_stats() RPC function.
CREATE INDEX IF NOT EXISTS idx_leads_agent_status
  ON leads (agent_id, status);

-- 11. Leads by agent + created_at: speeds up getAgentLeads() ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_leads_agent_created
  ON leads (agent_id, created_at DESC);

-- 8. Subscriptions by agent: speeds up getAvailableSlots() / getListingLimitInfo()
CREATE INDEX IF NOT EXISTS idx_subscriptions_agent_id
  ON subscriptions (agent_id);

-- 9. Listing slots by agent: speeds up getAvailableSlots() slot count
CREATE INDEX IF NOT EXISTS idx_listing_slots_agent_active
  ON listing_slots (agent_id, active, expires_at)
  WHERE active = true AND listing_id IS NULL;
