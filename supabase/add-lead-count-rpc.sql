-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Creates a single GROUP BY aggregation function so the app can fetch
-- per-listing lead counts with one round-trip instead of fetching every row.

CREATE OR REPLACE FUNCTION get_lead_counts_for_listings(listing_ids uuid[])
RETURNS TABLE (listing_id uuid, count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT listing_id, COUNT(*)::bigint AS count
  FROM   leads
  WHERE  listing_id = ANY(listing_ids)
  GROUP  BY listing_id
$$;
