-- TrueCheck.ai Build 03
-- User profiles and versioned consent records for Supabase Auth.

create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email_normalized text not null,
  display_name text,
  role text not null default 'user' check (role in ('user', 'support', 'admin')),
  account_status text not null default 'active'
    check (account_status in ('active', 'suspended', 'deletion_pending', 'deleted')),
  terms_version text,
  privacy_version text,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  adult_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.user_profiles(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null
    check (consent_type in ('adult_confirmation', 'terms', 'privacy')),
  document_version text not null,
  accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists consent_records_auth_user_id_idx
  on public.consent_records(auth_user_id, accepted_at desc);

alter table public.user_profiles enable row level security;
alter table public.consent_records enable row level security;

revoke all on table public.user_profiles from anon;
revoke all on table public.consent_records from anon;
revoke all on table public.user_profiles from authenticated;
revoke all on table public.consent_records from authenticated;

grant select on table public.user_profiles to authenticated;
grant select on table public.consent_records to authenticated;

create policy "Users can read their own profile"
  on public.user_profiles
  for select
  to authenticated
  using ((select auth.uid()) = auth_user_id);

create policy "Users can read their own consent records"
  on public.consent_records
  for select
  to authenticated
  using ((select auth.uid()) = auth_user_id);

create or replace function public.set_updated_at()
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

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_uuid uuid;
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  accepted_time timestamptz := now();
  terms_version_value text := nullif(metadata ->> 'terms_version', '');
  privacy_version_value text := nullif(metadata ->> 'privacy_version', '');
begin
  insert into public.user_profiles (
    auth_user_id,
    email_normalized,
    terms_version,
    privacy_version,
    terms_accepted_at,
    privacy_accepted_at,
    adult_confirmed_at
  ) values (
    new.id,
    lower(coalesce(new.email, '')),
    terms_version_value,
    privacy_version_value,
    case when metadata ->> 'terms_accepted' = 'true' then accepted_time end,
    case when metadata ->> 'privacy_accepted' = 'true' then accepted_time end,
    case when metadata ->> 'adult_confirmed' = 'true' then accepted_time end
  )
  returning id into profile_uuid;

  if metadata ->> 'adult_confirmed' = 'true' then
    insert into public.consent_records (
      profile_id,
      auth_user_id,
      consent_type,
      document_version,
      accepted_at
    ) values (
      profile_uuid,
      new.id,
      'adult_confirmation',
      '18-plus-confirmation-v1',
      accepted_time
    );
  end if;

  if metadata ->> 'terms_accepted' = 'true' and terms_version_value is not null then
    insert into public.consent_records (
      profile_id,
      auth_user_id,
      consent_type,
      document_version,
      accepted_at
    ) values (
      profile_uuid,
      new.id,
      'terms',
      terms_version_value,
      accepted_time
    );
  end if;

  if metadata ->> 'privacy_accepted' = 'true' and privacy_version_value is not null then
    insert into public.consent_records (
      profile_id,
      auth_user_id,
      consent_type,
      document_version,
      accepted_at
    ) values (
      profile_uuid,
      new.id,
      'privacy',
      privacy_version_value,
      accepted_time
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();
