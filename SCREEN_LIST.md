# TrueCheck.ai Screen List

All screens are mobile-first and must also work on tablets and desktop computers.

## Public Screens

### 1. Landing Page

Purpose: Explain the benefit and start the user journey.

Required content:

- Headline focused on safer online dating decisions
- Brief explanation
- “Start a Private Check” button
- Three-step How It Works summary
- Feature overview
- Example report preview without real personal data
- Privacy statement
- Disclaimer
- Pricing preview
- Login link

### 2. How It Works

- Create a private case
- Review conversation and claims
- Complete verification checks
- Receive risk indicators and next steps

### 3. Pricing

- Free preliminary screening
- One-time full report
- Monthly membership
- Clear limits and billing terms
- No deceptive urgency

### 4. Sign Up

- Email
- Password
- Confirm password
- Terms and Privacy acceptance
- Age confirmation
- Submit
- Link to Login

### 5. Login

- Email
- Password
- Login
- Forgot Password
- Link to Sign Up

### 6. Password Reset

- Request reset
- Reset form
- Success and expired-link states

## Private User Screens

### 7. Dashboard

- Create New Case
- Saved cases
- Private nickname
- Last updated
- Completion status
- Current concern label, if available
- Open, archive, and delete
- Helpful empty state

### 8. New Case

- Private case nickname
- Communication platform
- Claimed first name or alias, optional
- Claimed location, optional
- Approximate communication start date
- Consent and lawful-use acknowledgement
- Create Case

### 9. Case Overview

- Case summary
- Progress indicator
- Chat Analyzer status
- Profile Check status
- Reverse Image Check status
- Video Call Check status
- Final Report status
- Continue buttons
- Purchase or entitlement status
- Delete Case

### 10. AI Chat Analyzer

Input:

- Guidance to remove unnecessary personal details
- Conversation text area
- Character counter
- Supported input rules
- Consent confirmation
- Analyze button

Output:

- Preliminary risk score
- Concern level
- Confidence
- Evidence completeness
- Detected warning patterns
- Protective signals
- Evidence excerpts
- Explanation
- Recommended next steps
- Limitations
- Save and Continue

### 11. Profile Consistency Check

Sections:

- Claimed identity
- Age
- Location
- Occupation
- Family and relationship claims
- Communication timeline
- Social-profile history
- Contradictions
- Financial requests
- Verification cooperation
- Notes

Actions:

- Save Progress
- Complete Check
- Return to Case

### 12. Guided Reverse Image Checker

- Plain-language explanation
- Instructions to save or crop a clear image
- Guidance for using an external reverse-image search tool
- Result categories:
  - no meaningful match found
  - same image under same identity
  - same image under another identity
  - image appears on many unrelated profiles
  - stock, commercial, or public-figure image
  - result unclear
- Space to record source links and notes
- Safety warning against contacting or harassing people found in search results
- Save Result

### 13. Video Call Verifier

- Has a live call occurred?
- Number of requests
- Avoidance reasons
- Was movement and audio live?
- Were simple live verification requests completed?
- Were camera problems repeated?
- Was there emotional or financial pressure?
- Notes
- Safety guidance
- Save and Complete

### 14. Preliminary Results

- Limited summary available to free user
- Main concern level
- Two or three principal warning categories
- Clear locked sections
- Purchase full report
- Membership option
- No false countdown timers

### 15. Checkout

- Selected product
- Price
- Included benefits
- Stripe-hosted or secure checkout
- Success, cancellation, and failure states

### 16. Final Risk Report

- Overall concern level
- Risk score
- Confidence
- Evidence completeness
- Component scores
- Evidence reviewed
- Major warning signs
- Profile inconsistencies
- Reverse-image findings
- Video-call findings
- Protective signals
- Recommended actions
- Limitations
- Disclaimer
- Print or Download
- Return to Case

### 17. Account Settings

- Email
- Password change
- Membership status
- Billing portal
- Data and privacy information
- Delete all cases
- Delete account
- Logout

## Administrative Screens

### 18. Admin Overview

- Registered users
- Active users
- Cases
- Analyses
- Paid reports
- Memberships
- Failed analysis count
- System health
- Application version
- Prompt version

### 19. Failed Analysis Review

- Request ID
- Timestamp
- error class
- model and prompt version
- sanitized technical details
- retry status
- no private transcript by default

### 20. Support Lookup

- Search by user email or case ID
- Show account and entitlement status
- Private content hidden unless elevated access is explicitly justified and logged

## Shared Requirements

Every screen requires:

- clear title
- mobile-first layout
- accessible form labels
- loading state
- empty state where appropriate
- error state
- confirmation for destructive actions
- keyboard support
- no secrets in the browser
- no private data in browser console logs
- plain-language copy

### 21. Administrative Audit Trail

- administrator-only access
- sanitized event type, actor, target, approved metadata, and timestamp
- no transcript, private note, image detail, video answer, or report body

### 22. Support Account Lookup

- exact email or internal-ID lookup
- account status and role
- aggregate case, analysis, payment, entitlement, and membership status
- support read-only behavior
- administrator-only suspension and restoration
- every lookup and elevated action audited
