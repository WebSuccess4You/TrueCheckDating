-- TrueCheck.ai Build 13
-- Durable account-deletion receipts and sanitized audit events.
-- Apply after all migrations through Build 12.

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  profile_id uuid references public.user_profiles(id) on delete set null,
  email_hash text not null,
  status_token_hash text not null unique,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'completed', 'failed')),
  requested_at timestamptz not null default now(),
  processing_started_at timestamptz,
  purge_after timestamptz not null default now(),
  completed_at timestamptz,
  failed_at timestamptz,
  membership_cancellation_count integer not null default 0
    check (membership_cancellation_count >= 0),
  failure_code text,
  updated_at timestamptz not null default now()
);

create index if not exists account_deletion_requests_status_idx
  on public.account_deletion_requests(status, purge_after);
create index if not exists account_deletion_requests_user_idx
  on public.account_deletion_requests(auth_user_id, requested_at desc);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  case_id uuid references public.cases(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_events_created_idx
  on public.audit_events(created_at desc);
create index if not exists audit_events_type_idx
  on public.audit_events(event_type, created_at desc);

alter table public.account_deletion_requests enable row level security;
alter table public.audit_events enable row level security;

revoke all on table public.account_deletion_requests from anon, authenticated;
revoke all on table public.audit_events from anon, authenticated;

-- These tables are intentionally server-only. The public deletion-status page
-- hashes its opaque receipt token and reads through the service-role client.

create or replace function public.set_account_deletion_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists account_deletion_requests_set_updated_at
  on public.account_deletion_requests;
create trigger account_deletion_requests_set_updated_at
before update on public.account_deletion_requests
for each row execute procedure public.set_account_deletion_updated_at();

comment on table public.account_deletion_requests is
  'Server-only deletion queue and opaque status receipt. It stores a one-way email hash and never stores case content, raw email, password, or payment-card data.';
comment on table public.audit_events is
  'Sanitized security and administrative audit events. Metadata must not contain transcripts, private notes, passwords, secret keys, or raw email addresses.';
