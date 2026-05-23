-- Data API grants required by Supabase's new default (enforced Oct 30, 2026)
-- Apply this in the Supabase dashboard > SQL Editor, or via: supabase db push
-- Without these, PostgREST returns 42501 for each missing grant.
-- RLS policies still enforce row-level access on top of these.

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

-- Verify grants applied:
-- select grantee, table_name, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public'
-- order by table_name, grantee;
