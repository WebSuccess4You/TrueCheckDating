# Build 04 Completion Report

## Assignment

Build 04 — Cases and Dashboard

## Status

Implementation complete and locally verified. Live owner-isolation testing with two real Supabase accounts remains a required setup test because project credentials were not supplied during this build.

## Implemented

### Database

Added migration:

`supabase/migrations/202606180002_build04_cases.sql`

It creates:

- private `cases` table
- owner profile and authenticated-user links
- active and archived status
- limited case metadata
- lawful-use acknowledgement timestamp
- completion and future score placeholders
- indexes
- updated-at trigger
- owner-only Row Level Security policies
- transactional `delete_owned_case` function

### Private Dashboard

- active case list
- archived case list
- case counts
- empty state
- success and error notices
- mobile-first case cards
- links to open and edit cases
- archive, restore, and confirmed delete controls

### Case Workflow

- create private case
- lawful-use acknowledgement
- case overview
- edit limited details
- archive
- restore
- permanent deletion
- not-found behavior
- loading and error states

### Privacy and Authorization

- every query filters by the authenticated user
- server actions re-verify the session
- database RLS enforces ownership
- deletion uses an owner-scoped database function
- real names remain optional
- full legal names are discouraged
- no chat text or image data is collected yet

## Local Test Results

- clean `npm ci`: passed
- formatting: passed
- ESLint: passed
- TypeScript: passed
- unit and migration-contract tests: 19 passed
- production build: passed
- dependency audit: 0 known vulnerabilities
- production HTTP smoke test: public home and signup pages returned successfully
- protected new-case route returned a login redirect when unauthenticated

The bundled Playwright tests remain in the project. In this execution environment, the installed system Chromium blocked loopback navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`, so browser automation could not be truthfully reported as passed here. Run `npm run test:e2e` on the owner's computer after installing Playwright Chromium. This is separate from the still-required live Supabase two-account test.

## Live Supabase Tests Still Required

After connecting a Supabase project:

1. Apply Build 03 migration.
2. Apply Build 04 migration.
3. Create and confirm user A.
4. Create and confirm user B.
5. Create cases under both accounts.
6. Verify user A cannot read, edit, archive, or delete user B's case.
7. Verify case deletion removes the owned record.
8. Verify archive and restore timestamps satisfy the database constraint.

## Deliberately Not Added

- chat submission
- OpenAI
- profile consistency questionnaire
- reverse-image result recording
- video-call checklist
- combined scoring
- payments

These remain in later blueprint stages.

## Recommended Next Task

Build 05 — Chat Submission Without AI
