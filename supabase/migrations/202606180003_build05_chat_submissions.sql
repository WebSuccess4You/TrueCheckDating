-- TrueCheck.ai Build 05
-- Owner-scoped pasted conversation storage without AI analysis.
-- Conversation plaintext is encrypted by the server before insertion.

create table if not exists public.chat_submissions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  owner_profile_id uuid not null references public.user_profiles(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null default 'pasted_text'
    check (source_type = 'pasted_text'),
  content_ciphertext text not null check (char_length(content_ciphertext) > 20),
  content_iv text not null check (char_length(content_iv) > 8),
  content_character_count integer not null check (content_character_count between 80 and 12000),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  encryption_version text not null default 'aes-256-gcm-v1'
    check (encryption_version = 'aes-256-gcm-v1'),
  consent_version text not null,
  consent_acknowledged_at timestamptz not null,
  status text not null default 'pending_ai_connection'
    check (status in ('stored', 'pending_ai_connection')),
  created_at timestamptz not null default now()
);

create index if not exists chat_submissions_case_created_idx
  on public.chat_submissions(case_id, created_at desc);

create index if not exists chat_submissions_auth_user_created_idx
  on public.chat_submissions(auth_user_id, created_at desc);

alter table public.chat_submissions enable row level security;

revoke all on table public.chat_submissions from anon;
revoke all on table public.chat_submissions from authenticated;

grant select on table public.chat_submissions to authenticated;
grant insert (
  case_id,
  owner_profile_id,
  auth_user_id,
  source_type,
  content_ciphertext,
  content_iv,
  content_character_count,
  content_hash,
  encryption_version,
  consent_version,
  consent_acknowledged_at
) on public.chat_submissions to authenticated;
grant delete on table public.chat_submissions to authenticated;

create policy "Users can read chat submissions in their own cases"
  on public.chat_submissions
  for select
  to authenticated
  using (
    (select auth.uid()) = auth_user_id
    and exists (
      select 1
      from public.cases
      where cases.id = chat_submissions.case_id
        and cases.auth_user_id = (select auth.uid())
    )
  );

create policy "Users can create chat submissions in their own cases"
  on public.chat_submissions
  for insert
  to authenticated
  with check (
    (select auth.uid()) = auth_user_id
    and owner_profile_id = (
      select id
      from public.user_profiles
      where auth_user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.cases
      where cases.id = chat_submissions.case_id
        and cases.auth_user_id = (select auth.uid())
        and cases.owner_profile_id = chat_submissions.owner_profile_id
    )
  );

create policy "Users can delete chat submissions in their own cases"
  on public.chat_submissions
  for delete
  to authenticated
  using (
    (select auth.uid()) = auth_user_id
    and exists (
      select 1
      from public.cases
      where cases.id = chat_submissions.case_id
        and cases.auth_user_id = (select auth.uid())
    )
  );
