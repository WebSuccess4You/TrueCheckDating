Build 15: emergency feature switches

Extract the ZIP into the current TrueCheckAI_Build14 project folder with paths
preserved. This package contains only the six files listed below. It does not
contain .env.local or require a database migration.

The new server-only flags default to enabled when missing:
  CHAT_ANALYSIS_ENABLED=true
  CHECKOUT_ENABLED=true

To pause a feature, add the corresponding name with value false to your own
.env.local and restart the Next.js server. Do not paste or upload .env.local.
New AI analyses stop before the analysis-start database record or OpenAI call.
New checkout sessions stop before Stripe customer creation. Existing reports,
billing portal, and signed Stripe webhook processing remain available.

Run npm run check in the project folder after applying. Then, with a disposable
account and Stripe test mode, exercise both false values, confirm the user
sees the temporary-unavailability message, and change them to true and restart.
Do not attempt a purchase in live Stripe mode just for this check.

Files:
  src/lib/operations/feature-switches.ts
  src/lib/operations/feature-switches.test.ts
  src/app/analysis-actions.ts
  src/app/payment-actions.ts
  .env.example
  docs/BUILD_15_CHANGELOG.md

Acceptance is still pending a live feature-switch exercise, a monitoring alert
test, an enforced CSP review, and a demonstrated database restore.
