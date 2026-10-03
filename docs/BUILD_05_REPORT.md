# Build 05 Completion Report

## Build

**Build 05 — Chat Submission Without AI**

## Status

Code implementation complete and locally verified on June 18, 2026.

Live Supabase insertion, retrieval, and two-account Row Level Security testing still require the product owner’s Supabase project credentials and applied migrations.

## Implemented

### Private Chat Submission

- Case-owned chat submission page
- Active-case requirement
- 80-character minimum
- 12,000-character maximum
- Live character counter
- Server-side Zod validation
- Saved-submission history
- Submission detail page

### Consent and Data Minimization

- Required confirmation that unnecessary sensitive information was removed
- Required acknowledgement of private storage and future AI processing
- Versioned consent value and timestamp stored with every submission
- Guidance to remove passwords, bank details, exact addresses, and intimate material

### Protected Storage

- AES-256-GCM application-level encryption
- Fresh random 12-byte IV per submission
- Authentication tag stored with ciphertext
- Keyed SHA-256 fingerprint rather than an unkeyed plaintext hash
- Server-only encryption key
- No plaintext conversation database column
- No conversation text written to ordinary logs

### Database and Authorization

- `chat_submissions` migration
- Foreign keys to cases, user profiles, and authenticated users
- Cascade deletion with the parent case
- Supabase Row Level Security enabled
- Owner-scoped select, insert, and delete policies
- Inserts require the case, user profile, and authentication identity to agree
- Authenticated users receive no direct update permission for status or ciphertext

### Placeholder Result

- Clearly marked development placeholder
- No fabricated score
- No risk assessment
- Explicit notice that AI begins in Build 06
- Saved content metadata and status
- Optional server-decrypted owner preview

### Safe Rendering

- Saved conversation text is rendered through React text interpolation
- No `dangerouslySetInnerHTML`
- Test confirms `<script>` and `<img onerror>` strings are escaped

## Verification Results

- Clean `npm ci`: passed
- Prettier formatting check: passed
- ESLint: passed
- TypeScript checking: passed
- Vitest: **11 test files, 35 tests passed**
- Production build: passed
- Dependency audit: **0 known vulnerabilities**

Tests cover:

- short and oversized input rejection
- required confirmations
- encryption and decryption
- fresh IV generation
- wrong-key decryption failure
- encrypted storage contract
- owner-scoped database policies
- no unrestricted update grant
- no transcript logging contract
- owner-filtered queries
- dangerous HTML escaping

## Browser Test Limitation

Playwright browser navigation was attempted in this workspace, but the system Chromium blocked localhost navigation with:

```text
net::ERR_BLOCKED_BY_ADMINISTRATOR
```

The browser tests remain included and should be run on the product owner’s computer. This is an environment restriction, not a claimed passing browser result.

## Live Tests Still Required

After Supabase setup:

1. Apply Build 03, Build 04, and Build 05 migrations.
2. Configure the Supabase URL and publishable key.
3. Generate and securely store the 32-byte base64 chat encryption key.
4. Register two test accounts.
5. Create a case and save a conversation with Account A.
6. Confirm Account B cannot read, insert into, or delete Account A’s submission.
7. Confirm case deletion cascades to its encrypted submissions.
8. Confirm a saved preview can be decrypted after server restart using the same key.
9. Confirm changing the key makes old content unreadable, demonstrating why key backup is essential.

## Files Added or Changed

Major additions:

- `src/app/chat-actions.ts`
- `src/app/chat-pages.module.css`
- `src/app/cases/[caseId]/chat/page.tsx`
- `src/app/cases/[caseId]/chat/[submissionId]/page.tsx`
- `src/components/chat/chat-submission-form.tsx`
- `src/components/chat/saved-text-preview.tsx`
- `src/lib/chat/*`
- `src/lib/server-env.ts`
- `supabase/migrations/202606180003_build05_chat_submissions.sql`
- Build 05 unit, privacy, migration, and rendering tests

Updated:

- case overview activates the chat submission step
- `.env.example`
- `README.md`
- `package.json`
- `vitest.config.ts`
- blueprint manifest

## Intentionally Not Added

- OpenAI API connection
- AI prompt
- AI-generated risk score
- analysis database table
- rate limiting for AI calls
- AI cost tracking
- structured model response validation

Those belong to Build 06.

## Next Build

**Build 06 — AI Chat Analyzer**

Build 06 should add the server-side OpenAI call, prompt versioning, structured schema validation, timeouts, controlled retries, rate limiting, cost metadata, evidence-linked findings, and prompt-injection tests.
