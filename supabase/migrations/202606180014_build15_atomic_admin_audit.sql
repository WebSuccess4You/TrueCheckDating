-- Apply after Build 14. Status changes and their audit rows commit together.
create or replace function public.change_account_status_audited(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_next_status text,
  p_reason_code text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_previous_status text;
begin
  if p_actor_user_id = p_target_user_id
    or p_next_status not in ('active', 'suspended')
    or p_reason_code not in ('support_review', 'abuse_prevention', 'billing_risk', 'owner_request')
    or not exists (
      select 1 from public.user_profiles
      where auth_user_id = p_actor_user_id
        and role = 'admin'
        and account_status = 'active'
    ) then
    return false;
  end if;

  select account_status into v_previous_status
  from public.user_profiles
  where auth_user_id = p_target_user_id
    and role = 'user'
    and account_status in ('active', 'suspended')
  for update;

  if not found or v_previous_status = p_next_status then
    return false;
  end if;

  update public.user_profiles
  set account_status = p_next_status
  where auth_user_id = p_target_user_id;

  insert into public.audit_events (
    actor_user_id, target_user_id, event_type, metadata
  ) values (
    p_actor_user_id, p_target_user_id, 'admin_account_status_changed',
    pg_catalog.jsonb_build_object(
      'previous_status', v_previous_status,
      'next_status', p_next_status,
      'reason_code', p_reason_code
    )
  );
  return true;
end;
$$;

create or replace function public.resolve_system_error_audited(
  p_actor_user_id uuid,
  p_error_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not exists (
    select 1 from public.user_profiles
    where auth_user_id = p_actor_user_id
      and role = 'admin'
      and account_status = 'active'
  ) then
    return false;
  end if;

  update public.system_errors
  set resolved_at = pg_catalog.now(),
      resolved_by_user_id = p_actor_user_id
  where id = p_error_id and resolved_at is null
  returning id into v_id;

  if v_id is null then
    return false;
  end if;

  insert into public.audit_events (
    actor_user_id, event_type, metadata
  ) values (
    p_actor_user_id, 'admin_system_error_resolved',
    pg_catalog.jsonb_build_object('system_error_id', p_error_id)
  );
  return true;
end;
$$;

revoke all on function public.change_account_status_audited(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.change_account_status_audited(uuid, uuid, text, text)
  to service_role;
revoke all on function public.resolve_system_error_audited(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.resolve_system_error_audited(uuid, uuid)
  to service_role;
