# TrueCheck.ai Build 14 — Administration and Support

This package contains the coded TrueCheck.ai project through **Build 14**.

Build 14 is the planned **first full integrated live-testing checkpoint**. It contains all prior work:

- public pages
- registration, login, password reset, and consent records
- private cases and dashboard
- encrypted conversation submission
- OpenAI Chat Analyzer
- Profile Consistency Check
- Guided Reverse Image Checker
- Video Call Verifier
- combined preliminary scoring
- Stripe payments and entitlements
- final report and print-to-PDF export
- account deletion and privacy controls
- role-based administration and support

Do not repeat live setup in an older Build folder. Extract and use `TrueCheckAI_Build14` as the current project.

## What Build 14 Adds

- `/admin` aggregate operational overview
- `/admin/failures` sanitized failed-analysis and system-error review
- `/admin/support` exact-account support lookup
- `/admin/audit` administrator-only sanitized audit trail
- `support` and `admin` authorization enforcement
- normal-user rejection from administration routes
- support lookup limited to:
  - account status
  - role
  - account dates
  - aggregate case and analysis counts
  - payment status
  - membership status
  - active entitlement count
- no staff access to transcripts, private notes, image-search details, video answers, or report bodies
- administrator-only suspension and restoration of ordinary user accounts
- audited support searches, account-status changes, and system-error resolution
- server-only `system_errors` table
- sanitized OpenAI failure recording
- Build 14 migration and automated security-contract tests

## Required Software and Accounts

- Visual Studio Code
- Node.js 22.16 or newer supported LTS release
- npm 10 or newer
- a Supabase project
- an OpenAI API account and API key
- a Stripe account in **test mode**
- at least four test email addresses:
  - Account A: ordinary user
  - Account B: second ordinary user for privacy testing
  - Account C: disposable user for deletion testing
  - Account D: administrator
- optionally Account E for the support-only role test

## 1. Extract and Open Build 14

1. Extract `TrueCheckAI_Build14_Complete.zip`.
2. Open the extracted `TrueCheckAI_Build14` folder in Visual Studio Code.
3. Open `README.md`.
4. Press `Ctrl + Shift + V` for the formatted preview.
5. Select **Terminal → New Terminal**.

## 2. Create `.env.local`

Windows Command Prompt:

```bat
copy .env.example .env.local
```

PowerShell, Git Bash, macOS, or Linux:

```bash
cp .env.example .env.local
```

Never upload, email, screenshot, commit, or paste `.env.local` into chat.

## 3. Configure Supabase Values

In the Supabase project settings, copy these values into `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The service-role key is highly privileged and must remain server-only.

## 4. Apply All Migrations in Exact Order

Open **Supabase → SQL Editor** and run each complete file separately:

1. `supabase/migrations/202606180001_build03_auth_profiles.sql`
2. `supabase/migrations/202606180002_build04_cases.sql`
3. `supabase/migrations/202606180003_build05_chat_submissions.sql`
4. `supabase/migrations/202606180004_build06_chat_analyses.sql`
5. `supabase/migrations/202606180005_build07_profile_checks.sql`
6. `supabase/migrations/202606180006_build08_image_checks.sql`
7. `supabase/migrations/202606180007_build09_video_checks.sql`
8. `supabase/migrations/202606180008_build10_case_assessments.sql`
9. `supabase/migrations/202606180009_build11_payments_entitlements.sql`
10. `supabase/migrations/202606180010_build12_reports.sql`
11. `supabase/migrations/202606180011_build13_account_deletion.sql`
12. `supabase/migrations/202606180012_build14_admin_support.sql`

For every file:

1. Open it in VS Code.
2. Copy all SQL.
3. Paste into a new Supabase SQL Editor query.
4. Click **Run**.
5. Stop if Supabase reports an error.
6. Continue only after success.

Do not rerun migrations that already succeeded unless the SQL is explicitly written to be safely rerunnable and you understand why you are rerunning it.

## 5. Configure Supabase Authentication

For local testing:

- Site URL: `http://localhost:3000`
- Allowed callback URL: `http://localhost:3000/auth/callback`
- Add the password-reset callback URL requested by the Supabase interface.

Keep email confirmation enabled for the first full test if you want to verify confirmation emails.

## 6. Generate the Encryption Key

Run once:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Place the result in `.env.local` as:

```text
CHAT_CONTENT_ENCRYPTION_KEY=generated_value
```

Store one protected backup. Losing or replacing this key prevents older encrypted conversations and private notes from being decrypted.

## 7. Configure OpenAI

Add the private API key to `.env.local`:

```text
OPENAI_API_KEY=your_private_key
```

