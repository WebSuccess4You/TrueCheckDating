\set ON_ERROR_STOP on
BEGIN;

DO $test$
DECLARE
  v_user uuid := '00000000-0000-4000-8000-000000017001';
  v_case uuid := 'c18c0218-f766-4121-bc22-e74584a210e4';
  v_assessment uuid;
  v_entitlement uuid;
  v_reports bigint;
  v_events bigint;
  v_result record;
  v_count integer;
  i integer;
BEGIN
  IF current_database() <> 'truecheck_build17_test' THEN
    RAISE EXCEPTION 'Run only in the local truecheck_build17_test database';
  END IF;

  PERFORM 1 FROM public.cases
  WHERE id = v_case AND auth_user_id = v_user AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active local test case missing';
  END IF;

  SELECT id INTO v_assessment
  FROM public.case_assessments
  WHERE case_id = v_case AND auth_user_id = v_user
  ORDER BY created_at DESC, id DESC LIMIT 1;

  IF v_assessment IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.case_assessments
    WHERE id = v_assessment AND status = 'preliminary'
  ) THEN
    RAISE EXCEPTION 'Latest local assessment must be preliminary';
  END IF;

  SELECT id INTO v_entitlement
  FROM public.entitlements
  WHERE user_id = v_user AND case_id = v_case
    AND entitlement_type = 'case_full_report'
  ORDER BY created_at DESC LIMIT 1;

  IF v_entitlement IS NULL THEN
    RAISE EXCEPTION 'Local individual entitlement missing';
  END IF;

  -- Isolate individual access; all changes are rolled back.
  UPDATE public.entitlements SET status = 'inactive'
  WHERE user_id = v_user AND id <> v_entitlement;

  UPDATE public.entitlements
  SET status = 'active', usage_count = 0, usage_limit = 4,
      starts_at = now() - interval '1 minute',
      ends_at = now() + interval '30 days'
  WHERE id = v_entitlement;

  SELECT count(*) INTO v_reports FROM public.reports
  WHERE case_id = v_case;

  SELECT count(*) INTO v_events FROM public.usage_events
  WHERE user_id = v_user AND case_id = v_case
    AND event_type = 'final_report_generated';

  FOR i IN 1..5 LOOP
    SELECT * INTO v_result
    FROM public.create_report_with_allowance(
      v_user, v_case, v_assessment,
      jsonb_build_object(
        'report_schema_version', '1.0',
        'report_content_version', 'allowance-test',
        'component_scores', '{}'::jsonb,
        'report_body', '{}'::jsonb,
        'generated_at', now()
      )
    );

    IF i <= 4 THEN
      IF v_result.outcome IS DISTINCT FROM 'created'
         OR v_result.report_version IS NULL THEN
        RAISE EXCEPTION 'Generation % failed: %', i, v_result.outcome;
      END IF;
    ELSE
      IF v_result.outcome IS DISTINCT FROM 'no_access'
         OR v_result.report_version IS NOT NULL THEN
        RAISE EXCEPTION 'Fifth generation was not rejected correctly';
      END IF;
    END IF;
  END LOOP;

  SELECT usage_count INTO v_count FROM public.entitlements
  WHERE id = v_entitlement;
  IF v_count <> 4 THEN
    RAISE EXCEPTION 'Expected usage_count 4, got %', v_count;
  END IF;

  IF (SELECT count(*) FROM public.reports WHERE case_id = v_case)
     <> v_reports + 4 THEN
    RAISE EXCEPTION 'Expected exactly four new reports';
  END IF;

  IF (SELECT count(*) FROM public.usage_events
      WHERE user_id = v_user AND case_id = v_case
        AND event_type = 'final_report_generated') <> v_events + 4 THEN
    RAISE EXCEPTION 'Expected exactly four new report usage events';
  END IF;

  RAISE NOTICE 'PASS: four reports created; fifth rejected; counters and events correct';
END;
$test$;

ROLLBACK;