# Build 15 Change Log

## Atomic Chat Analysis Rate Limit

- Replaced the separate count and insert with a single server-only database
  function serialized per account.
- Preserved the rolling one-hour limit, owner validation, and existing
  user-facing limit message.
- Added a migration contract test for order of operations and permissions.

The live disposable-account concurrency test passed: 5 starts and 7 limited
requests. This patch must be deployed with its migration.

## Baseline Security Headers

- Added `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and
  `Permissions-Policy` to application responses.
- Added HTTP response tests for the landing, privacy, and login pages.
- A Content Security Policy remains pending review of Next.js scripts,
  Supabase authentication, and Stripe redirects before enforcement.

## Authorization and Input Review

- Moved administrator account-status changes and system-error resolution into
  server-only database functions. Their audit events commit in the same
  transaction, and the functions recheck the actor's active admin role.
- Reject impossible calendar dates for case details before attempting storage.
- Added regression tests for the audit boundary and calendar validation.
- Other security and reliability work remains pending for Build 15.

## Atomic Report Generation

- Added a server-only database function that locks the case and selected
  entitlement, checks the remaining allowance, assigns the next version, saves
  the immutable report, increments usage, and records the event together.
- A failed insert rolls the entire database call back. Simultaneous requests
  for one case receive distinct version numbers and cannot share one remaining
  allowance. Membership usage across cases is serialized by the entitlement
  lock.
- Kept preliminary-result and entitlement checks in the action for clear
  messages. The function repeats ownership, entitlement, and allowance checks.
- Added migration contract tests. A live disposable-account test passed both
  eight requests for one case (one report) and two cases sharing one membership
  allowance (one report). All test records were removed.

## Stripe Webhook Replay Review

- Found a read-then-upsert race in receipt reservation. Two deliveries of one
  event ID could both process it. Added an atomic server-only reservation with
  a ten-minute recovery window for interrupted processing and a claim token
  that guards completion and failure updates.
- A distinct event for an existing checkout could reset consumed report usage
  to zero. Existing purchase entitlements are now preserved on replay, including
  revoked status. Subscription sync updates no longer overwrite usage_count.
- Failed checkout recording and refund revocation now report database errors
  instead of completing a receipt after a failed write.
- Added contract tests and a signed, synthetic local webhook replay test. Live
  signed replay verification is pending after applying the migration and patch.

## Build 15 Checkpoint

- Passed: baseline security headers, focused authorization and calendar input
  checks, automated source checks, 180+ unit tests and production build, zero
  known npm vulnerabilities at review, disposable admin-role exercise, report
  concurrency, and chat rate-limit concurrency. The webhook patch requires
  installation and live replay testing before this item can pass.
- Pending for Build 15 acceptance: a demonstrated database restore procedure,
  monitoring alert test, feature kill switches, enforced Content Security
  Policy review, and a full end-to-end suite after all patches. Do not claim
  Build 15 acceptance or proceed to staging until these are recorded.
- The full browser suite could not start in the review workspace because its
  Playwright Chromium executable is absent; run it in the Windows project.
  The dependency audit returned zero vulnerabilities on Sep 28, 2026.

## October 1 checkpoint and operational email alerts

Owner verified CSP enforcement, feature kill switches, signed webhook replay,
and full browser suite (41 passed, one intentional skip) before this patch.
Separate-project restore and encrypted-chat integrity verification passed;
temporary credentials and test project were removed.

Added allowlisted email notifications for AI and verified webhook processing
failures, bounded transport, per-process cooldown, and synthetic failure test.
Inbox receipt and post-patch Windows checks remain pending. Build 15 acceptance
must wait for recorded results; this is not complete production monitoring.
