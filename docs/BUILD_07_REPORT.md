# Build 07 Report — Profile Consistency Check

## Status

Build 07 is complete at the code level.

## Implemented

- Private Profile Consistency Check route at `/cases/[caseId]/profile`
- Link from the private case overview
- Structured questionnaire for nine profile-consistency areas
- Save-progress action
- Complete-check action
- Required answers for completion, including Unknown as an allowed answer
- Optional notes with a 2,000-character maximum
- Deterministic scoring service
- Evidence-completeness calculation
- Concern labels: Low, Moderate, High, Critical, and Not enough evidence
- Inconsistency and risk-indicator extraction
- Protective-signal extraction
- Completed result display
- Owner-only profile-check query helper
- Supabase migration for `profile_checks`
- Row Level Security read policy for owners
- No direct insert, update, or delete grants to normal authenticated users
- Server-side ownership verification before profile-check upsert
- Archived-case protection
- Case completion update after completed profile check
- Automated validation, scoring, and migration-contract tests

## Files Added or Changed

Important new files:

- `src/app/cases/[caseId]/profile/page.tsx`
- `src/app/profile-actions.ts`
- `src/components/profile/profile-check-form.tsx`
- `src/components/profile/profile-check-form.module.css`
- `src/components/profile/profile-check-results.tsx`
- `src/lib/profile/constants.ts`
- `src/lib/profile/queries.ts`
- `src/lib/profile/scoring.ts`
- `src/lib/profile/types.ts`
- `src/lib/profile/validation.ts`
- `src/lib/profile/scoring.test.ts`
- `src/lib/profile/validation.test.ts`
- `src/lib/profile/migration-contract.test.ts`
- `supabase/migrations/202606180005_build07_profile_checks.sql`

Updated:

- `src/app/cases/[caseId]/page.tsx`
- `README.md`
- `package.json`

## Verification Performed

- Formatting check: passed
- ESLint: passed
- TypeScript: passed
- Automated unit and contract tests: 71 passed
- Production build: passed
- High-severity dependency audit: 0 known vulnerabilities

## Important Safety Notes

The Profile Consistency Check is a structured risk indicator. It does not prove identity, criminality, authenticity, or safety.

Missing answers do not automatically increase risk. They reduce evidence completeness.

## Live Tests Still Required

A real Supabase project is required to test:

- two-account ownership isolation
- live insert/update through server actions
- RLS behavior against real authenticated sessions
- profile-check save and complete flows with real accounts
- case-progress update after completion

## Known Limitations

- No Guided Reverse Image Checker yet
- No Video Call Verifier yet
- No Combined Final Risk Report yet
- No Stripe payments yet
- No production deployment yet

## Next Build

Proceed to **Build 08 — Guided Reverse Image Checker**.
