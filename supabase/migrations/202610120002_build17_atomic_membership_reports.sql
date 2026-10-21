-- Apply after Build 15 atomic admin audit. One report consumes one allowance.
create or replace function public.create_report_with_allowance(
  p_user_id uuid,
  p_case_id uuid,
  p_assessment_id uuid,
  p_snapshot jsonb
)
returns table(outcome text, report_version integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_case public.cases%rowtype;
  v_assessment public.case_assessments%rowtype;
  v_entitlement public.entitlements%rowtype;
  v_entitlement_id uuid;
  v_membership_usage public.membership_usage_periods%rowtype;
  v_subscription public.subscriptions%rowtype;
  v_version integer;
begin
  -- The case lock serializes version numbers for this case. An entitlement
  -- row lock also serializes membership usage across different cases.
  select * into v_case from public.cases
  where id = p_case_id and auth_user_id = p_user_id and status = 'active'
  for update;
  if not found then
    return query select 'case_unavailable'::text, null::integer;
    return;
  end if;

  select * into v_assessment from public.case_assessments
  where id = p_assessment_id and case_id = p_case_id
    and auth_user_id = p_user_id and status = 'preliminary'
    and id = (
      select a.id from public.case_assessments a
      where a.case_id = p_case_id and a.auth_user_id = p_user_id
      order by a.created_at desc, a.id desc limit 1
    )
  limit 1;
  if not found then
    return query select 'assessment_unavailable'::text, null::integer;
    return;
  end if;

  select * into v_entitlement from public.entitlements
  where user_id = p_user_id and case_id = p_case_id
    and entitlement_type = 'case_full_report' and status = 'active'
    and starts_at <= pg_catalog.now()
    and (ends_at is null or ends_at > pg_catalog.now())
    and (usage_limit is null or usage_count < usage_limit)
  order by created_at desc limit 1 for update;

  if not found then
    select * into v_entitlement from public.entitlements
    where user_id = p_user_id and case_id is null
      and entitlement_type = 'membership' and status = 'active'
      and starts_at <= pg_catalog.now()
      and (ends_at is null or ends_at > pg_catalog.now())
      and source_type = 'subscription'
      and exists (
        select 1 from public.subscriptions s
        join public.membership_usage_periods m on m.subscription_id = s.id and m.user_id = s.user_id
        where s.id = public.entitlements.source_id
          and s.user_id = p_user_id
          and s.status in ('active', 'trialing', 'past_due')
          and m.period_start = s.current_period_start
          and m.period_end = s.current_period_end
          and m.period_start <= pg_catalog.now()
          and m.period_end > pg_catalog.now()
      )
    order by created_at desc limit 1;
  end if;

  v_entitlement_id := v_entitlement.id;

  if v_entitlement.entitlement_type = 'membership' then
    select * into v_subscription
    from public.subscriptions
    where id = v_entitlement.source_id
      and user_id = p_user_id
      and status in ('active', 'trialing', 'past_due')
    for update;
    if not found then
      return query select 'no_access'::text, null::integer;
      return;
    end if;
    select * into v_entitlement
    from public.entitlements
    where id = v_entitlement_id
      and user_id = p_user_id
      and source_type = 'subscription'
      and source_id = v_subscription.id
      and entitlement_type = 'membership'
      and status = 'active'
      and starts_at <= pg_catalog.now()
      and (ends_at is null or ends_at > pg_catalog.now())
    for update;
    if not found then
      return query select 'no_access'::text, null::integer;
      return;
    end if;
    select m.* into v_membership_usage
    from public.membership_usage_periods m
    join public.subscriptions s
      on s.id = m.subscription_id
     and s.user_id = m.user_id
    where s.id = v_entitlement.source_id
      and s.user_id = p_user_id
      and s.status in ('active', 'trialing', 'past_due')
      and m.period_start = s.current_period_start
      and m.period_end = s.current_period_end
      and m.period_start <= pg_catalog.now()
      and m.period_end > pg_catalog.now()
    for update of m;
  end if;
  if v_entitlement.id is null then
    return query select 'no_access'::text, null::integer;
    return;
  end if;
  if v_entitlement.entitlement_type = 'membership' then
    if v_membership_usage.id is null then
      return query select 'no_access'::text, null::integer;
      return;
    end if;
    if v_membership_usage.report_count >= v_membership_usage.report_limit then
      return query select 'limited'::text, null::integer;
      return;
    end if;
  elsif v_entitlement.usage_limit is not null
    and v_entitlement.usage_count >= v_entitlement.usage_limit then
    return query select 'limited'::text, null::integer;
    return;
  end if;

  if p_snapshot is null or pg_catalog.jsonb_typeof(p_snapshot) <> 'object' then
    raise exception 'Invalid report snapshot';
  end if;

  select coalesce(max(r.report_version_number), 0) + 1 into v_version
  from public.reports r where r.case_id = p_case_id;

  insert into public.reports (
    case_id, owner_profile_id, auth_user_id, case_assessment_id,
    report_version_number, report_schema_version, report_content_version,
    scoring_version, prompt_version, model_identifier, overall_score,
    concern_level, confidence_score, confidence_level, evidence_completeness,
    evidence_completeness_level, component_scores, report_body,
    source_fingerprints, generated_at
  ) values (
    p_case_id, v_case.owner_profile_id, p_user_id, p_assessment_id,
    v_version, p_snapshot->>'report_schema_version',
    p_snapshot->>'report_content_version', v_assessment.scoring_version,
    p_snapshot->>'prompt_version', p_snapshot->>'model_identifier',
    v_assessment.overall_score, v_assessment.concern_level,
    v_assessment.confidence_score, v_assessment.confidence_level,
    v_assessment.evidence_completeness,
    v_assessment.evidence_completeness_level,
    p_snapshot->'component_scores', p_snapshot->'report_body',
    v_assessment.source_fingerprints,
    (p_snapshot->>'generated_at')::timestamptz
  );

  if v_entitlement.entitlement_type = 'membership' then
    update public.membership_usage_periods m
    set report_count = m.report_count + 1,
        updated_at = pg_catalog.now()
    from public.subscriptions s
    where m.id = v_membership_usage.id
      and s.id = m.subscription_id
      and s.user_id = p_user_id
      and s.current_period_start = m.period_start
      and s.current_period_end = m.period_end
      and m.period_start <= pg_catalog.now()
      and m.period_end > pg_catalog.now()
      and m.report_count < m.report_limit;
    if not found then
      raise exception 'Membership report allowance changed during generation';
    end if;
  else
    update public.entitlements
    set usage_count = usage_count + 1,
        updated_at = pg_catalog.now()
    where id = v_entitlement.id;
  end if;

  insert into public.usage_events (
    user_id, case_id, event_type, quantity, entitlement_id
  ) values (
    p_user_id, p_case_id, 'final_report_generated', 1, v_entitlement.id
  );

  return query select 'created'::text, v_version;
end;
$$;

revoke all on function public.create_report_with_allowance(uuid, uuid, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.create_report_with_allowance(uuid, uuid, uuid, jsonb)
  to service_role;

-- Prevent entitlement usage from exceeding its configured allowance.
alter table public.entitlements add constraint entitlements_usage_within_limit_check check (usage_limit is null or usage_count <= usage_limit);
