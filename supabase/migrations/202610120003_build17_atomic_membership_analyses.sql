-- TrueCheckDating.com Build 17
-- Atomic monthly AI Chat Analysis reservations and finalization.
-- Preserve existing hourly rate limits and independent report allowances.
-- Local development only; do not deploy before testing.
-- Reserve monthly allowance before calling OpenAI.
-- Preserve the existing hourly analysis limit.
-- Lock the membership usage record to prevent concurrent overuse.
-- Count successful analyses; release failed or rejected reservations.
-- Finalize analysis status and usage counters atomically.
-- Never modify report_count when performing an AI analysis.
-- Restrict privileged functions to service_role.

-- Replace the Build 15 starter while preserving its RPC signature.
-- Monthly reservations will be created in the same transaction as analysis starts.
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
  v_subscription public.subscriptions%rowtype;
  v_entitlement public.entitlements%rowtype;
  v_usage public.membership_usage_periods%rowtype;
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
  select count(*) into v_count from public.chat_analyses a where a.auth_user_id = p_user_id and a.created_at >= pg_catalog.now() - interval '1 hour';
  if v_count >= p_hourly_limit then
    return query select 'limited'::text, null::uuid;
    return;
  end if;
  select s.* into v_subscription
  from public.subscriptions s
  join public.entitlements e
    on e.source_id = s.id
   and e.source_type = 'subscription'
   and e.entitlement_type = 'membership'
   and e.user_id = s.user_id
  join public.membership_usage_periods m
    on m.subscription_id = s.id
   and m.user_id = s.user_id
   and m.period_start = s.current_period_start
   and m.period_end = s.current_period_end
  where s.user_id = p_user_id
    and s.status in ('active', 'trialing', 'past_due')
    and e.status = 'active'
    and e.starts_at <= pg_catalog.now()
    and (e.ends_at is null or e.ends_at > pg_catalog.now())
    and m.period_start <= pg_catalog.now()
    and m.period_end > pg_catalog.now()
  order by s.updated_at desc
  limit 1;
  if v_subscription.id is not null then
    select * into v_subscription from public.subscriptions where id = v_subscription.id and user_id = p_user_id and status in ('active', 'trialing', 'past_due') for update;
  end if;
  if v_subscription.id is not null then
    select e.* into v_entitlement
    from public.entitlements e
    where e.user_id = p_user_id
      and e.entitlement_type = 'membership'
      and e.source_type = 'subscription'
      and e.source_id = v_subscription.id
      and e.status = 'active'
      and e.starts_at <= pg_catalog.now()
      and (e.ends_at is null or e.ends_at > pg_catalog.now())
    order by e.created_at desc
    limit 1
    for update;
  end if;
  if v_subscription.id is not null and v_entitlement.id is not null then
  select m.* into v_usage
    from public.membership_usage_periods m
    where m.subscription_id = v_subscription.id
      and m.user_id = p_user_id
      and m.period_start = v_subscription.current_period_start
      and m.period_end = v_subscription.current_period_end
      and m.period_start <= pg_catalog.now()
      and m.period_end > pg_catalog.now()
    for update;
  end if;
  if v_subscription.id is not null then
    if v_entitlement.id is null or v_usage.id is null then
      return query select 'no_access'::text, null::uuid;
      return;
    end if;
    if v_usage.analysis_count + v_usage.analysis_reserved >= v_usage.analysis_limit then
      return query select 'monthly_limited'::text, null::uuid;
      return;
    end if;
  end if;
  if v_subscription.id is null and exists (select 1 from public.entitlements e where e.user_id = p_user_id and e.entitlement_type = 'membership') then
    return query select 'no_access'::text, null::uuid;
    return;
  end if;
  -- Preserve Build 15 behavior for users without an eligible membership; apply monthly reservations only to eligible memberships.
  insert into public.chat_analyses (
    case_id, chat_submission_id, owner_profile_id, auth_user_id,
    status, prompt_version, model_identifier, schema_version, request_id
  ) values (
    p_case_id, p_submission_id, p_owner_profile_id, p_user_id,
    'processing', p_prompt_version, p_model_identifier,
    p_schema_version, p_request_id
  ) returning id into v_id;
  if v_usage.id is not null then
    update public.membership_usage_periods
    set analysis_reserved = analysis_reserved + 1,
        updated_at = pg_catalog.now()
    where id = v_usage.id
      and user_id = p_user_id;

    insert into public.membership_analysis_reservations (
      analysis_id,
      membership_usage_period_id,
      user_id,
      status
    ) values (
      v_id,
      v_usage.id,
      p_user_id,
      'reserved'
    );
  end if;

  return query select 'started'::text, v_id;
end;
$$;

revoke all on function public.start_chat_analysis_with_limit(uuid, uuid, uuid, uuid, uuid, text, text, text, integer) from public, anon, authenticated;
grant execute on function public.start_chat_analysis_with_limit(uuid, uuid, uuid, uuid, uuid, text, text, text, integer) to service_role;

