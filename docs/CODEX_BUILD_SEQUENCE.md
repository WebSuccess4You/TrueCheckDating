# Codex Build Sequence

Each build is a separate task, branch, test run, and review.

## Build 01 — Repository and Application Foundation

Goal:

Create the basic application shell only.

Implement:

- initialize current stable Next.js with TypeScript
- package manager lockfile
- mobile-first global layout
- placeholder landing page
- environment-variable validation
- formatting
- linting
- type checking
- unit-test framework
- browser-test framework
- `.env.example`
- CI workflow
- local-development instructions

Do not implement:

- OpenAI
- Stripe
- production authentication
- production deployment
- private user data

Acceptance:

- clean install works
- development server runs
- production build succeeds
- formatting, lint, type check, and sample test pass
- mobile viewport has no horizontal overflow

## Build 02 — Design Foundation and Public Pages

Implement:

- reusable typography, spacing, buttons, forms, cards, alerts
- landing page
- How It Works
- Pricing
- legal placeholders
- responsive navigation
- accessibility basics

Acceptance:

- required public content present
- keyboard navigation works
- mobile and desktop reviewed
- no unsupported claims

## Build 03 — Authentication and User Profile

Implement:

- managed authentication integration
- sign up
- login
- logout
- password reset
- protected route
- user profile table
- consent records
- account settings shell

Acceptance:

- unauthorized user cannot access private routes
- duplicate registration handled
- reset flow tested
- consent version stored

## Build 04 — Cases and Dashboard

Implement:

- case migration
- create case
- dashboard
- case overview
- edit limited case details
- archive
- delete case transaction
- ownership authorization

Acceptance:

- user A cannot access user B case
- empty, loading, and error states
- deletion test passes
- mobile flow works

## Build 05 — Chat Submission Without AI

Implement:

- chat submission form
- input validation
- character limits
- consent
- encrypted or protected storage
- submission status
- synthetic placeholder result for development only

Acceptance:

- dangerous HTML rendered safely
- oversized input rejected
- no transcript in logs
- ownership enforced

## Build 06 — AI Chat Analyzer

Implement:

- server-side OpenAI call
- prompt version table
- structured output
- schema validation
- timeout and retry
- rate limiting
- cost metadata
- results UI
- prompt-injection tests

Acceptance:

- valid structured result saved
- malformed response rejected safely
- transcript instructions ignored
- no secret in browser
- evidence excerpts trace to input

## Build 07 — Profile Consistency Check

Implement:

- questionnaire
- save progress
- completion
- deterministic component score
- evidence completeness
- result summary

Acceptance:

- scoring unit tests
- incomplete state
- ownership
- accessible form

## Build 08 — Guided Reverse Image Checker

Implement:

- safety instructions
- external-search guidance
- result category selection
- optional links
- notes
- component scoring
- warnings against harassment

Acceptance:

- no claim that links are verified
- unsafe URL schemes rejected
- result saved privately
- scoring tests pass

## Build 09 — Video Call Verifier

Implement:

- checklist
- avoidance patterns
- protective signals
- notes
- component score
- evidence completeness
- safety guidance

Acceptance:

- no secret recording feature
- scoring tests
- mobile form
- save and return

## Build 10 — Combined Scoring and Preliminary Result

Implement:

- deterministic scoring service
- missing-component normalization
- confidence
- evidence completeness
- concern bands
- free preliminary result
- locked full-report preview
- scoring-version record

Acceptance:

- all formula tests
- missing evidence does not automatically increase risk
- concern labels match specification
- report clearly says not proof

## Build 11 — Payments and Entitlements

Implement in test mode:

- products
- checkout
- signed webhooks
- payment records
- one-time report entitlement
- membership
- usage limits
- billing portal
- failure and cancellation states

Acceptance:

- forged webhook rejected
- duplicate webhook idempotent
- success URL alone does not unlock
- limits enforced
- test purchase unlocks correctly

## Build 12 — Final Report and Export

Implement:

- full report structure
- component breakdown
- evidence and inference separation
- recommendations
- limitations
- report snapshots
- print view
- downloadable PDF or reliable print-to-PDF method
- outdated-report indicator

Acceptance:

- entitlement enforced
- report version recorded
- mobile display
- print output reviewed
- no hidden private data

## Build 13 — Account Deletion and Privacy Completion

Implement:

- delete account
- reauthentication where needed
- membership cancellation handling
- queued purge
- deletion status
- audit events
- privacy information page

Acceptance:

- deleted account cannot log in
- owned data inaccessible
- purge job tested
- logs remain sanitized

## Build 14 — Administration and Support

Implement:

- admin role
- aggregate metrics
- failed-analysis review
- support lookup
- restricted private-content access
- audit trail

Acceptance:

- normal user rejected
- support cannot casually view transcript
- elevated actions audited

## Build 15 — Security and Reliability Hardening

Implement and test:

- authorization review
- rate limits
- security headers
- input sanitization
- secret scan
- dependency review
- abuse controls
- backup and restore documentation
- monitoring
- feature kill switches

Acceptance:

- no critical findings
- restore procedure demonstrated
- alert test completed
- full E2E suite passes

## Build 16 — Staging Deployment

Implement:

- staging environment
- staging database
- test payment mode
- test AI limits
- monitoring
- deployment documentation
- smoke tests

Acceptance:

- fresh staging deployment works
- migration works
- rollback documented
- core journey passes

## Build 17 — AI Evaluation Harness

Implement:

- fictional evaluation dataset
- expected labels
- batch evaluation
- result comparison
- hallucination and misquotation checks
- cost and latency report

Acceptance:

- evaluation can be rerun after prompt changes
- prompt version compared
- known unsafe outputs flagged

## Build 18 — Private Alpha and Beta Readiness

Implement:

- tester invitation process
- feedback collection
- support contact
- analytics events
- beta feature flag
- owner dashboard for beta metrics

Acceptance:

- tester flow works
- feedback captured
- production keys not used in staging
- launch-gate checklist completed

## Build 19 — Production Preparation

Implement:

- production environment
- domain
- email authentication
- production payment configuration
- production AI spending limits
- backups
- alerts
- legal pages
- support procedures

Acceptance:

- no unresolved critical or high defect
- Terms and Privacy approved
- payment live-mode test controlled
- deletion verified
- rollback ready

## Build 20 — Soft Launch

Actions:

- admit limited users
- monitor errors, cost, payments, and support
- review AI outputs
- collect conversion and usability data
- pause promotion if critical issues appear

Completion:

- first real users complete core flow
- first legitimate paid transaction succeeds
- report delivered
- support and refund procedures work
