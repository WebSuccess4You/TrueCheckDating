-- TrueCheck.ai Build 10
-- Versioned deterministic combined scoring and preliminary results.
-- Apply after all migrations through Build 09.

create table if not exists public.case_assessments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  owner_profile_id uuid not null references public.user_profiles(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('not_ready', 'preliminary')),
  overall_score integer check (overall_score is null or overall_score between 0 and 100),
  concern_level text check (
    concern_level is null or concern_level in ('Low', 'Moderate', 'High', 'Critical')
  ),
  confidence_score integer not null check (confidence_score between 0 and 100),
  confidence_level text not null check (confidence_level in ('Low', 'Moderate', 'High')),
  evidence_completeness integer not null check (evidence_completeness between 0 and 100),
  evidence_completeness_level text not null check (
    evidence_completeness_level in ('Low', 'Moderate', 'High')
  ),
  available_weight integer not null check (available_weight between 0 and 100),
  component_scores jsonb not null,
  completed_sources jsonb not null,
  missing_sources jsonb not null,
  source_fingerprints jsonb not null,
  scoring_version text not null,
  limitations jsonb not null,
  created_at timestamptz not null default now(),
  constraint case_assessments_preliminary_fields_check check (
    status <> 'preliminary'
    or (overall_score is not null and concern_level is not null)
  )
);

create index if not exists case_assessments_case_created_idx
  on public.case_assessments(case_id, created_at desc);

create index if not exists case_assessments_user_created_idx
  on public.case_assessments(auth_user_id, created_at desc);

alter table public.case_assessments enable row level security;

revoke all on table public.case_assessments from anon;
revoke all on table public.case_assessments from authenticated;
grant select on table public.case_assessments to authenticated;

create policy "Users can read assessments for their own cases"
  on public.case_assessments
  for select
  to authenticated
  using (
    (select auth.uid()) = auth_user_id
    and exists (
      select 1
      from public.cases
      where cases.id = case_assessments.case_id
        and cases.auth_user_id = (select auth.uid())
    )
  );

comment on table public.case_assessments is
  'Versioned deterministic preliminary concern results. Written only by trusted server code and readable only by the owning authenticated user.';
