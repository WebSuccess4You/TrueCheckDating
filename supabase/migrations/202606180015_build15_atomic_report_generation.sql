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
  order by created_at desc limit 1 for update;

  if not found then
    select * into v_entitlement from public.entitlements
    where user_id = p_user_id and case_id is null
      and entitlement_type = 'membership' and status = 'active'
      and starts_at <= pg_catalog.now()
      and (ends_at is null or ends_at > pg_catalog.now())
    order by created_at desc limit 1 for update;
  end if;

  if v_entitlement.id is null then
    return query select 'no_access'::text, null::integer;
    return;
  end if;
  if v_entitlement.usage_limit is not null
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

  update public.entitlements
  set usage_count = usage_count + 1, updated_at = pg_catalog.now()
  where id = v_entitlement.id;

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
