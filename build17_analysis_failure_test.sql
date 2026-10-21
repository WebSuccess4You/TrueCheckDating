BEGIN;
\i supabase/migrations/202610120003_build17_atomic_membership_analyses.sql
SELECT current_database() AS test_database, 'migration_loaded_temporarily' AS test_stage;
CREATE TEMP TABLE build17_test_ids (submission_id uuid, analysis_id uuid);
WITH inserted AS (INSERT INTO public.chat_submissions (case_id, owner_profile_id, auth_user_id, content_ciphertext, content_iv, content_character_count, content_hash, consent_version, consent_acknowledged_at) VALUES ('c18c0218-f766-4121-bc22-e74584a210e4', 'dec2f672-f09a-41f4-8023-bd2b32a442ae', '00000000-0000-4000-8000-000000017001', 'build17-test-placeholder-ciphertext', 'build17-test-iv', 100, repeat('a',64), 'build17-test', now()) RETURNING id) INSERT INTO build17_test_ids (submission_id) SELECT id FROM inserted;
WITH created AS (
  INSERT INTO public.chat_analyses (
    case_id, chat_submission_id, owner_profile_id, auth_user_id,
    status, prompt_version, model_identifier, schema_version, request_id
  )
  SELECT
    'c18c0218-f766-4121-bc22-e74584a210e4'::uuid,
    submission_id,
    'dec2f672-f09a-41f4-8023-bd2b32a442ae'::uuid,
    '00000000-0000-4000-8000-000000017001'::uuid,
    'processing', 'build17-test', 'test-model', '1.0',
    pg_catalog.gen_random_uuid()
  FROM build17_test_ids
  RETURNING id
)
UPDATE build17_test_ids
SET analysis_id = (SELECT id FROM created);
UPDATE public.membership_usage_periods
SET analysis_reserved = analysis_reserved + 1
WHERE id = '4514c66c-e323-4c55-ae67-8095c1488e6c'
  AND user_id = '00000000-0000-4000-8000-000000017001';

INSERT INTO public.membership_analysis_reservations (
  analysis_id, membership_usage_period_id, user_id, status
)
SELECT analysis_id,
       '4514c66c-e323-4c55-ae67-8095c1488e6c'::uuid,
       '00000000-0000-4000-8000-000000017001'::uuid,
       'reserved'
FROM build17_test_ids;

SELECT analysis_count, analysis_reserved
FROM public.membership_usage_periods
WHERE id = '4514c66c-e323-4c55-ae67-8095c1488e6c';
SELECT public.finalize_membership_analysis_reservation(
  analysis_id,
  '00000000-0000-4000-8000-000000017001'::uuid,
  'failed',
  jsonb_build_object(
    'risk_score', 25,
    'concern_level', 'low',
    'confidence_score', 80,
    'confidence_level', 'high',
    'evidence_completeness', 75,
    'summary', 'Build 17 simulated analysis.',
    'category_scores', '{}'::jsonb,
    'red_flags', '[]'::jsonb,
    'protective_signals', '[]'::jsonb,
    'recommended_actions', '[]'::jsonb,
    'limitations', '[]'::jsonb,
    'model_identifier', 'test-model',
    'input_token_count', 100,
    'output_token_count', 50
  )
) AS finalization_outcome
FROM build17_test_ids;

SELECT analysis_count, analysis_reserved
FROM public.membership_usage_periods
WHERE id = '4514c66c-e323-4c55-ae67-8095c1488e6c';
SELECT public.finalize_membership_analysis_reservation(
  analysis_id,
  '00000000-0000-4000-8000-000000017001'::uuid,
  'failed',
  jsonb_build_object('risk_score',25,'concern_level','low','confidence_score',80,'confidence_level','high','evidence_completeness',75,'summary','Duplicate test','category_scores','{}'::jsonb,'red_flags','[]'::jsonb,'protective_signals','[]'::jsonb,'recommended_actions','[]'::jsonb,'limitations','[]'::jsonb)
) AS duplicate_outcome
FROM build17_test_ids;

SELECT analysis_count, analysis_reserved
FROM public.membership_usage_periods
WHERE id = '4514c66c-e323-4c55-ae67-8095c1488e6c';
ROLLBACK;
