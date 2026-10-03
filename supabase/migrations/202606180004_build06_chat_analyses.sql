-- TrueCheck.ai Build 06
-- Server-written, owner-readable AI chat analyses.
-- Apply after Build 03, Build 04, and Build 05 migrations.

alter table public.chat_submissions
  drop constraint if exists chat_submissions_status_check;

alter table public.chat_submissions
  add constraint chat_submissions_status_check
  check (
    status in (
      'stored',
      'pending_ai_connection',
      'analysis_processing',
      'analysis_completed',
      'analysis_failed'
    )
  );

create table if not exists public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_key text not null,
  version text not null,
  description text not null,
  schema_version text not null,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (prompt_key, version)
);

alter table public.prompt_versions enable row level security;
revoke all on table public.prompt_versions from anon;
revoke all on table public.prompt_versions from authenticated;

insert into public.prompt_versions (
  prompt_key,
  version,
  description,
  schema_version,
  active
)
values (
  'truecheck-chat-analyzer',
  '2026-06-18.1',
  'Build 06 evidence-based chat analyzer. The exact prompt is version-controlled in src/lib/ai/prompt.ts.',
  '1.0',
  true
)
on conflict (prompt_key, version) do update
set
  description = excluded.description,
  schema_version = excluded.schema_version,
  active = excluded.active;

update public.prompt_versions
set active = false
where prompt_key = 'truecheck-chat-analyzer'
  and version <> '2026-06-18.1';

create table if not exists public.chat_analyses (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  chat_submission_id uuid not null references public.chat_submissions(id) on delete cascade,
  owner_profile_id uuid not null references public.user_profiles(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'completed', 'failed', 'rejected')),
  risk_score integer check (risk_score between 0 and 100),
  concern_level text check (concern_level in ('low', 'moderate', 'high', 'critical')),
  confidence_score integer check (confidence_score between 0 and 100),
  confidence_level text check (confidence_level in ('low', 'moderate', 'high')),
  evidence_completeness integer check (evidence_completeness between 0 and 100),
  summary text,
  category_scores jsonb,
  red_flags jsonb,
  protective_signals jsonb,
  recommended_actions jsonb,
  limitations jsonb,
  prompt_version text not null,
  model_identifier text not null,
  schema_version text not null,
  input_token_count integer check (input_token_count is null or input_token_count >= 0),
  output_token_count integer check (output_token_count is null or output_token_count >= 0),
  provider_response_id text,
  request_id uuid not null unique,
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint chat_analyses_completed_fields_check check (
    status <> 'completed'
    or (
      risk_score is not null
      and concern_level is not null
      and confidence_score is not null
      and confidence_level is not null
      and evidence_completeness is not null
      and summary is not null
      and category_scores is not null
      and red_flags is not null
      and protective_signals is not null
      and recommended_actions is not null
      and limitations is not null
      and completed_at is not null
    )
  )
);

create index if not exists chat_analyses_submission_created_idx
  on public.chat_analyses(chat_submission_id, created_at desc);

create index if not exists chat_analyses_user_created_idx
  on public.chat_analyses(auth_user_id, created_at desc);

create index if not exists chat_analyses_case_created_idx
  on public.chat_analyses(case_id, created_at desc);

create unique index if not exists chat_analyses_one_active_per_submission_idx
  on public.chat_analyses(chat_submission_id)
  where status in ('queued', 'processing');

alter table public.chat_analyses enable row level security;

revoke all on table public.chat_analyses from anon;
revoke all on table public.chat_analyses from authenticated;
grant select on table public.chat_analyses to authenticated;

create policy "Users can read analyses for their own chat submissions"
  on public.chat_analyses
  for select
  to authenticated
  using (
    (select auth.uid()) = auth_user_id
    and exists (
      select 1
      from public.cases
      where cases.id = chat_analyses.case_id
        and cases.auth_user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.chat_submissions
      where chat_submissions.id = chat_analyses.chat_submission_id
        and chat_submissions.case_id = chat_analyses.case_id
        and chat_submissions.auth_user_id = (select auth.uid())
    )
  );

comment on table public.chat_analyses is
  'Structured AI findings. Written only by trusted server code using the service role; readable only by the owning authenticated user.';
