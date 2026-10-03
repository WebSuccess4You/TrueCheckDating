-- Serialize each account's analysis starts so concurrent requests share one limit.
-- Existing analyses, including failed attempts, count toward the rolling hour.
create or replace function public.start_chat_analysis_with_limit(
  p_user_id uuid,
  p_case_id uuid,
  p_submission_id uuid,
  p_owner_profile_id uuid,
  p_request_id uuid,
  p_prompt_version text,
  p_model_identifier text,
  p_schema_version text,
  p_hourly_limit integer
)
returns table(outcome text, analysis_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_id uuid;
begin
  if p_hourly_limit is null or p_hourly_limit < 1 then
    raise exception 'Invalid analysis limit';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text, 202606180013)
  );

  if not exists (
    select 1 from public.cases c
    join public.chat_submissions s on s.case_id = c.id
    where c.id = p_case_id
      and c.auth_user_id = p_user_id
      and c.status = 'active'
      and s.id = p_submission_id
      and s.auth_user_id = p_user_id
      and s.owner_profile_id = p_owner_profile_id
  ) then
    return query select 'not_found'::text, null::uuid;
    return;
  end if;

  if exists (
    select 1 from public.chat_analyses a
    where a.chat_submission_id = p_submission_id
      and a.status in ('queued', 'processing')
  ) then
    return query select 'in_progress'::text, null::uuid;
    return;
  end if;

  select count(*) into v_count
  from public.chat_analyses a
  where a.auth_user_id = p_user_id
    and a.created_at >= pg_catalog.now() - interval '1 hour';

  if v_count >= p_hourly_limit then
    return query select 'limited'::text, null::uuid;
    return;
  end if;

  insert into public.chat_analyses (
    case_id, chat_submission_id, owner_profile_id, auth_user_id,
    status, prompt_version, model_identifier, schema_version, request_id
  ) values (
    p_case_id, p_submission_id, p_owner_profile_id, p_user_id,
    'processing', p_prompt_version, p_model_identifier, p_schema_version, p_request_id
  ) returning id into v_id;

  return query select 'started'::text, v_id;
end;
$$;

revoke all on function public.start_chat_analysis_with_limit(
  uuid, uuid, uuid, uuid, uuid, text, text, text, integer
) from public, anon, authenticated;
grant execute on function public.start_chat_analysis_with_limit(
  uuid, uuid, uuid, uuid, uuid, text, text, text, integer
) to service_role;
