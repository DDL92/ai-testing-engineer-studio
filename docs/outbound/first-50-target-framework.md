# First 50 Target Framework

The first 50 targets should be built manually. The goal is not volume. The goal is to identify companies with visible QA risk, likely product complexity, and a realistic path to a QA Audit, Playwright Starter Pack, or QA Automation Retainer.

## Lead Sources

Use public, non-aggressive research only. Do not scrape, enrich private contact data, or auto-message.

### LinkedIn

Use LinkedIn to identify founders, heads of product, engineering managers, QA leads, agency owners, and technical founders.

Capture:
- Company
- Website
- Industry
- Contact
- Why selected
- Potential pain points
- Initial score

Selection signals:
- Hiring engineering or QA roles
- Posting about releases
- Founder or product leader active publicly
- Web product with signup, booking, checkout, dashboard, or portal

### Company Websites

Review public websites manually.

Capture:
- Company
- Website
- Industry
- Contact
- Why selected
- Potential pain points
- Initial score

Selection signals:
- Clear product workflows
- Visible signup/login
- E-commerce or booking flows
- Multiple user roles
- Public changelog or active product updates

### Startup Directories

Use directories to find SaaS, marketplace, AI, fintech, booking, and HealthTech companies.

Capture:
- Company
- Website
- Industry
- Contact
- Why selected
- Potential pain points
- Initial score

Selection signals:
- Recently launched product
- Small team
- Public web app
- Business model depends on reliable user flows

### SaaS Directories

Use SaaS directories to find products with dashboards, onboarding, integrations, or self-serve signup.

Capture:
- Company
- Website
- Industry
- Contact
- Why selected
- Potential pain points
- Initial score

Selection signals:
- Free trial or demo flow
- Customer portal
- Frequent updates
- Integrations or workflow automation

### Local Businesses With Web Products

Target local companies only when they have real web-product behavior, not simple brochure sites.

Capture:
- Company
- Website
- Industry
- Contact
- Why selected
- Potential pain points
- Initial score

Selection signals:
- Online booking
- E-commerce checkout
- Customer account portal
- Payment handoff
- Scheduling or quote workflow

### Agencies

Look for software studios, web agencies, product studios, Shopify agencies, and app development teams.

Capture:
- Company
- Website
- Industry
- Contact
- Why selected
- Potential pain points
- Initial score

Selection signals:
- Multiple client projects
- Maintenance retainers
- Launch support
- No visible QA role
- Public case studies with complex builds

## Lead Capture Fields

For each lead, capture:

- Company
- Website
- Industry
- Contact
- Why selected
- Potential pain points
- Initial score

Optional notes:

- Likely offer
- Manual next action
- Source
- Date added

## Top 20 Highest Priority Categories

1. SaaS with self-serve signup
2. SaaS with dashboard or portal
3. SaaS with public changelog and frequent releases
4. E-commerce with checkout
5. E-commerce with subscriptions
6. Marketplace with buyer/seller flows
7. Booking platform with calendar or availability
8. Fintech dashboard or onboarding product
9. HealthTech scheduling or portal product
10. AI product with signup/onboarding
11. B2B workflow automation product
12. Agency with SaaS clients
13. Shopify or e-commerce agency
14. Product studio with maintenance clients
15. Startup hiring engineers but not QA
16. Company posting about release speed
17. Company with visible app subdomain
18. Local business with real booking/payment workflow
19. Founder-led SaaS with no QA content visible
20. Agency offering development but not QA automation

## First 50 Mix

Recommended manual mix:

- 15 SaaS companies
- 8 e-commerce companies
- 6 marketplaces
- 6 booking platforms
- 5 fintech or HealthTech companies
- 10 agencies

Keep the first 50 small enough to review manually and score honestly.

## How to Add a Real Lead

Use `npm run lead:add` only after manual research. The command adds the lead to `data/leads.json`, scores it locally, assigns a recommended offer, and prints suggested next commands.

SaaS example:

```sh
npm run lead:add -- --company "Acme SaaS" --website "https://acme.com" --industry "SaaS" --source "LinkedIn" --notes "Signup and onboarding flow may benefit from smoke/regression coverage"
```

E-commerce example:

```sh
npm run lead:add -- --company "Acme Shop" --website "https://acmeshop.com" --industry "E-commerce" --source "Manual Research" --notes "Checkout and mobile purchase flow may benefit from QA audit coverage" --painPoints "checkout regression risk,mobile flow review"
```

Agency example:

```sh
npm run lead:add -- --company "Acme Studio" --website "https://acmestudio.com" --industry "Agency" --source "LinkedIn" --notes "Agency with client launch work may benefit from partner QA automation support" --nextAction "Review agency fit and prepare partner-retainer angle"
```

Warnings:

- Only add manually researched leads.
- Do not scrape.
- Do not add private data.
- Do not add credentials or sensitive client details.
- Do not automate outreach.
- Human approval is required before sending any message.

## Outreach Queue Workflow

Use the outreach queue to decide what to review next, not to send messages automatically.

Run:

```sh
npm run outreach:queue
```

The command reads:

- `data/leads.json`
- `data/first-50-targets.json`
- existing outreach status fields on leads

It generates:

- `output/outreach/outreach-queue.md`

The queue answers:

- Who should be reviewed first?
- Which leads need a manual follow-up?
- Which leads are closest to a QA Audit offer?
- Which leads are closest to a proposal?
- Which leads have retainer potential?
- How much progress has been made against the first 50 target list?

## Progress Tracking

Track the first 50 list with these statuses:

- `researching`: target is being manually reviewed.
- `queued`: target looks interesting but has not been added to `data/leads.json`.
- `added-to-leads`: target has been added with `npm run lead:add`.
- `contacted`: Daniel manually sent an approved message.
- `follow-up`: Daniel needs to manually review follow-up timing and context.
- `proposal-stage`: target is near proposal/SOW review.
- `client`: target became a client.
- `lost`: target is no longer active.
- `paused`: target is intentionally not being worked right now.

The queue report summarizes:

- total targets
- queued targets
- targets added to leads
- contacted/follow-up targets
- proposal-stage targets
- clients

Use these numbers as operating visibility only. They are not CRM automation, revenue claims, or proof of outreach.

## Manual Review Requirements

Before moving a target forward:

- Confirm the company and website were reviewed manually.
- Confirm the lead is a real fit for QA Audit, Playwright Starter Pack, or QA Automation Retainer.
- Confirm any contact information is public and appropriate to use.
- Generate or review the lead pack before preparing outreach.
- Remove unsupported claims, fake metrics, pressure language, and private information.
- Daniel must approve every message before it is sent manually.

Do not:

- scrape lead lists
- enrich private contact data
- auto-send messages
- connect LinkedIn/email APIs
- connect a CRM
- add credentials
- treat demo targets as real prospects
