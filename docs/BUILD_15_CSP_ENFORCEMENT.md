# Build 15 CSP Enforcement — October 1, 2026

Promotes the tested report-only policy to Content-Security-Policy.
Allows the configured Supabase HTTPS origin and development WebSocket/eval
requirements. Allows Stripe Checkout and billing portal form destinations,
including browser handling of redirects after form submission.

Inline scripts and styles remain allowed for existing Next.js static pages.
This baseline policy is not a strict nonce-based policy and does not prevent
inline script injection. No violation collection endpoint is configured.

Updated response assertions and added a browser test requiring an enforced
connect-src violation for a synthetic unapproved host. The test sends no
private data. Browser enforcement and Windows checks remain pending.

Validation: formatting, focused lint, TypeScript check, production/development
policy assertions, and two HTTP header tests passed locally. The two browser
blocking tests could not launch because Chromium is absent. The initial
Turbopack server crashed in its cache; header tests passed using Webpack.
Run npm run check and the public-pages browser suite in the Windows project. Test signed-in navigation and Stripe sandbox
redirect again after enforcement; no payment is required.

Rollback: restore next.config.ts and tests/e2e/public-pages.spec.ts from the
previous report-only CSP ZIP, then restart the server. No database migration.
