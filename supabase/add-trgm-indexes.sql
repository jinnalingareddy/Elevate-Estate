-- pg_trgm GIN indexes for ILIKE substring search performance
-- Run once in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
--
-- These indexes allow %...% wildcard ILIKE queries (used in the listings
-- search filters for city, neighborhood, state, alcaldia_municipio) to use
-- GIN index scans instead of full sequential table scans.

-- Enable the trigram extension (safe to run even if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- City and alcaldia_municipio are searched together via OR in getListings
CREATE INDEX IF NOT EXISTS idx_listings_city_trgm
  ON listings USING GIN (city gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_listings_alcaldia_trgm
  ON listings USING GIN (alcaldia_municipio gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_listings_neighborhood_trgm
  ON listings USING GIN (neighborhood gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_listings_state_trgm
  ON listings USING GIN (state gin_trgm_ops);

-- Also index the search-suggestions fallback query path
CREATE INDEX IF NOT EXISTS idx_listings_city_status
  ON listings (status, city)
  WHERE status = 'active';
