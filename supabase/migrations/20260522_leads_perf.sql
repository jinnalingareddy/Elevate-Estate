-- ============================================================
-- Lead stats performance: composite indexes + single-query RPC
-- ============================================================
-- Problem: getLeadStats() was making 7 separate Supabase COUNT
-- queries per page load (even in Promise.all each is a separate
-- HTTP round-trip). This migration replaces them with one call.
-- ============================================================

-- 1. Composite index for status-filtered COUNT queries
--    Covers:  WHERE agent_id = ? AND status = ?
CREATE INDEX IF NOT EXISTS idx_leads_agent_status
  ON leads (agent_id, status);

-- 2. Composite index for the main leads fetch with ORDER BY
--    Covers:  WHERE agent_id = ? ORDER BY created_at DESC LIMIT N
CREATE INDEX IF NOT EXISTS idx_leads_agent_created
  ON leads (agent_id, created_at DESC);

-- 3. Single-query stats function — replaces 7 parallel HEAD requests
--    Returns all counts in one conditional-aggregation pass over the
--    agent's rows. STABLE so Postgres can cache within a transaction.
--    SECURITY INVOKER ensures RLS policies are enforced (same pattern
--    used by get_lead_counts_for_listings in this codebase).
CREATE OR REPLACE FUNCTION get_agent_lead_stats(p_agent_id uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT json_build_object(
    'total',      COUNT(*),
    'new',        COUNT(*) FILTER (WHERE status = 'new'),
    'contacted',  COUNT(*) FILTER (WHERE status = 'contacted'),
    'qualified',  COUNT(*) FILTER (WHERE status = 'qualified'),
    'closed',     COUNT(*) FILTER (WHERE status = 'closed'),
    'this_month', COUNT(*) FILTER (
                    WHERE created_at >= date_trunc('month', now())
                  ),
    'last_month', COUNT(*) FILTER (
                    WHERE created_at >= date_trunc('month', now()) - interval '1 month'
                      AND created_at <  date_trunc('month', now())
                  )
  )
  FROM leads
  WHERE agent_id = p_agent_id
$$;

-- Grant execute to authenticated users (matches Supabase RPC conventions)
GRANT EXECUTE ON FUNCTION get_agent_lead_stats(uuid) TO authenticated;
