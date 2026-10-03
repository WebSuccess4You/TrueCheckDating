# Database Schema

This is a logical schema. Codex should implement it through migrations and may adjust names to match framework conventions while preserving the rules.

## 1. `user_profiles`

Authentication credentials should remain in the authentication provider. This table stores application profile data.

Fields:

- `id` UUID primary key
- `auth_user_id` unique provider user identifier
- `email_normalized`
- `display_name` nullable
- `role` enum: `user`, `support`, `admin`
- `account_status` enum: `active`, `suspended`, `deletion_pending`, `deleted`
- `terms_version`
- `privacy_version`
- `terms_accepted_at`
- `privacy_accepted_at`
- `adult_confirmed_at`
- `created_at`
- `updated_at`
- `deleted_at` nullable

## 2. `cases`

- `id` UUID
- `owner_user_id` foreign key
- `private_nickname`
- `communication_platform` nullable
- `claimed_name_or_alias` nullable
- `claimed_location` nullable
- `communication_started_on` nullable
- `status` enum: `active`, `archived`, `deletion_pending`
- `completion_percent`
- `latest_concern_level` nullable
- `latest_risk_score` nullable
- `latest_report_id` nullable
- `created_at`
- `updated_at`
- `deleted_at` nullable

Index owner and updated time.

## 3. `consent_records`

- `id`
- `user_id`
- `case_id` nullable
- `consent_type`
- `document_version`
- `accepted_at`
- `ip_hash` nullable
- `user_agent_hash` nullable

Do not store unnecessary raw IP or user-agent values.

## 4. `chat_submissions`

- `id`
- `case_id`
- `submitted_by_user_id`
- `source_type` enum: `pasted_text`, future types reserved
- `content_encrypted`
- `content_character_count`
- `content_hash`
- `save_source_text` boolean
- `submitted_at`
- `deleted_at` nullable

Avoid duplicating raw content in analysis records.

## 5. `chat_analyses`

- `id`
- `case_id`
- `chat_submission_id`
- `status` enum: `queued`, `processing`, `completed`, `failed`, `rejected`
- `risk_score`
- `concern_level`
- `confidence_level`
- `confidence_score`
- `evidence_completeness`
- `summary`
- `red_flags_json`
- `protective_signals_json`
- `recommended_actions_json`
- `limitations_json`
- `category_scores_json`
- `prompt_version`
- `model_identifier`
- `schema_version`
- `input_token_count` nullable
- `output_token_count` nullable
- `estimated_cost_minor_units` nullable
- `request_id`
- `error_code` nullable
- `created_at`
- `completed_at` nullable

Evidence excerpts stored in JSON must be minimized and traceable to supplied content.

## 6. `profile_checks`

- `id`
- `case_id`
- `answers_json`
- `contradictions_json`
- `component_score`
- `evidence_completeness`
- `completed_at` nullable
- `version`
- `created_at`
- `updated_at`

## 7. `video_checks`

- `id`
- `case_id`
- `answers_json`
- `avoidance_patterns_json`
- `protective_signals_json`
- `component_score`
- `evidence_completeness`
- `completed_at` nullable
- `version`
- `created_at`
- `updated_at`

## 8. `image_checks`

- `id`
- `case_id`
- `owner_profile_id`
- `auth_user_id`
- `status`: `in_progress` or `completed`
- `result_category` enum:
  - `no_meaningful_match`
  - `same_identity_match`
  - `different_identity_match`
  - `many_unrelated_profiles`
  - `stock_or_public_image`
  - `unclear`
- `source_links` JSON array, maximum three
- `notes_ciphertext` nullable
- `notes_iv` nullable
- `notes_hash` nullable
- `encryption_version` nullable
- `component_score`
- `evidence_completeness`
- `summary` nullable
- `safety_acknowledged_at` nullable
- `completed_at` nullable
- `version`
- `created_at`
- `updated_at`

The system does not represent user-entered links as verified facts. Private notes are encrypted before storage.

## 9. `reports`

- `id`
- `case_id`
- `owner_user_id`
- `report_version_number`
- `scoring_version`
- `prompt_version`
- `model_identifier`
- `overall_score`
- `concern_level`
- `confidence_score`
- `confidence_level`
- `evidence_completeness`
- `component_scores_json`
- `report_body_json`
- `generated_at`
- `is_outdated`
- `pdf_storage_key` nullable
- `deleted_at` nullable

## 10. `products`

- `id`
- `code` unique
- `name`
- `product_type` enum: `one_time_report`, `membership`
- `price_minor_units`
- `currency`
- `active`
- `entitlement_rules_json`
- `created_at`
- `updated_at`

## 11. `payment_customers`

- `id`
- `user_id`
- `provider`
- `provider_customer_id`
- `created_at`

## 12. `payments`

- `id`
- `user_id`
- `case_id` nullable
- `product_id`
- `provider_payment_id`
- `status`
- `amount_minor_units`
- `currency`
- `created_at`
- `updated_at`

Provider identifiers are unique. Webhook processing must be idempotent.

## 13. `subscriptions`

- `id`
- `user_id`
- `product_id`
- `provider_subscription_id`
- `status`
- `current_period_start`
- `current_period_end`
- `cancel_at_period_end`
- `created_at`
- `updated_at`

## 14. `entitlements`

- `id`
- `user_id`
- `case_id` nullable
- `entitlement_type`
- `source_type`
- `source_id`
- `starts_at`
- `ends_at` nullable
- `usage_limit` nullable
- `usage_count`
- `status`
- `created_at`
- `updated_at`

## 15. `usage_events`

- `id`
- `user_id`
- `case_id` nullable
- `event_type`
- `quantity`
- `entitlement_id` nullable
- `created_at`

## 16. `prompt_versions`

- `id`
- `prompt_key`
- `version`
- `system_prompt`
- `developer_instructions`
- `output_schema_json`
- `active`
- `created_at`
- `activated_at` nullable

Prompt changes require versioning and evaluation.

## 17. `audit_events`

- `id`
- `actor_user_id` nullable
- `target_user_id` nullable
- `case_id` nullable
- `event_type`
- `metadata_json`
- `created_at`

Do not place full private content in metadata.

## 18. `system_errors`

- `id`
- `request_id`
- `error_class`
- `sanitized_message`
- `service`
- `retryable`
- `resolved_at` nullable
- `created_at`

## Ownership and Authorization

- Every user query filters by authenticated owner.
- Server routes recheck ownership.
- Database row-level security should be used where supported.
- Administrative roles do not automatically grant private-content access.
- Deletion operations must use transactions.

## Retention

Exact retention is governed by `PRIVACY_SECURITY.md`.