-- Finalize a monthly analysis reservation exactly once.
-- A completed analysis consumes one allowance; a failed or rejected analysis releases it.
create or replace function public.finalize_membership_analysis_reservation(
  p_analysis_id uuid,
  p_user_id uuid,
  p_final_status text,
  p_analysis_result jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservation public.membership_analysis_reservations%rowtype;
  v_usage public.membership_usage_periods%rowtype;
  v_analysis_status text;
begin
  if p_analysis_id is null or p_user_id is null
     or p_final_status is null
     or p_final_status not in ('completed', 'failed', 'rejected') then
    raise exception 'Invalid analysis finalization parameters';
  end if;
  if p_final_status = 'completed' and (p_analysis_result is null or pg_catalog.jsonb_typeof(p_analysis_result) <> 'object') then
    raise exception 'Completed analysis requires a JSON result object';
  end if;
  if p_final_status = 'completed' and (p_analysis_result->>'risk_score' is null or p_analysis_result->>'concern_level' is null or p_analysis_result->>'confidence_score' is null or p_analysis_result->>'confidence_level' is null or p_analysis_result->>'evidence_completeness' is null or p_analysis_result->>'summary' is null or p_analysis_result->'category_scores' is null or p_analysis_result->'red_flags' is null or p_analysis_result->'protective_signals' is null or p_analysis_result->'recommended_actions' is null or p_analysis_result->'limitations' is null) then
    raise exception 'Completed analysis is missing required result fields';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 202606180013));
  select a.status into v_analysis_status
  from public.chat_analyses a
  where a.id = p_analysis_id
    and a.auth_user_id = p_user_id
  for update;

  if not found then
    return 'not_found';
  end if;


  select r.* into v_reservation
  from public.membership_analysis_reservations r
  where r.analysis_id = p_analysis_id
    and r.user_id = p_user_id
  for update;

  if not found then
    if exists (select 1 from public.entitlements e where e.user_id = p_user_id and e.entitlement_type = 'membership') then
      return 'missing_membership_reservation';
    end if;
    v_reservation.id := null;
  end if;

  if v_reservation.id is not null and v_reservation.status <> 'reserved' then
    return 'already_finalized';
  end if;
  if v_analysis_status <> 'processing' then
    return 'status_mismatch';
  end if;
  if v_reservation.id is not null then
  select m.* into v_usage
  from public.membership_usage_periods m
  where m.id = v_reservation.membership_usage_period_id
    and m.user_id = p_user_id
  for update;

  if not found then
    raise exception 'Analysis reservation billing period not found';
  end if;

  if v_usage.analysis_reserved < 1 then
    raise exception 'Analysis reservation counter is inconsistent';
  end if;
  end if;
  if p_final_status = 'completed' then
    update public.chat_analyses
    set status = 'completed',
        risk_score = (p_analysis_result->>'risk_score')::integer,
        concern_level = p_analysis_result->>'concern_level',
        confidence_score = (p_analysis_result->>'confidence_score')::integer,
        confidence_level = p_analysis_result->>'confidence_level',
        evidence_completeness = (p_analysis_result->>'evidence_completeness')::integer,
        summary = p_analysis_result->>'summary',
        category_scores = p_analysis_result->'category_scores',
        red_flags = p_analysis_result->'red_flags',
        protective_signals = p_analysis_result->'protective_signals',
        recommended_actions = p_analysis_result->'recommended_actions',
        limitations = p_analysis_result->'limitations',
        model_identifier = p_analysis_result->>'model_identifier',
        input_token_count = (p_analysis_result->>'input_token_count')::integer,
        output_token_count = (p_analysis_result->>'output_token_count')::integer,
        provider_response_id = p_analysis_result->>'provider_response_id',
        completed_at = pg_catalog.now(),
        error_code = null
    where id = p_analysis_id and auth_user_id = p_user_id;
  else
    update public.chat_analyses
    set status = p_final_status,
        error_code = coalesce(p_analysis_result->>'error_code', 'analysis_failed'),
        completed_at = pg_catalog.now()
    where id = p_analysis_id and auth_user_id = p_user_id;
  end if;
  if v_reservation.id is not null then
  update public.membership_usage_periods
  set analysis_reserved = analysis_reserved - 1,
      analysis_count = analysis_count +
        case when p_final_status = 'completed' then 1 else 0 end,
      updated_at = pg_catalog.now()
  where id = v_usage.id
    and user_id = p_user_id;

  update public.membership_analysis_reservations
  set status = case
        when p_final_status = 'completed' then 'consumed'
        else 'released'
      end,
      finalized_at = pg_catalog.now()
  where id = v_reservation.id
    and user_id = p_user_id;

  end if;

  return 'finalized';
end;
$$;


revoke all on function public.finalize_membership_analysis_reservation(uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.finalize_membership_analysis_reservation(uuid, uuid, text, jsonb) to service_role;
