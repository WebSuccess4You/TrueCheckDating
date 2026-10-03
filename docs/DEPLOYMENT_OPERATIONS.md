# Deployment and Operations

## 1. Environments

### Local Development

- synthetic data only
- local or development database
- test payment keys
- test AI project or constrained API key
- no production user data

### Staging

- production-like configuration
- separate database
- test payment mode
- invited testers only
- safe test content

### Production

- production database
- production payments
- production AI key with spending limits
- monitored domain
- backups
- restricted admin access

## 2. Environment Variables

At minimum:

- application URL
- database URL
- authentication secrets
- OpenAI API key
- AI model configuration
- Stripe secret key
- Stripe webhook secret
- public Stripe key when required
- storage credentials
- email provider credentials
- error-monitoring configuration

Provide `.env.example` without real values.

## 3. Continuous Integration

Every proposed merge runs:

- install
- formatting check
- lint
- type check
- unit tests
- integration tests that do not require production secrets
- production build
- secret scan

## 4. Deployment Flow

```text
Feature Branch
  → Automated Checks
  → Review
  → Merge
  → Staging Deployment
  → Smoke Tests
  → Owner or designated approval
  → Production Deployment
  → Monitoring
```

## 5. Database Migrations

- migration reviewed before deploy
- backup or restore point available
- backward-compatible change preferred
- destructive migrations separated from code release
- migration status monitored
- rollback plan documented

## 6. Monitoring

Track:

- uptime
- page and API errors
- AI request success
- AI latency
- schema-validation failures
- payment webhook failures
- database health
- report-generation failures
- rate-limit events
- approximate AI cost
- suspicious authorization failures

Do not include private transcript data in monitoring.

## 7. Alerts

Alert on:

- elevated 5xx errors
- repeated AI provider failure
- payment webhook failure
- unusual API cost
- database connection failure
- unauthorized access spike
- storage failure
- failed backup

## 8. Backups

- automated database backups
- restore procedure tested
- retention documented
- backups encrypted
- access restricted
- backup lifecycle aligned with deletion representations

## 9. Rollback

Every release requires:

- previous deployment identifier
- application rollback method
- migration rollback or forward-fix plan
- ability to disable a failing feature
- ability to disable AI analysis or checkout without taking down informational pages

## 10. Domain and Email

Before public launch:

- connect TrueCheck.ai domain
- HTTPS enforced
- transactional email domain authenticated
- support email configured
- password-reset delivery tested
- payment receipt behavior verified

## 11. Operational Runbook

Document:

- AI outage
- payment outage
- email outage
- database outage
- security incident
- user deletion complaint
- billing dispute
- report-generation failure
