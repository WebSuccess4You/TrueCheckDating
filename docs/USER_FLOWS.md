# User Flows

## 1. Visitor to Preliminary Screening

```text
Landing
  → Start a Private Check
  → Sign Up
  → Verify or establish session
  → Create Case
  → Case Overview
  → Chat Analyzer
  → Submit Conversation
  → Processing
  → Preliminary Results
```

Failure branches:

- duplicate account
- invalid password
- missing consent
- input too long
- AI timeout
- malformed AI response
- rate limit reached

Each failure must preserve safe user progress where possible.

## 2. Preliminary Screening to Purchase

```text
Preliminary Results
  → View Locked Report Preview
  → Choose One-Time Report or Membership
  → Checkout
  → Payment Provider
  → Success Callback
  → Verified Webhook
  → Entitlement Granted
  → Final Report
```

The report must not unlock solely because the browser returns to a success URL. Entitlement requires verified server-side payment status.

## 3. Returning User

```text
Login
  → Dashboard
  → Select Case
  → Case Overview
  → Continue Incomplete Check
  → View Updated Report
```

## 4. Profile Check

```text
Case Overview
  → Profile Consistency Check
  → Answer Sections
  → Save Progress
  → Complete
  → Component Result
  → Case Overview
```

## 5. Guided Reverse Image Check

```text
Case Overview
  → Reverse Image Checker
  → Read Safety Instructions
  → Use External Search Tool
  → Select Result Category
  → Add Optional Links and Notes
  → Save
  → Case Overview
```

The user must be warned not to contact, threaten, accuse, or harass people found in search results.

## 6. Video Call Verification

```text
Case Overview
  → Video Call Verifier
  → Record Call History
  → Record Verification Behavior
  → Review Safety Guidance
  → Save
  → Case Overview
```

## 7. Final Report Creation

```text
Case Overview
  → Confirm Available Components
  → Deterministic Scoring Service
  → Generate Report Snapshot
  → Display Report
  → Print or Download
```

A report snapshot stores component versions, prompt version, model identifier, scoring version, and generation time.

## 8. Case Deletion

```text
Case Overview
  → Delete Case
  → Warning
  → Type or press explicit confirmation
  → Server authorizes ownership
  → Delete or tombstone related records in transaction
  → Queue private-file deletion
  → Audit deletion event
  → Dashboard confirmation
```

## 9. Account Deletion

```text
Account Settings
  → Delete Account
  → Explain consequences
  → Reauthentication when required
  → Confirm
  → Disable login
  → Delete or anonymize owned records
  → Cancel membership if applicable
  → Queue file deletion
  → Confirm request
```

## 10. Administrator Support Flow

```text
Admin Login
  → Support Lookup
  → Search Account
  → View Account Status and Entitlements
  → Perform Allowed Support Action
  → Record Audit Event
```

Private content is hidden by default.

## 11. Report Update Flow

When new information is added:

```text
Case Updated
  → Mark Existing Report as Outdated
  → Recalculate Component
  → User Requests Updated Report
  → Validate Entitlement and Usage Limit
  → Generate New Version
```

Previous report snapshots remain associated with their generation versions unless deleted under the retention policy.
