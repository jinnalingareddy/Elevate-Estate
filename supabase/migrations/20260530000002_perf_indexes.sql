-- Performance Indexes for Listing Search and View Tracking
--
-- These indexes optimize three critical query patterns:
-- 1. idx_listings_status_city: serves getListings() which filters by status='active' and city
-- 2. idx_listings_agent_status: serves getAgentListings() which filters by agent_id, status, ordered by created_at
-- 3. idx_listing_views_listing_date: serves get_agent_view_stats() RPC which joins listing_views by listing_id and filters by viewed_at

-- Partial index for active listings filtered by city (most common search pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_status_city
  ON listings(status, city)
  WHERE status = 'active';

-- Composite index for agent's listing management queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_agent_status
  ON listings(agent_id, status, created_at DESC);

-- Index for view tracking queries by listing and time window
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listing_views_listing_date
  ON listing_views(listing_id, viewed_at DESC);
