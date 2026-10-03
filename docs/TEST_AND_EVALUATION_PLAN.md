# Test and Evaluation Plan

## 1. Test Layers

### Static Checks

- formatting
- linting
- TypeScript type checking
- dependency and secret scanning

### Unit Tests

- score normalization
- concern bands
- confidence calculation
- evidence-completeness calculation
- entitlement logic
- input validation
- report formatting
- deletion helper functions

### Integration Tests

- database migrations
- authentication session
- case ownership
- AI structured-output validation
- payment webhook verification
- entitlement creation
- PDF or print generation
- private storage authorization

### End-to-End Tests

Critical full journeys:

1. sign up
2. log in
3. create case
4. submit chat
5. view preliminary results
6. complete profile check
7. complete image check
8. complete video check
9. purchase report
10. view and download report
11. log out and return
12. delete case
13. delete account

## 2. Security Tests

- user A cannot read user B case
- user A cannot alter user B case
- guessed UUID does not bypass ownership
- unauthorized admin route rejected
- transcript script tags render as text
- transcript prompt injection ignored
- oversized input rejected
- repeated requests rate limited
- payment success URL cannot unlock report
- forged webhook rejected
- deleted case cannot be reopened
- private file URL expires
- secrets absent from browser bundle
- logs contain no full transcript

## 3. Accessibility Tests

- keyboard-only completion
- visible focus
- accessible names
- error messages associated with fields
- screen-reader heading structure
- no color-only concern meaning
- touch targets
- mobile zoom
- contrast

## 4. AI Evaluation Dataset

Use fictional or safely anonymized examples.

Required categories:

1. Ordinary early dating conversation
2. Legitimate long-distance relationship
3. Clear money request
4. Gift-card request
5. Cryptocurrency investment pressure
6. Military impersonation pattern
7. Repeated emergency story
8. Rapid love declarations
9. Repeated video-call avoidance
10. Contradictory location claims
11. Harmless grammar differences
12. Cultural communication differences
13. Intense but nonfinancial manipulation
14. Requests for secrecy
15. Threat or coercion
16. Inadequate evidence
17. Transcript containing prompt injection
18. Transcript attempting to force a score
19. Same facts phrased differently
20. Protective, verifiable behavior

## 5. Evaluation Labels

For each case, human reviewers record:

- expected principal categories
- acceptable concern range
- unacceptable conclusions
- required limitation
- expected protective signals
- whether evidence is sufficient

## 6. AI Quality Metrics

Track:

- unsupported-claim rate
- misquotation rate
- schema failure rate
- false-positive concern
- false-negative concern
- score consistency
- category consistency
- limitation inclusion
- unsafe recommendation rate
- average latency
- average token use
- average estimated cost

## 7. Launch Gates

No private beta until:

- no known critical authorization flaw
- payment test mode works
- deletion tests pass
- prompt injection tests pass
- schema failure handling works
- end-to-end critical path passes

No public launch until:

- beta users can complete the main flow
- serious AI hallucination rate is acceptably low
- Terms and Privacy are reviewed
- production monitoring and backup exist
- support process exists

## 8. Bug Severity

### Critical

- cross-user data exposure
- payment bypass
- secret exposure
- permanent deletion failure
- false claim of proven criminality caused by system behavior

### High

- core flow unusable
- repeated invalid AI reports
- report score miscalculated
- membership incorrectly charged or blocked

### Medium

- confusing flow
- noncritical mobile defect
- isolated report formatting issue

### Low

- cosmetic issue
- minor wording problem

Critical and high defects block release.
