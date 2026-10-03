# Payments and Access

## 1. Approved Products

### Free Preliminary Screening

Initial configurable entitlement:

- one preliminary screening per account
- lower input limit
- limited findings
- no complete component report
- no downloadable report

### One-Time Full Report

Initial test price: approximately $9.99.

Suggested entitlement:

- one named case
- complete report
- print and download
- up to three eligible re-analyses within 30 days
- access to the saved report while the case and account remain active

### Monthly Membership

Initial test price: approximately $14.99 per month.

Suggested configurable entitlement:

- up to five active cases
- up to twenty AI analyses per billing month
- full reports
- report updates
- print and download
- billing portal

These limits are initial testing values and must be configurable.

## 2. Access Rules

A complete report unlocks when:

- a valid one-time entitlement exists for the case, or
- an active membership entitlement exists and usage limits permit access

Browser state alone never grants access.

## 3. Payment Flow

- user selects product
- server creates provider checkout
- provider handles payment details
- provider sends signed webhook
- server verifies signature
- server processes event idempotently
- payment record updated
- entitlement created or updated
- user sees confirmed access

## 4. Required Webhook Events

Implementation depends on provider, but must handle equivalent events for:

- successful checkout
- payment failure
- refund
- subscription created
- subscription updated
- subscription canceled
- invoice paid
- invoice failed

## 5. Idempotency

- provider event ID stored
- duplicate event ignored safely
- entitlement creation does not duplicate usage
- retries are safe

## 6. Refund Handling

Initial policy requires owner approval before public launch.

Technical requirements:

- refunded one-time report entitlement may be revoked according to policy
- prior report access behavior must be defined
- subscription refund and cancellation are distinct
- support action is audited

## 7. Failed Payments

- no public error details
- explain that payment was not completed
- provide retry
- membership enters provider-defined grace or unpaid status
- do not immediately destroy user data because of payment failure

## 8. Pricing Configuration

Prices must not be scattered through code.

Store:

- product code
- provider price identifier
- display price
- currency
- active state
- entitlement rules

## 9. Test Requirements

- successful one-time purchase
- canceled checkout
- failed payment
- duplicate webhook
- forged webhook
- refund
- subscription renewal
- subscription cancellation
- expired membership
- usage-limit enforcement
- case-specific entitlement enforcement