Do not use a variable beginning with `NEXT_PUBLIC_` for this key.

Keep the model, timeout, output-token, and hourly request controls from `.env.example` during initial testing.

## 8. Configure Stripe Test Mode

Use Stripe **test mode only**.

Create:

- one-time $9.99 report product and Price
- recurring $14.99 monthly membership product and Price

Add to `.env.local`:

```text
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_ONE_TIME_REPORT_PRICE_ID=price_...
STRIPE_MONTHLY_MEMBERSHIP_PRICE_ID=price_...
```

Use the Stripe CLI or a test webhook endpoint to forward events to:

```text
http://localhost:3000/api/stripe/webhook
```

Never use live card information during this checkpoint.

## 9. Install and Start

```bash
npm ci
npm run dev
```

Open:

```text
http://localhost:3000
```

## 10. Run Automated Checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm audit --audit-level=high
```

Browser tests:

```bash
npx playwright install chromium
npm run test:e2e
```

## 11. Create the Test Accounts

Register:

- Account A: ordinary user
- Account B: ordinary user
- Account C: disposable deletion-test user
- Account D: administrator
- Account E: optional support-only user

Do not use real customer data.

## 12. Assign Administrator and Support Roles

In Supabase SQL Editor, substitute only your test emails:

```sql
update public.user_profiles
set role = 'admin'
where email_normalized = 'account-d-admin@example.com';
```

Optional support test:

```sql
update public.user_profiles
set role = 'support'
where email_normalized = 'account-e-support@example.com';
```

Role assignment must occur only through trusted database administration. The browser has no role-changing function.

Log out and log back in after changing a role.

## 13. Core User Test — Account A

Using fictional or safely redacted material:

1. Register and log in.
2. Create a private case.
3. Save a fictional conversation.
4. Run the AI Chat Analyzer.
5. Complete the Profile Consistency Check.
6. Complete the Guided Reverse Image Checker.
7. Complete the Video Call Verifier.
8. Calculate the Combined Preliminary Result.
9. Confirm concern and confidence are separate.
10. Confirm missing checks are excluded rather than treated as suspicious.
11. Use Stripe test checkout to unlock the report.
12. Generate the final report.
13. Print or save it as PDF.
14. Change one check and confirm the prior assessment/report becomes outdated.
15. Recalculate and generate a new version.
16. Log out and back in and confirm saved data remains available.

## 14. Two-Account Privacy Test — Accounts A and B

1. Copy Account A case, check, analysis, result, and report URLs.
2. Log in as Account B.
3. Attempt each Account A URL.
4. Confirm Account B never sees Account A content.
5. Confirm Account B cannot update, analyze, purchase for, export, archive, or delete Account A data.
6. Return to Account A and confirm its data is unchanged.

## 15. Payment and Entitlement Test

In Stripe test mode:

1. Complete a $9.99 one-time report checkout.
2. Confirm the browser success URL alone does not unlock access before the verified webhook.
3. Confirm the signed webhook creates the case entitlement.
4. Confirm duplicate delivery does not create duplicate access.
5. Start the test membership.
6. Confirm account billing status updates.
7. Cancel through the billing portal.
8. Test a failed payment.
9. Test a refund and verify entitlement behavior.
10. Confirm forged webhook signatures are rejected.

## 16. Final Report Test

Confirm the entitled report includes:

- overall concern
- confidence
- evidence completeness
- evidence reviewed
- warning signs
- protective signals
- component breakdown
- prioritized recommendations
- limitations
- scoring, prompt, model, and report versions

Confirm it excludes:

- full raw conversation
- private notes
- account email
- payment-card information
- secret keys
- hidden provider identifiers

## 17. Account Deletion Test — Disposable Account C Only

1. Create a case and sample records under Account C.
2. Optionally start a Stripe test membership.
3. Open Account Settings.
4. Enter the current password.
5. enter the exact confirmation phrase.
6. Confirm permanent consequences.
7. Delete the account.
8. Confirm membership cancellation is attempted first.
9. Confirm the account cannot log in afterward.
10. Confirm its user-owned cases and private records are inaccessible.
11. Confirm the opaque deletion receipt works without revealing the raw email.

Never perform the first deletion test on your administrator account.

## 18. Build 14 Administration Test

### Normal-user rejection

1. Log in as Account A.
2. Open `/admin`.
3. Confirm access is rejected and Account A returns to the dashboard.

### Support-only role

1. Log in as Account E if created.
2. Confirm `/admin`, `/admin/failures`, and `/admin/support` work.
3. Confirm `/admin/audit` is rejected.
4. Confirm no suspend/restore control appears.
5. Confirm no transcript, private note, case nickname, image result details, video answers, or report body appears.

### Administrator role

1. Log in as Account D.
2. Open `/admin` and confirm aggregate metrics appear.
3. Search Account A by exact email in `/admin/support`.
4. Confirm only account, aggregate usage, billing, subscription, and entitlement data appears.
5. Suspend Account A with an approved reason category.
6. Confirm Account A cannot continue using protected pages.
7. Restore Account A.
8. Open `/admin/audit` and confirm lookup and status-change events appear.
9. Confirm the audit metadata contains no raw search email or private content.
10. Open `/admin/failures` and confirm only sanitized technical metadata appears.

## 19. Database Security Inspection

In Supabase verify:

- all user-data tables have Row Level Security enabled
- ordinary authenticated users cannot write server-only analysis, assessment, report, entitlement, audit, deletion, or system-error records
- `system_errors` has no browser grants
- support/admin roles do not bypass database privacy through the browser
- administration reads occur only after server-side staff authorization

## 20. Record the Checkpoint Results

Use a private test note containing no passwords, keys, or conversations:

```text
Date:
Computer and browser:
Migrations 03–14: Pass / Fail
Automated checks: Pass / Fail
Account A core journey: Pass / Fail
Account B privacy isolation: Pass / Fail
OpenAI live analysis: Pass / Fail
Stripe test payment: Pass / Fail
Final report/export: Pass / Fail
Account C deletion: Pass / Fail
Normal user admin rejection: Pass / Fail
Support-only restrictions: Pass / Fail
Administrator controls and audit: Pass / Fail
Problems observed:
```

## Secret Values Never to Share

- `SUPABASE_SERVICE_ROLE_KEY`
- `CHAT_CONTENT_ENCRYPTION_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- passwords
- real private conversations

