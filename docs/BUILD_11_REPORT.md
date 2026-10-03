# Build 11 Completion Report — Payments and Entitlements

## Status

Build 11 is complete at the code and automated-test level.

Live Stripe Checkout, webhook, billing-portal, refund, and subscription tests require the owner's Stripe test-mode account, Supabase project, and local environment keys.

## Implemented

- Stripe Node SDK integration
- Server-only Stripe configuration
- Stripe-hosted Checkout Session creation
- One-time report purchase
- Monthly membership checkout
- Account-to-Stripe-customer mapping
- Signed raw-body webhook verification
- Idempotent webhook event ledger
- Payment records
- Subscription records
- Case-scoped report entitlements
- Account-wide membership entitlements
- Subscription-period and cancellation synchronization
- Invoice-driven subscription refresh
- Async payment failure recording
- Refund-driven entitlement revocation
- Customer billing portal
- Preliminary-result purchase interface
- Server-verified access display
- Success page that cannot create entitlements
- Supabase Row Level Security read policies
- Server-only writes to payment and entitlement tables

## Security Decisions

- Checkout sessions are created only after authentication.
- One-time purchases require an owned, active case and an existing preliminary result.
- The Stripe secret key and webhook signing secret remain server-only.
- Stripe receives trusted user, case, and product metadata from server code.
- Webhook signatures are verified against the raw request body.
- The browser success URL never grants access.
- Duplicate webhook event IDs do not create duplicate entitlements.
- Paid case metadata is rechecked against case ownership during fulfillment.
- Raw card numbers are not stored by TrueCheck.ai.
- Authenticated database clients receive read-only access to their own billing data.
- The webhook event ledger is not exposed to ordinary authenticated users.

## Automated Verification

- Formatting: passed
- ESLint: passed
- TypeScript: passed
- Vitest files: 35 passed
- Vitest tests: 137 passed
- Stripe signature verification tests: passed
- Entitlement expiry and priority tests: passed
- Checkout validation tests: passed
- Migration security-contract tests: passed
- Success-page bypass contract: passed
- Production Next.js build: passed
- High-severity dependency audit: 0 known vulnerabilities

## Production Routes Added

- `/api/stripe/webhook`
- `/billing/success`

## Database Migration

Apply:

`supabase/migrations/202606180009_build11_payments_entitlements.sql`

It creates:

- `products`
- `payment_customers`
- `payments`
- `subscriptions`
- `entitlements`
- `usage_events`
- `stripe_webhook_events`

## Live Tests Still Required

- Stripe test product and Price configuration
- Local Stripe CLI forwarding
- Signed webhook delivery
- One-time successful payment
- Fake success URL denial
- Duplicate event replay
- Failed payment
- Membership start, update, cancellation, and renewal
- Billing portal
- Refund and entitlement revocation
- Two-account payment and entitlement privacy

## Known Scope Boundary

Build 11 grants and checks access. Build 12 creates the full detailed report and export.
