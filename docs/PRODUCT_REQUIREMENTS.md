# Product Requirements

## 1. Problem

People in online relationships often receive fragmented signals:

- affectionate or persuasive conversations
- conflicting biographical claims
- avoidance of live verification
- reused or suspicious images
- financial emergencies or investment requests

They need a private way to organize these signals and receive understandable safety guidance without making public accusations.

## 2. Product Goal

TrueCheck.ai converts user-provided material into:

- structured observations
- recognized warning patterns
- inconsistencies
- protective signals
- concern level
- evidence completeness
- confidence
- practical next steps

## 3. Primary User

An adult who:

- communicates with a romantic interest online
- is uncertain about identity, honesty, or intentions
- may be considering money transfer, travel, immigration support, intimate sharing, investment, or long-term commitment
- needs a private and understandable review

## 4. Primary Success Outcome

The user makes a more cautious, informed decision before an irreversible action.

## 5. Functional Requirements

### FR-001 Account Creation

The user can create an account with email and password, accept Terms and Privacy, confirm adult status, and verify the email when enabled.

### FR-002 Authentication

The user can log in, log out, request a password reset, and securely reset a password.

### FR-003 Case Creation

The user can create a private case using a nickname. Real names are optional.

### FR-004 Case Ownership

Only the case owner may read, change, analyze, export, or delete the case.

### FR-005 Case Dashboard

The user can view saved cases, progress, last updated date, and current concern level.

### FR-006 Chat Submission

The user can paste conversation text subject to input limits and consent requirements.

### FR-007 AI Analysis

The application sends conversation text to the AI service only from the server, validates structured output, and displays the approved result fields.

### FR-008 Profile Check

The user can complete a structured consistency questionnaire and save progress.

### FR-009 Reverse Image Guidance

The application explains how to run an external reverse-image search and allows the user to record findings and source links.

### FR-010 Video Check

The user can record whether a live video call occurred and whether verification requests were completed.

### FR-011 Preliminary Result

A free user receives limited findings without the complete detailed report.

### FR-012 Payment

The user can purchase one full case report or a monthly membership.

### FR-013 Entitlement

The application reliably decides whether the user may access a complete report.

### FR-014 Final Report

The system combines available components using deterministic application code and produces the approved report sections.

### FR-015 Report Export

An entitled user can print or download a report.

### FR-016 Case Deletion

The user can permanently delete a case after confirmation.

### FR-017 Account Deletion

The user can initiate account deletion and receive clear confirmation of the deletion process.

### FR-018 Administrative Metrics

Authorized administrators can view aggregate operational totals and sanitized failures.

### FR-019 Audit Events

Security-sensitive and administrative actions are recorded without logging full private content.

### FR-020 Support

The product provides a visible support contact and basic issue-reporting path.

## 6. Nonfunctional Requirements

### NFR-001 Mobile First

Core flows work at 360-pixel viewport width without horizontal scrolling.

### NFR-002 Accessibility

Core flows support keyboard navigation, labels, error announcements, readable contrast, and non-color-only meaning.

### NFR-003 Performance

Ordinary pages should become usable quickly on typical mobile connections. Long AI operations require progress messaging and timeout handling.

### NFR-004 Security

Secrets remain server-side. Authorization is enforced at the server and database layers.

### NFR-005 Privacy

Collect only data required for the service. Do not sell submitted content.

### NFR-006 Reliability

Payment, deletion, and entitlement changes must be idempotent where applicable.

### NFR-007 Observability

The application records sanitized errors, service health, request identifiers, and cost-relevant AI usage without recording full transcript text.

### NFR-008 Maintainability

Code is typed, tested, documented, and organized by feature.

### NFR-009 Explainability

The report separates:

- supplied evidence
- system observations
- inference
- recommendations
- limitations

### NFR-010 Cost Control

AI input size, request frequency, paid entitlements, and usage limits are enforced.

## 7. Business Rules

- Users must be adults.
- A free preliminary screening is limited per account.
- Paid entitlements are configurable.
- One-time report access applies to a specific case.
- Membership limits are configurable.
- Missing evidence lowers completeness and confidence; it does not automatically raise risk.
- The application never presents a score as proof.
- Source links entered by users are not automatically endorsed.
- Reverse-image results remain user-reported in Version 1.
- The final score is calculated by deterministic code, not directly accepted from an AI model.

## 8. Out of Scope

See `MVP_PLAN.md`.

## 9. Acceptance Definition

A requirement is complete only when:

- implementation exists
- automated tests cover expected and failure behavior
- authorization has been tested
- mobile behavior has been reviewed
- error handling exists
- documentation is updated
