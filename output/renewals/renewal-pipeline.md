# Retainer Renewal Pipeline

## Summary

- Clients reviewed: 2
- Recorded monthly value: $2,000
- GREEN: 0
- YELLOW: 2
- RED: 0
- Monthly value is read from local client data only.

## Renewal Tracker

| Client | Status | Monthly Value | Health | Renewal Recommendation | Next Action |
| --- | --- | --- | --- | --- | --- |
| Demo Retainer SaaS | active | $2,000 | YELLOW | Prepare evidence-backed report before renewal conversation. | Run npm run client:evidence -- --id demo-retainer-client and add reviewed evidence only if it exists. |
| Demo Starter Marketplace | active | $0 | YELLOW | Prepare evidence-backed report before renewal conversation. | Run npm run client:evidence -- --id demo-starter-client and add reviewed evidence only if it exists. |

## Manual Approval Rules

- Human approval is required before renewal, expansion, follow-up, scheduling, or client communication.
- Use local evidence and reports only after Daniel reviews them.
- No automated outreach, scheduling, email, CRM, payment, invoice, API, scraping, browser automation, credential, client-system, or external database action is performed.
