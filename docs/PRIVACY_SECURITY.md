# Privacy and Security Plan

## 1. Privacy Principles

- collect the minimum information needed
- use private-by-default cases
- do not sell submitted conversations or photographs
- do not create a public accusation database
- give users meaningful deletion controls
- explain AI processing before submission
- avoid unnecessary real names

## 2. Consent

Before the first analysis, the user must acknowledge:

- they are an adult
- they have a lawful reason to submit the material
- they will not use the application to harass, stalk, threaten, or publicly accuse someone
- automated analysis has limitations
- submitted text is processed by an AI service
- TrueCheck.ai does not verify legal identity

Consent version and timestamp are stored.

## 3. Data Minimization

Encourage:

- private case nicknames
- removal of phone numbers, addresses, financial-account numbers, passwords, and intimate content
- submission of only the relevant conversation portions

Do not request:

- Social Security numbers
- passport numbers
- bank credentials
- full payment-card details
- intimate images
- precise location tracking

## 4. Encryption

- TLS in transit
- provider-managed encryption at rest
- sensitive notes and transcript text encrypted at application or database layer when practical
- secrets stored in managed environment secret storage
- no secrets in source control

## 5. Authorization

- authentication required for private routes
- server-side ownership checks for every case operation
- database row-level protections where available
- role-based admin access
- restricted support access
- audited elevated access

## 6. Logging

Allowed:

- request ID
- route
- status
- timing
- sanitized error class
- model identifier
- token counts
- estimated cost
- user ID as internal identifier when necessary

Prohibited:

- password
- authentication token
- full transcript
- uploaded photograph
- payment-card data
- full provider webhook secret
- unrestricted private notes

## 7. Deletion and Retention

### Active Cases

Retained while the account remains active unless the user deletes them.

### User-Deleted Case

- immediately hidden from the account
- deletion transaction marks records and revokes access
- private files queued for deletion
- operational database purge targeted within 30 days
- backup expiration follows provider backup cycle and should be documented

### Account Deletion

- account disabled promptly
- active membership cancellation initiated
- owned cases and private files queued for deletion
- legally necessary payment and tax records retained separately with minimized data
- deletion completion status tracked

### Failed AI Requests

Sanitized technical metadata retained for a limited operational period. Full input is not copied into error logs.

## 8. Secure File Handling

Version 1 does not require user photo uploads for the guided image checker.

Future uploads require:

- file-type validation
- size limit
- malware scanning where supported
- private storage
- randomized keys
- time-limited authorized URLs
- metadata stripping where practical

## 9. Payment Security

Use payment-provider-hosted collection or secure provider elements. TrueCheck.ai must not store raw card numbers.

Webhook signatures must be verified.

## 10. Abuse Prevention

Prohibit use for:

- stalking
- doxxing
- harassment
- blackmail
- extortion
- public accusation
- unauthorized surveillance
- impersonation
- analysis of minors

Provide:

- rate limits
- account suspension
- abuse-reporting path
- audit events
- clear acceptable-use language

## 11. AI Safety

- no identity confirmation
- no criminality determination
- no protected-class inference
- no mental-health diagnosis
- no unsupported factual claims
- prompt-injection defenses
- evidence citation to supplied text
- schema validation

## 12. Security Tests

Required before beta:

- cross-account case access
- identifier guessing
- broken object-level authorization
- session expiry
- password reset abuse
- malicious transcript prompt injection
- oversized input
- HTML/script injection
- webhook forgery
- entitlement bypass
- admin-role escalation
- deleted-file access
- rate-limit bypass
- secret scanning

## 13. Incident Response

Minimum procedure:

1. Detect and record incident
2. Limit access or disable affected feature
3. Preserve sanitized evidence
4. Assess exposed data
5. Rotate secrets when relevant
6. Patch and test
7. Notify affected parties when required
8. Document corrective action
9. Review prevention measures

## 14. Legal Review

Before public launch, qualified counsel should review:

- Terms of Service
- Privacy Policy
- Acceptable Use Policy
- disclaimers
- consent wording
- deletion and retention representations
- marketing claims
