-- TrueCheck.ai Build 09 — Video Call Verifier
-- Owner-readable records are written by trusted server actions only.

create table if not exists public.video_checks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  owner_profile_id uuid not null references public.user_profiles(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed')),
  answers jsonb not null default '{}'::jsonb,
  notes_ciphertext text,
  notes_iv text,
  notes_hash text,
  encryption_version text,
  avoidance_patterns jsonb not null default '[]'::jsonb,
  protective_signals jsonb not null default '[]'::jsonb,
  component_score integer check (
    component_score is null or component_score between 0 and 100
  ),
  evidence_completeness integer not null default 0
    check (evidence_completeness between 0 and 100),
  summary text,
  version text not null,
  safety_acknowledged_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id),
  constraint video_checks_answers_object_check check (
    jsonb_typeof(answers) = 'object'
  ),
  constraint video_checks_avoidance_array_check check (
    jsonb_typeof(avoidance_patterns) = 'array'
    and jsonb_array_length(avoidance_patterns) <= 8
  ),
  constraint video_checks_protective_array_check check (
    jsonb_typeof(protective_signals) = 'array'
    and jsonb_array_length(protective_signals) <= 8
  ),
  constraint video_checks_encrypted_notes_check check (
    (
      notes_ciphertext is null
      and notes_iv is null
      and notes_hash is null
      and encryption_version is null
    )
    or (
      notes_ciphertext is not null
      and notes_iv is not null
      and notes_hash is not null
      and encryption_version is not null
    )
  ),
  constraint video_checks_completed_fields_check check (
    status <> 'completed'
    or (
      component_score is not null
      and summary is not null
      and safety_acknowledged_at is not null
      and completed_at is not null
    )
  )
);

create index if not exists video_checks_auth_user_updated_idx
  on public.video_checks(auth_user_id, updated_at desc);

create index if not exists video_checks_case_idx
  on public.video_checks(case_id);

alter table public.video_checks enable row level security;

revoke all on table public.video_checks from anon;
revoke all on table public.video_checks from authenticated;

grant select on table public.video_checks to authenticated;

create policy "Users can read their own video checks"
  on public.video_checks
  for select
  to authenticated
  using (
    (select auth.uid()) = auth_user_id
    and exists (
      select 1
      from public.cases
      where cases.id = video_checks.case_id
        and cases.auth_user_id = (select auth.uid())
    )
  );

-- Normal authenticated users cannot insert, update, or delete rows directly.
-- Trusted server code writes checks after verifying case ownership.

create trigger video_checks_set_updated_at
before update on public.video_checks
for each row execute procedure public.set_updated_at();

comment on table public.video_checks is
  'Owner-readable video-call observations and deterministic concern indicators. TrueCheck.ai does not watch or record calls. Written by trusted server code after ownership verification.';
