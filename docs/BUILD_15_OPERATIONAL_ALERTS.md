# Build 15 operational email alerts

AI analysis failures and failures processing signature-verified Stripe webhooks
attempt plain-text email through Resend. Unsigned/invalid webhooks do not email.
Existing failure responses and Stripe's 500/retry behavior remain unchanged.
No migration or new package is required.

Messages contain only an allowlisted category, timestamp, and generated UUID.
They exclude raw exception messages, provider bodies, customer email, case IDs,
transcript, evidence quotes, payment details, and keys. Recipient is a privately
configured operator. No provider error body or recipient is logged.

## Setup and live verification

Set RESEND_API_KEY, OPERATIONS_ALERT_FROM, OPERATIONS_ALERT_TO in .env.local.
Initially use onboarding@resend.dev and your Resend signup email. Never share
.env.local. Restart the dev server after installing or changing configuration.

```powershell
node --env-file=.env.local tests/manual/operational-alert.mjs
```

This throws and catches a synthetic service failure and uses the same sender as
application failures. It does not call OpenAI/Stripe or write database records.
Provider acceptance does not prove inbox delivery: verify matching request ID in
your inbox/spam. Live test remains pending. Use a verified sender before launch.

## Limitations and rollback

Transport is awaited, bounded to five seconds, and rejects redirects. Delivery
failure cannot replace the original application failure response. All settings
absent disables email; partial/invalid configuration fails safely with a fixed
warning at application callers. A fifteen-minute cooldown per category per Node
process reserves an attempt before awaiting, preventing local concurrent fan-out.
Failed attempts consume the cooldown too. No durable queue/retry or shared
cross-instance throttle exists. Provider quotas and shared monitoring must be
configured before multi-instance deployment. This patch does not cover uptime,
database outages, backup failures, cost spikes, or every report/deletion failure.
It is a focused alert path, not a complete monitoring system.

Rollback: restore prior analysis-actions.ts and Stripe webhook route, or remove
all three email settings and restart. Existing sanitized DB records remain.
Tests cover private-field exclusion, invalid metadata, concurrency, cooldown,
disabled configuration, and safe HTTP/network failure.

## Database restore checkpoint — October 1, 2026

Owner restored a physical backup into TestProject2. Verified 3 auth users,
3 profiles, 1 case, 1 submission, 11 analyses, 4 reports, 1 entitlement.
All 21 public tables retained RLS; five Build 15 functions allowed service_role
execution and denied anon/authenticated. Test3 saw zero cases; owner saw one.
Original encryption key decrypted 372 characters with GCM authentication and
keyed content hash verified. No plaintext sent to AI. Temporary credential file
and test project deleted. Storage objects, auth configuration, external provider
settings, and a full restored-app login were outside this database test.

## Patch validation

Review workspace: 53 test files / 194 tests passed; full ESLint and TypeScript
passed; changed-file Prettier checks passed; webpack production build passed.
No real email was sent from the review workspace. Windows npm check and actual
inbox receipt remain pending. No UI changes were made in this patch.
