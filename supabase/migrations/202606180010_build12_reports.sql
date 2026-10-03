-- TrueCheck.ai Build 12
-- Versioned final report snapshots. Apply after all migrations through Build 11.

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  owner_profile_id uuid not null references public.user_profiles(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  case_assessment_id uuid not null references public.case_assessments(id) on delete restrict,
  report_version_number integer not null check (report_version_number > 0),
  report_schema_version text not null,
  report_content_version text not null,
  scoring_version text not null,
  prompt_version text,
  model_identifier text,
  overall_score integer not null check (overall_score between 0 and 100),
  concern_level text not null check (concern_level in ('Low', 'Moderate', 'High', 'Critical')),
  confidence_score integer not null check (confidence_score between 0 and 100),
  confidence_level text not null check (confidence_level in ('Low', 'Moderate', 'High')),
  evidence_completeness integer not null check (evidence_completeness between 0 and 100),
  evidence_completeness_level text not null check (evidence_completeness_level in ('Low', 'Moderate', 'High')),
  component_scores jsonb not null,
  report_body jsonb not null,
  source_fingerprints jsonb not null,
  generated_at timestamptz not null default now(),
  unique (case_id, report_version_number)
);

create index if not exists reports_case_version_idx
  on public.reports(case_id, report_version_number desc);
create index if not exists reports_user_generated_idx
  on public.reports(auth_user_id, generated_at desc);

alter table public.reports enable row level security;

revoke all on table public.reports from anon;
revoke all on table public.reports from authenticated;
grant select on table public.reports to authenticated;

create policy "Users can read reports for their own cases"
  on public.reports
  for select
  to authenticated
  using (
    (select auth.uid()) = auth_user_id
    and exists (
      select 1 from public.cases
      where cases.id = reports.case_id
        and cases.auth_user_id = (select auth.uid())
    )
  );

comment on table public.reports is
  'Immutable final report snapshots written by trusted server code. Raw transcripts, private notes, secrets, account email, and provider identifiers are intentionally excluded from report_body.';
