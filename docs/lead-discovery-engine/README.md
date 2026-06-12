# Lead Discovery Engine v1

Lead Discovery Engine v1 is a local-first discovery workflow for a solo QA Automation business.

It helps Daniel identify and prioritize companies that may need:

- QA Audit
- Playwright Starter Pack
- QA Automation Retainer
- Agency Partner Retainer

## Commands

```sh
npm run lead:discover -- --niche "gym management SaaS"
npm run lead:pack -- --company PushPress
```

## Outputs

- `data/leads/discovered-leads.json`
- `output/leads/lead-discovery-{niche}.md`
- `output/leads/{lead_id}-lead-pack.md`

## Safety Rules

- Local-first only.
- No paid APIs.
- No LinkedIn automation.
- No message sending.
- No scraping behind logins.
- No CRM automation.
- No invented contacts, findings, metrics, or revenue.
- Human approval is required before promoting a lead, contacting a company, running an audit, sending outreach, or proposing work.

## Revenue Focus

The engine favors companies with visible product workflows, booking, checkout, onboarding, payment-adjacent flows, mobile risk, integrations, or recurring release cycles. The commercial goal is to sell a focused QA Audit first, then convert validated evidence into a Playwright Starter Pack or QA Automation Retainer.
