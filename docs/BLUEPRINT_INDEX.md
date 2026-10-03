# Blueprint Index

## Purpose

This index explains which document controls each part of the product.

| Document                      | Controls                                                   |
| ----------------------------- | ---------------------------------------------------------- |
| `OWNER_DECISIONS.md`          | Approved business decisions                                |
| `PRODUCT_REQUIREMENTS.md`     | Functional and nonfunctional requirements                  |
| `USER_FLOWS.md`               | User journeys and state transitions                        |
| `DATABASE_SCHEMA.md`          | Data entities, fields, ownership, and retention            |
| `AI_ANALYZER_SPEC.md`         | Chat analysis input, prompt behavior, and output schema    |
| `SCORING_AND_REPORTING.md`    | Deterministic scoring, confidence, and report structure    |
| `PRIVACY_SECURITY.md`         | Privacy, consent, security, deletion, and abuse prevention |
| `PAYMENTS_AND_ACCESS.md`      | Free and paid entitlements                                 |
| `TEST_AND_EVALUATION_PLAN.md` | Software tests and AI quality evaluation                   |
| `DEPLOYMENT_OPERATIONS.md`    | Environments, monitoring, backups, release, and rollback   |
| `BETA_AND_MARKET_LAUNCH.md`   | Private beta, success metrics, support, and public launch  |
| `CODEX_BUILD_SEQUENCE.md`     | Exact order of Codex implementation tasks                  |

## Priority Rule

When documents conflict:

1. `OWNER_DECISIONS.md`
2. `PRODUCT_REQUIREMENTS.md`
3. feature-specific document
4. `SCREEN_LIST.md`
5. `MVP_PLAN.md`
6. implementation convenience

Any unresolved conflict must be documented before coding continues.
