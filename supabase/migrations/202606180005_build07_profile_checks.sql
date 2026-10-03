-- TrueCheck.ai Build 07
-- Profile Consistency Check: structured questionnaire, owner-only storage,
-- deterministic component scores, and private notes.
-- Apply after Build 03, Build 04, Build 05, and Build 06 migrations.

create table if not exists public.profile_checks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  owner_profile_id uuid not null references public.user_profiles(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed')),
  answers jsonb not null default '{}'::jsonb,
  contradictions jsonb not null default '[]'::jsonb,
  protective_signals jsonb not null default '[]'::jsonb,
  component_score integer check (component_score is null or component_score between 0 and 100),
  evidence_completeness integer not null default 0 check (evidence_completeness between 0 and 100),
  summary text,
  version text not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id),
  constraint profile_checks_completed_fields_check check (
    status <> 'completed'
    or (
      component_score is not null
      and summary is not null
      and completed_at is not null
    )
  )
);

create index if not exists profile_checks_auth_user_updated_idx
  on public.profile_checks(auth_user_id, updated_at desc);

create index if not exists profile_checks_case_idx
  on public.profile_checks(case_id);

alter table public.profile_checks enable row level security;

revoke all on table public.profile_checks from anon;
revoke all on table public.profile_checks from authenticated;

grant select on table public.profile_checks to authenticated;

create policy "Users can read their own profile checks"
  on public.profile_checks
  for select
  to authenticated
  using (
    (select auth.uid()) = auth_user_id
    and exists (
      select 1
      from public.cases
      where cases.id = profile_checks.case_id
        and cases.auth_user_id = (select auth.uid())
    )
  );

-- Normal authenticated users cannot insert, update, or delete rows directly.
-- Trusted server code writes profile checks with the service role after it
-- verifies case ownership.

create trigger profile_checks_set_updated_at
before update on public.profile_checks
for each row execute procedure public.set_updated_at();

comment on table public.profile_checks is
  'Owner-readable Profile Consistency Check results. Written by trusted server code after ownership verification.';
