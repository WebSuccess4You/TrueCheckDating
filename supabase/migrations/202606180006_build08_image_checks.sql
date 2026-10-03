-- TrueCheck.ai Build 08 — Guided Reverse Image Checker
-- Owner-readable records are written by trusted server actions only.

create table if not exists public.image_checks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  owner_profile_id uuid not null references public.user_profiles(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed')),
  result_category text check (
    result_category is null
    or result_category in (
      'no_meaningful_match',
      'same_identity_match',
      'different_identity_match',
      'many_unrelated_profiles',
      'stock_or_public_image',
      'unclear'
    )
  ),
  source_links jsonb not null default '[]'::jsonb,
  notes_ciphertext text,
  notes_iv text,
  notes_hash text,
  encryption_version text,
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
  constraint image_checks_encrypted_notes_check check (
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
  constraint image_checks_source_links_array_check check (
    jsonb_typeof(source_links) = 'array'
    and jsonb_array_length(source_links) <= 3
  ),
  constraint image_checks_completed_fields_check check (
    status <> 'completed'
    or (
      result_category is not null
      and component_score is not null
      and summary is not null
      and safety_acknowledged_at is not null
      and completed_at is not null
    )
  )
);

create index if not exists image_checks_auth_user_updated_idx
  on public.image_checks(auth_user_id, updated_at desc);

create index if not exists image_checks_case_idx
  on public.image_checks(case_id);

alter table public.image_checks enable row level security;

revoke all on table public.image_checks from anon;
revoke all on table public.image_checks from authenticated;

grant select on table public.image_checks to authenticated;

create policy "Users can read their own image checks"
  on public.image_checks
  for select
  to authenticated
  using (
    (select auth.uid()) = auth_user_id
    and exists (
      select 1
      from public.cases
      where cases.id = image_checks.case_id
        and cases.auth_user_id = (select auth.uid())
    )
  );

-- Normal authenticated users cannot insert, update, or delete rows directly.
-- Trusted server code writes image checks after verifying case ownership.

create trigger image_checks_set_updated_at
before update on public.image_checks
for each row execute procedure public.set_updated_at();

comment on table public.image_checks is
  'Owner-readable guided reverse image findings. Source links are user supplied and are not independently verified. Written by trusted server code after ownership verification.';
