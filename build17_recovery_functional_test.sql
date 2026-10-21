-- Build 17: rollback-only functional recovery testing.
-- Temporary fixtures and assertions will be added next.
\set ON_ERROR_STOP on
BEGIN;
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

-- Recovery functional assertions.
DO
$$
DECLARE
  v_recovered integer;
  v_second integer;
BEGIN
  v_recovered := public.recover_expired_membership_analysis_reservations('00000000-0000-4000-8000-000000017001');
  IF v_recovered <> 1 THEN RAISE EXCEPTION 'Expected one recovered reservation, got %', v_recovered; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.chat_analyses WHERE id = '00000000-0000-4000-8000-000000017101' AND status = 'failed' AND error_code = 'analysis_lease_expired') THEN RAISE EXCEPTION 'Analysis was not marked failed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.membership_analysis_reservations WHERE analysis_id = '00000000-0000-4000-8000-000000017101' AND status = 'released' AND finalized_at IS NOT NULL) THEN RAISE EXCEPTION 'Reservation was not released'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.membership_usage_periods WHERE id = '4514c66c-e323-4c55-ae67-8095c1488e6c' AND analysis_count = 6 AND analysis_reserved = 0) THEN RAISE EXCEPTION 'Membership counters incorrect'; END IF;
  v_second := public.recover_expired_membership_analysis_reservations('00000000-0000-4000-8000-000000017001');
  IF v_second <> 0 THEN RAISE EXCEPTION 'Duplicate recovery returned %', v_second; END IF;
  RAISE NOTICE 'PASS: expired recovery, counters, and duplicate protection';
END;
$$;

ROLLBACK;