## Documentation

- `docs/BUILD_14_REPORT.md`
- `docs/CODEX_BUILD_SEQUENCE.md`
- `docs/PRIVACY_SECURITY.md`
- `docs/TEST_AND_EVALUATION_PLAN.md`
- `AGENTS.md`

## Next Stage

Do **not** proceed blindly to Build 15. Complete the integrated checkpoint, record failures, and correct discovered defects first.

After the checkpoint, the next blueprint stage is **Build 15 — Security and Reliability Hardening**.

## Build 15 Chat Analysis Rate-Limit Patch

For an existing Build 14 database, apply only
`supabase/migrations/202606180013_build15_chat_rate_limit.sql` in the Supabase
SQL Editor before starting the patched application. Do not rerun Builds 03–14.
The new server-only function verifies case ownership, locks one account's
analysis starts, counts all attempts in the preceding hour, and creates the
processing record in the same transaction. The existing
`OPENAI_CHAT_MAX_REQUESTS_PER_HOUR` setting (default 5) remains in effect.
Failed analyses count because they can still consume provider resources.

Rollback for this focused patch: restore the prior `analysis-actions.ts`
version, then drop the function with its nine-argument signature. Do not drop
the function while the patched application is running.

## Build 15 Authorization and Input Patch

For an existing database, apply only
`supabase/migrations/202606180014_build15_atomic_admin_audit.sql` before
installing the accompanying application patch. Do not rerun earlier
migrations. Administrator status changes and system-error resolution now
commit their audit rows in the same database transaction. If audit insertion
fails, the status change rolls back. The application also rejects invalid
calendar dates in case details.

## Build 15 Atomic Report Generation Patch

Apply `supabase/migrations/202606180015_build15_atomic_report_generation.sql`
after the prior Build 15 migrations and before installing its application
patch. The server-only function checks the owning case, latest preliminary
assessment, active entitlement, and remaining allowance while locking rows to
serialize concurrent report requests. Version assignment, snapshot creation,
usage count, and usage event commit in one transaction. Existing saved report
versions and usage counts are unchanged by the migration.

## Build 15 Stripe Webhook Replay Patch

Apply `supabase/migrations/202606180016_build15_atomic_webhook_reservation.sql`
after the atomic report migration and before installing its application patch.
Webhook receipt reservation now serializes duplicate event IDs, permits retry
of failed or abandoned processing, and ties completion to the current claim.
Replays of the same paid checkout preserve the existing entitlement's usage
count and status. Test signed webhook replay with the disposable manual test in
`tests/manual/webhook-replay.mjs` against a running local server; the script
creates no Stripe charge and removes its database fixtures on completion.

## Build 15 Operational Alerts

See `docs/BUILD_15_OPERATIONAL_ALERTS.md` for server-only Resend settings,
message privacy, cooldown limitations, live inbox test, and rollback.
