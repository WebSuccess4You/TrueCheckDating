-- Build 17: rollback-only functional recovery testing.
-- Temporary fixtures and assertions will be added next.
\set ON_ERROR_STOP on
BEGIN;
\i supabase/migrations/202610120003_build17_atomic_membership_analyses.sql
\i supabase/migrations/202610120004_build17_analysis_reservation_recovery.sql
-- Temporary chat submission fixture.
INSERT INTO public.chat_submissions (
  id, case_id, owner_profile_id, auth_user_id, source_type,
  content_ciphertext, content_iv, content_character_count, content_hash,
  encryption_version, consent_version, consent_acknowledged_at, status
)
SELECT
  '00000000-0000-4000-8000-000000017103'::uuid,
  case_id, owner_profile_id, auth_user_id, source_type,
  content_ciphertext, content_iv, content_character_count, content_hash,
  encryption_version, consent_version, consent_acknowledged_at, status
FROM public.chat_submissions
WHERE id = '011a1413-a729-46f6-a7be-f567b20ae4ca'::uuid;

-- Temporary analysis fixture.
INSERT INTO public.chat_analyses (
  id, case_id, chat_submission_id, owner_profile_id, auth_user_id,
  status, prompt_version, model_identifier, schema_version, request_id
) VALUES (
  '00000000-0000-4000-8000-000000017101',
  'c18c0218-f766-4121-bc22-e74584a210e4',
  '00000000-0000-4000-8000-000000017103',
  'dec2f672-f09a-41f4-8023-bd2b32a442ae',
  '00000000-0000-4000-8000-000000017001',
  'processing', 'build17-recovery-fixture', 'local-test-model', '1.0',
  '00000000-0000-4000-8000-000000017102'
);

-- Expired membership reservation fixture.
UPDATE public.membership_usage_periods
SET analysis_reserved = analysis_reserved + 1
WHERE id = '4514c66c-e323-4c55-ae67-8095c1488e6c'
  AND user_id = '00000000-0000-4000-8000-000000017001';

INSERT INTO public.membership_analysis_reservations (
  analysis_id, membership_usage_period_id, user_id, status, lease_expires_at
) VALUES (
  '00000000-0000-4000-8000-000000017101',
  '4514c66c-e323-4c55-ae67-8095c1488e6c',
  '00000000-0000-4000-8000-000000017001',
  'reserved', pg_catalog.now() - interval '1 minute'
);

-- Late-finalization protection test.
DO
$$
DECLARE
  v_recovered integer;
  v_outcome text;
BEGIN
  v_recovered := public.recover_expired_membership_analysis_reservations('00000000-0000-4000-8000-000000017001');
  IF v_recovered <> 1 THEN RAISE EXCEPTION 'Expected one recovery, got %', v_recovered; END IF;
  v_outcome := public.finalize_membership_analysis_reservation('00000000-0000-4000-8000-000000017101', '00000000-0000-4000-8000-000000017001', 'completed', '{"risk_score":0,"concern_level":"low","confidence_score":0,"confidence_level":"low","evidence_completeness":0,"summary":"Late recovery test","category_scores":{},"red_flags":[],"protective_signals":[],"recommended_actions":[],"limitations":[]}'::jsonb);
  IF v_outcome <> 'already_finalized' THEN RAISE EXCEPTION 'Unexpected late finalization outcome: %', v_outcome; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.chat_analyses WHERE id = '00000000-0000-4000-8000-000000017101' AND status = 'failed' AND error_code = 'analysis_lease_expired') THEN RAISE EXCEPTION 'Recovered analysis was overwritten'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.membership_analysis_reservations WHERE analysis_id = '00000000-0000-4000-8000-000000017101' AND status = 'released') THEN RAISE EXCEPTION 'Reservation status changed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.membership_usage_periods WHERE id = '4514c66c-e323-4c55-ae67-8095c1488e6c' AND analysis_count = 6 AND analysis_reserved = 0) THEN RAISE EXCEPTION 'Membership counters changed'; END IF;
  RAISE NOTICE 'PASS: late finalization rejected without consuming allowance';
END;
$$;

ROLLBACK;
