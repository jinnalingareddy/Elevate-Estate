-- Fix: Remove spatial_ref_sys from PostgREST exposure.
-- This PostGIS system table cannot have RLS enabled (not owned by project user).
-- Revoking access from anon/authenticated hides it from the REST API entirely,
-- which resolves the Supabase rls_disabled_in_public security warning.
-- PostGIS internal functions are unaffected (they run as the extension owner).

REVOKE ALL ON public.spatial_ref_sys FROM anon, authenticated;

-- Verify: should return NO rows.
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false;
