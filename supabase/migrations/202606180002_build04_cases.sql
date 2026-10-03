-- TrueCheck.ai Build 04
-- Private cases, owner-only Row Level Security, archive support, and transactional deletion.

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.user_profiles(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  private_nickname text not null check (char_length(private_nickname) between 2 and 80),
  communication_platform text check (communication_platform is null or char_length(communication_platform) <= 80),
  claimed_name_or_alias text check (claimed_name_or_alias is null or char_length(claimed_name_or_alias) <= 100),
  claimed_location text check (claimed_location is null or char_length(claimed_location) <= 120),
  communication_started_on date check (communication_started_on is null or communication_started_on <= current_date),
  status text not null default 'active' check (status in ('active', 'archived')),
  completion_percent integer not null default 0 check (completion_percent between 0 and 100),
  latest_concern_level text check (
    latest_concern_level is null or latest_concern_level in ('Low', 'Moderate', 'High', 'Critical')
  ),
  latest_risk_score integer check (latest_risk_score is null or latest_risk_score between 0 and 100),
  lawful_use_acknowledged_at timestamptz not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cases_archive_timestamp_check check (
    (status = 'active' and archived_at is null) or
    (status = 'archived' and archived_at is not null)
  )
);

create index if not exists cases_auth_user_updated_idx
  on public.cases(auth_user_id, updated_at desc);

create index if not exists cases_auth_user_status_idx
  on public.cases(auth_user_id, status, updated_at desc);

alter table public.cases enable row level security;

revoke all on table public.cases from anon;
revoke all on table public.cases from authenticated;

grant select on table public.cases to authenticated;
grant insert (
  owner_profile_id,
  auth_user_id,
  private_nickname,
  communication_platform,
  claimed_name_or_alias,
  claimed_location,
  communication_started_on,
  lawful_use_acknowledged_at
) on public.cases to authenticated;
grant update (
  private_nickname,
  communication_platform,
  claimed_name_or_alias,
  claimed_location,
  communication_started_on,
  status,
  archived_at
) on public.cases to authenticated;
grant delete on table public.cases to authenticated;

create policy "Users can read their own cases"
  on public.cases
  for select
  to authenticated
  using ((select auth.uid()) = auth_user_id);

create policy "Users can create their own cases"
  on public.cases
  for insert
  to authenticated
  with check (
    (select auth.uid()) = auth_user_id
    and owner_profile_id = (
      select id from public.user_profiles
      where auth_user_id = (select auth.uid())
    )
  );

create policy "Users can update their own cases"
  on public.cases
  for update
  to authenticated
  using ((select auth.uid()) = auth_user_id)
  with check (
    (select auth.uid()) = auth_user_id
    and owner_profile_id = (
      select id from public.user_profiles
      where auth_user_id = (select auth.uid())
    )
  );

create policy "Users can delete their own cases"
  on public.cases
  for delete
  to authenticated
  using ((select auth.uid()) = auth_user_id);

drop trigger if exists cases_set_updated_at on public.cases;
create trigger cases_set_updated_at
before update on public.cases
for each row execute procedure public.set_updated_at();

create or replace function public.delete_owned_case(target_case_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  delete from public.cases
  where id = target_case_id
    and auth_user_id = (select auth.uid());

  get diagnostics deleted_count = row_count;
  return deleted_count = 1;
end;
$$;

revoke all on function public.delete_owned_case(uuid) from public;
grant execute on function public.delete_owned_case(uuid) to authenticated;
