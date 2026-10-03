# Scoring and Reporting

## 1. Principle

The final score is a structured concern indicator, not a probability that a person is a scammer.

It must be accompanied by:

- confidence
- evidence completeness
- component breakdown
- limitations

## 2. Component Weights

Initial version:

| Component                                  | Weight |
| ------------------------------------------ | -----: |
| Communication and manipulation patterns    |    25% |
| Financial pressure, urgency, and isolation |    25% |
| Profile and identity consistency           |    20% |
| Video-call and verification behavior       |    15% |
| Guided reverse-image findings              |    15% |

Total: 100%.

## 3. Component Sources

### Communication and Manipulation

Derived from validated AI chat analysis.

Examples:

- rapid emotional escalation
- secrecy demands
- guilt or pressure
- repeated crisis narratives
- attempts to isolate the user
- coercive or controlling language

### Financial Pressure, Urgency, and Isolation

Derived from chat analysis and profile questionnaire.

Examples:

- money requests
- gift cards
- cryptocurrency or investment pressure
- emergency deadlines
- refusal of ordinary payment safeguards
- requests to hide transactions

### Profile and Identity Consistency

Derived from structured questionnaire.

Examples:

- contradictory age, location, occupation, or family claims
- newly created or empty profiles
- inconsistent timeline
- refusal to provide ordinary verification

### Video Call and Verification

Derived from video checklist.

Examples:

- repeated avoidance
- prerecorded-looking interaction
- inability to perform a simple live action
- consistent and natural live interaction as a protective signal

### Reverse Image Findings

Derived from user-recorded result category.

Suggested initial component mapping:

| Finding                  | Component score |
| ------------------------ | --------------: |
| Not completed            |     unavailable |
| No meaningful match      |              20 |
| Same identity match      |              10 |
| Different identity match |              90 |
| Many unrelated profiles  |              85 |
| Stock or public image    |              95 |
| Unclear                  |              50 |

These values are configurable and must be evaluated before public launch.

## 4. Missing Components

Do not score missing evidence as high risk.

Calculate:

```text
available_weight = sum(weights for completed components)
weighted_points = sum(component_score × component_weight)
normalized_risk_score = weighted_points / available_weight
```

Only generate a final report when minimum evidence requirements are satisfied.

Suggested minimum:

- Chat Analyzer completed
- At least one of Profile Check, Video Check, or Image Check completed

Otherwise show a preliminary result and request more information.

## 5. Evidence Completeness

Suggested calculation:

| Evidence item                  | Points |
| ------------------------------ | -----: |
| Adequate chat sample           |     35 |
| Profile questionnaire complete |     25 |
| Video verification complete    |     20 |
| Image check complete           |     20 |

Total 100.

Completeness bands:

- 0–39: Low
- 40–69: Moderate
- 70–100: High

## 6. Confidence

Confidence considers:

- evidence completeness
- internal consistency of evidence
- AI uncertainty
- whether findings rely on direct evidence or user interpretation
- whether multiple components agree

Initial deterministic formula:

- Start with evidence completeness
- Reduce up to 20 points for contradictory or weak evidence
- Reduce up to 15 points when the AI returns high uncertainty
- Increase up to 10 points when independent components agree
- Clamp 0 to 100

Confidence labels:

- 0–39: Low
- 40–69: Moderate
- 70–100: High

## 7. Concern Levels

- 0–24: Low
- 25–49: Moderate
- 50–74: High
- 75–100: Critical

The word “Critical” means immediate caution is recommended. It does not mean criminality is proven.

## 8. Protective Signals

Protective signals can reduce specific component scores but must not erase serious direct evidence.

Examples:

- repeated live video interaction
- stable and verifiable history
- no requests for money or secrecy
- willingness to use independent verification
- consistent claims over time

## 9. Report Structure

### Section A — Summary

- concern level
- risk score
- confidence
- evidence completeness
- date and report version

### Section B — Evidence Reviewed

- chat submission date and size
- completed questionnaires
- user-recorded image-search result
- video-check status

### Section C — Principal Warning Signs

Each item includes:

- category
- severity
- evidence
- explanation

### Section D — Protective Signals

### Section E — Component Breakdown

### Section F — Recommended Next Steps

Examples:

- pause financial transfers
- independently verify identity
- insist on a normal live video conversation
- consult a trusted friend
- preserve records
- contact a bank or platform when money has already been sent
- seek emergency help for immediate threats

### Section G — Limitations

Mandatory:

- supplied information may be incomplete or inaccurate
- text cannot establish identity or intent
- user-entered reverse-image results are not independently verified by TrueCheck.ai
- no score is proof
- advice is educational, not legal or investigative

## 10. Versioning

Every report records:

- scoring version
- prompt version
- model identifier
- questionnaire version
- generation timestamp

A change in scoring rules creates a new scoring version.
