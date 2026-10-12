-- WOS security hardening for Supabase
-- Purpose: remove direct PostgREST access to internal WOS tables while the app
-- continues to use its server-side PostgreSQL connection (DATABASE_URL).
-- Run once in Supabase SQL Editor after reviewing the branch.

begin;

alter table public.wines enable row level security;
alter table public.outlets enable row level security;
alter table public.wine_outlets enable row level security;
alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.import_batches enable row level security;

-- WOS does not use Supabase client-side data access. Block direct API access.
revoke all on table public.wines from anon, authenticated;
revoke all on table public.outlets from anon, authenticated;
revoke all on table public.wine_outlets from anon, authenticated;
revoke all on table public.users from anon, authenticated;
revoke all on table public.sessions from anon, authenticated;
revoke all on table public.import_batches from anon, authenticated;

-- Avoid privileges inherited via PUBLIC.
revoke all on table public.wines from public;
revoke all on table public.outlets from public;
revoke all on table public.wine_outlets from public;
revoke all on table public.users from public;
revoke all on table public.sessions from public;
revoke all on table public.import_batches from public;

-- Identity sequences should not be callable from API roles either.
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all sequences in schema public from public;

commit;
