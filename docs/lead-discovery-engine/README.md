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
npm run leads:rewrite-queries
npm run leads:conversation-queries
```

## Intent Rewrite Engine

The intent rewrite engine replaces generic service keywords with phrases that look like real buyer conversations:

- pain: `my caterer cancelled`, `el terreno no drena`
- urgency: `need caterer ASAP`, `event next week`
- recommendations: `who knows a caterer`, `looking for villa recommendations`
- purchase intent: `need food vendor recommendations`, `necesito PTAR`

Rewrite libraries live in `data/lead-discovery/query-rewrites/` and the generated query batch is written to `output/lead-discovery/query-rewrites/rewritten-queries.json`.

## Conversation Search Mode

Conversation search mode takes rewrite phrases and biases them toward public indexed discussion sources such as Reddit, public Facebook group pages, Tripadvisor forums, WeddingWire forums, WeddingBee boards, and What to Expect community pages.

It generates local query plans only:

- no login
- no browser automation
- no scraping behind authentication
- no contact extraction
- no outreach

The generated batch is written to `output/lead-discovery/conversation-queries/conversation-queries.json`.

## Rewrite Learning Rules

Query learning promotes rewrites that produce lead-like candidates, buyer-service roles, delivery candidates, or verification review candidates.

It reduces rewrites that produce directories, vendors, article/reference pages, staffing recruitment, or empty responses. It disables repeatedly empty or low-quality queries. Learning output is advisory only; no query is deleted automatically.

## Conversation Discovery Workflow

Recommended local sequence:

```sh
npm run leads:source-queries
npm run leads:rewrite-queries
npm run leads:conversation-queries
npm run leads:search
npm run leads:search-quality
npm run leads:enrich
npm run leads:quality
npm run leads:verification-review
npm run leads:dashboard
```

`npm run leads:morning` and `npm run leads:daily` include the rewrite and conversation query steps before public search.

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
