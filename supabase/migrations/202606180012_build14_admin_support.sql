-- TrueCheck.ai Build 14
-- Server-only administration, support diagnostics, and sanitized system errors.
-- Apply after all migrations through Build 13.

create index if not exists user_profiles_email_normalized_idx
  on public.user_profiles(email_normalized);
create index if not exists user_profiles_role_status_idx
  on public.user_profiles(role, account_status);
create index if not exists chat_analyses_failure_review_idx
  on public.chat_analyses(status, created_at desc)
  where status in ('failed', 'rejected');

create table if not exists public.system_errors (
  id uuid primary key default gen_random_uuid(),
  request_id text,
  error_class text not null,
  sanitized_message text not null,
  service text not null,
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high', 'critical')),
  retryable boolean not null default false,
  resolved_at timestamptz,
  resolved_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint system_errors_sanitized_message_length_check
    check (char_length(sanitized_message) between 1 and 500)
);

create index if not exists system_errors_open_created_idx
  on public.system_errors(created_at desc)
  where resolved_at is null;
create index if not exists system_errors_service_created_idx
  on public.system_errors(service, created_at desc);

alter table public.system_errors enable row level security;
revoke all on table public.system_errors from anon, authenticated;

comment on table public.system_errors is
  'Server-only operational errors. Messages must be sanitized and must never contain transcripts, private notes, passwords, tokens, API keys, payment-card data, or raw webhook bodies.';
comment on column public.system_errors.request_id is
  'Optional operational request identifier used to correlate sanitized diagnostics without private content.';

comment on column public.user_profiles.role is
  'Build 14 staff authorization role. Role assignment is performed only through trusted database administration, never by the browser.';
