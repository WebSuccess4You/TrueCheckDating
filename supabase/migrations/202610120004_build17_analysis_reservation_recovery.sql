-- Build 17: Recover abandoned AI Chat Analysis reservations.
-- Recovery functionality will be added and tested before deployment.

-- Lease expiration makes a reservation eligible for recovery review only.
alter table public.membership_analysis_reservations
  add column lease_expires_at timestamptz;

-- Efficiently find outstanding reservations eligible for recovery review.
create index if not exists membership_analysis_reservations_lease_idx
  on public.membership_analysis_reservations (lease_expires_at)
  where status = 'reserved';

-- Initial processing deadline for newly created reservations.
-- Recovery must independently verify eligibility before releasing usage.
alter table public.membership_analysis_reservations
  alter column lease_expires_at set default (now() + interval '15 minutes');

-- Recovery security framework; cleanup remains disabled.
create or replace function public.recover_expired_membership_analysis_reservations(
  p_user_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as
$$
declare
  v_analysis_id uuid;
  v_analysis_status text;
  v_reservation public.membership_analysis_reservations%rowtype;
  v_usage public.membership_usage_periods%rowtype;
begin
  if p_user_id is null then
    raise exception 'User ID is required for reservation recovery';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 202606180013));

  -- Lock an eligible analysis before examining its reservation.
  select a.id, a.status
    into v_analysis_id, v_analysis_status
  from public.chat_analyses a
  where a.auth_user_id = p_user_id
    and a.status = 'processing'
    and exists (
      select 1
      from public.membership_analysis_reservations r
      where r.analysis_id = a.id
        and r.user_id = p_user_id
        and r.status = 'reserved'
        and r.lease_expires_at < pg_catalog.now()
    )
  order by a.created_at, a.id
  limit 1
  for update of a;

  -- Lock and recheck the reservation after locking its analysis.
  if v_analysis_id is not null then
    select r.* into v_reservation
    from public.membership_analysis_reservations r
    where r.analysis_id = v_analysis_id
      and r.user_id = p_user_id
      and r.status = 'reserved'
      and r.lease_expires_at < pg_catalog.now()
    for update;
  end if;

  -- Lock the billing-period counters after the analysis and reservation.
  if v_reservation.id is not null then
    select m.* into v_usage
    from public.membership_usage_periods m
    where m.id = v_reservation.membership_usage_period_id
      and m.user_id = p_user_id
    for update;

    if not found then
      raise exception 'Recovery membership usage period not found';
    end if;

    if v_usage.analysis_reserved < 1 then
      raise exception 'Recovery reservation counter is inconsistent';
    end if;
  end if;

  -- Recover only the locked, still-eligible reservation.
  if v_reservation.id is null then
    return 0;
  end if;

  update public.chat_analyses
  set status = 'failed',
      error_code = 'analysis_lease_expired',
      completed_at = pg_catalog.now()
  where id = v_analysis_id
    and auth_user_id = p_user_id
    and status = 'processing';

  if not found then
    raise exception 'Recovery analysis status changed unexpectedly';
  end if;

  update public.membership_usage_periods
  set analysis_reserved = analysis_reserved - 1,
      updated_at = pg_catalog.now()
  where id = v_usage.id
    and user_id = p_user_id
    and analysis_reserved > 0;

  if not found then
    raise exception 'Recovery reservation counter changed unexpectedly';
  end if;

  update public.membership_analysis_reservations
  set status = 'released',
      finalized_at = pg_catalog.now()
  where id = v_reservation.id
    and user_id = p_user_id
    and status = 'reserved';

  if not found then
    raise exception 'Recovery reservation changed unexpectedly';
  end if;

  return 1;
end;
$$;

revoke all on function public.recover_expired_membership_analysis_reservations(uuid) from public, anon, authenticated;
grant execute on function public.recover_expired_membership_analysis_reservations(uuid) to service_role;
