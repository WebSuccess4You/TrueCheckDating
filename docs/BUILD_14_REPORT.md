# Build 14 Completion Report — Administration and Support

## Outcome

Build 14 adds role-based operational administration without exposing private case content.

## Implemented

- Staff authorization for `support` and `admin` roles
- Administrator-only audit trail and account-status controls
- Aggregate operational metrics
- Sanitized failed-analysis review
- Server-only sanitized system-error records
- Exact-email and internal-ID support lookup
- Account, billing, entitlement, and aggregate usage summaries
- Audited support lookups
- Audited user suspension and restoration
- Audited system-error resolution
- Explicit prohibition on transcript, note, image, and report-body access
- Build 14 Supabase migration
- Automated authorization, validation, migration, and privacy-contract tests

## Security Boundaries

- Normal users are rejected from all `/admin` routes.
- Support staff cannot suspend or restore accounts.
- Only administrators can view the audit trail.
- Staff accounts cannot be suspended through the ordinary support workflow.
- The support console never selects or renders private transcript or note columns.
- Audit metadata uses approved categories and identifiers rather than raw email or private content.
- `system_errors` is unavailable to browser database roles.
- OpenAI failures are copied into `system_errors` only as request ID, error class, sanitized user-safe message, service, severity, and retryability.

## Verification Results

- Prettier formatting check: passed
- ESLint: passed
- TypeScript: passed
- Automated test files: 46 passed
- Automated tests: 163 passed
- Production compilation: passed
- Production TypeScript verification: passed
- Production page generation: passed
- Administration routes generated:
  - `/admin`
  - `/admin/failures`
  - `/admin/support`
  - `/admin/audit`
- High-severity dependency audit: 0 known vulnerabilities

## Live Verification Required

The integrated owner checkpoint must verify:

- role assignment in Supabase
- normal-user rejection
- support access to metadata but not private content
- administrator-only status changes
- audit events after lookup and status changes
- live Supabase, OpenAI, Stripe, final-report, and deletion workflows

## Next Stage

Stop for the first complete integrated live test before Build 15 — Security and Reliability Hardening.
