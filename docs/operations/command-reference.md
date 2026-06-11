# Command Reference

All commands are local-first. None of these commands should send outreach, connect APIs, scrape websites, or use credentials.

## `npm run leads:seed`

Purpose:
Seed local demo leads.

Example:

```sh
npm run leads:seed
```

Output file:
`data/leads.json`

Safety note:
Creates fake/demo data only. Do not replace manual lead qualification with seed data.

## `npm run lead:add`

Purpose:
Add a manually researched lead to local data.

Example:

```sh
npm run lead:add -- --company "Acme SaaS" --website "https://acme.com" --industry "SaaS" --source "Manual Research" --notes "Signup and onboarding flow may benefit from smoke coverage"
```

Output file:
`data/leads.json`

Safety note:
Use only manually researched public information. Do not scrape or add private data.

## `npm run lead:research`

Purpose:
Generate a structured research pack from one local lead.

Example:

```sh
npm run lead:research -- --id acme-saas-demo
```

Output file:
`output/research/{lead_id}-research-pack.md`

Safety note:
Uses local lead data only. No website inspection or external research is performed.

## `npm run lead:pack`

Purpose:
Generate lead summary, scoring, outbound plan, message drafts, follow-up plan, and next commands.

Example:

```sh
npm run lead:pack -- --id acme-saas-demo
```

Output files:
`output/lead-packs/{lead_id}.md`
`output/outbound/{lead_id}-outbound-plan.md`

Safety note:
Drafts are manual-review only. No message is sent.

## `npm run outreach:queue`

Purpose:
Generate the first-50 and lead outreach queue.

Example:

```sh
npm run outreach:queue
```

Output file:
`output/outreach/outreach-queue.md`

Safety note:
Prioritizes manual work. It does not send messages or connect a CRM.

## `npm run outreach:pack`

Purpose:
Generate safe manual outreach assets from one qualified lead, using local research, audit pack, and audit report availability.

Example:

```sh
npm run outreach:pack -- --id pushpress
```

Output files:
`output/outreach-packs/{lead_id}/contact-strategy.md`
`output/outreach-packs/{lead_id}/linkedin-message.md`
`output/outreach-packs/{lead_id}/email-draft.md`
`output/outreach-packs/{lead_id}/follow-up-1.md`
`output/outreach-packs/{lead_id}/follow-up-2.md`
`output/outreach-packs/{lead_id}/call-invite.md`
`output/outreach-packs/{lead_id}/safety-checklist.md`

Safety note:
Uses local files only. It does not scrape, browse, call APIs, send email, automate LinkedIn, create CRM integrations, invent contacts, or invent audit findings. Human approval is required before outreach.

## `npm run contact:review`

Purpose:
Create or refresh a local contact review report for one lead, including contact research status, outreach assets, approval checklist, follow-up plan, and safety rules.

Example:

```sh
npm run contact:review -- --id pushpress
```

Output files:
`data/contact-reviews.json`
`output/contact-reviews/{lead_id}/contact-review.md`

Safety note:
Creates a local review record only. It does not invent contact information, scrape, browse, call APIs, send messages, automate LinkedIn, use credentials, or connect a CRM.

## `npm run contact:update`

Purpose:
Update a local contact review record after Daniel manually verifies contact details, approves a message, sends manually, or chooses a follow-up date.

Example:

```sh
npm run contact:update -- --id pushpress --status prepared --channel linkedin --contactName "Manual Placeholder" --contactRole "Head of Engineering" --contactUrl "https://linkedin.com/company/pushpress" --nextFollowUpDate "2026-06-15" --notes "Demo-only manual contact review placeholder, not sent."
```

Output file:
`data/contact-reviews.json`

Safety note:
Updates local JSON only. It does not validate URLs externally, send messages, automate follow-ups, scrape contact data, call APIs, or sync a CRM.

## `npm run client:prep`

Purpose:
Prepare discovery call and audit sale planning assets for an eligible lead using local lead data and available local workflow artifacts.

Example:

```sh
npm run client:prep -- --id pushpress
```

Output files:
`output/client-workflows/{lead_id}/discovery-call-prep.md`
`output/client-workflows/{lead_id}/audit-sale-plan.md`

Safety note:
Local preparation only. It does not send outreach, automate calls, scrape, browse, call APIs, create invoices, create payment links, use credentials, or connect a CRM.

## `npm run client:onboard`

Purpose:
Generate first-client onboarding, delivery, and retainer conversion planning assets for an eligible lead.

Example:

```sh
npm run client:onboard -- --id pushpress
```

Output files:
`output/client-workflows/{lead_id}/onboarding-checklist.md`
`output/client-workflows/{lead_id}/delivery-plan.md`
`output/client-workflows/{lead_id}/retainer-conversion-plan.md`

Safety note:
Local planning only. It does not request stored credentials, send messages, automate calls, create invoices, connect payment tools, or create CRM integrations.

## `npm run pipeline:opportunities`

Purpose:
Generate a local commercial control center that ranks opportunities, summarizes pipeline stage counts, and highlights manual follow-ups.

Example:

```sh
npm run pipeline:opportunities
```

Output files:
`output/pipeline/opportunity-tracker.md`
`output/pipeline/top-opportunities.md`
`output/pipeline/follow-up-needed.md`

Safety note:
Reads local files only. It does not scrape, browse, call APIs, send outreach, automate LinkedIn/email, connect a CRM, use external databases, create invoices, or connect payment systems. Human approval remains required before external action.

## `npm run dashboard`

Purpose:
Generate the daily local executive dashboard as markdown and static HTML.

Example:

```sh
npm run dashboard
```

Output files:
`output/dashboard/dashboard.md`
`output/dashboard/dashboard.html`

Safety note:
Reads local JSON and generated artifacts only. It does not scrape, browse, call APIs, send outreach, automate LinkedIn/email, connect a CRM, create invoices, use payment systems, or use external databases.

## `npm run revenue:visibility`

Purpose:
Generate a local revenue visibility report with current MRR, active clients, opportunity estimates, and conversion scenarios.

Example:

```sh
npm run revenue:visibility
```

Output file:
`output/dashboard/revenue-visibility.md`

Safety note:
Revenue opportunity values are estimates only, not booked revenue. This command does not connect payment tools, bank data, invoices, APIs, CRMs, scraping, browsing, or external databases.

## `npm run client:ops`

Purpose:
Generate the local Client Operations Center for daily priorities, pipeline health, follow-ups, client prep, delivery prep, reporting needs, risks, and recommended commands.

Example:

```sh
npm run client:ops
```

Output files:
`output/client-ops/client-operations-center.md`
`output/client-ops/client-readiness.md`

Safety note:
Reads local files only. It does not scrape, browse, call APIs, send outreach, automate LinkedIn/email, connect a CRM, create invoices, use payment systems, use credentials, or use external databases.

## `npm run client:next-actions`

Purpose:
Generate a focused next-actions list for top opportunities with stage, score, reason, recommended command, and manual approval note.

Example:

```sh
npm run client:next-actions
```

Output file:
`output/client-ops/next-actions.md`

Safety note:
Local planning only. All outreach, follow-ups, calls, proposals, client reports, invoices, and delivery actions require Daniel approval before external use.

## `npm run client:delivery`

Purpose:
Generate a local delivery packet for one existing client, including plan, evidence log, QA checklist, weekly summary, and client update draft.

Example:

```sh
npm run client:delivery -- --id demo-retainer-client
```

Output files:
`output/client-delivery/{client_id}/delivery-plan.md`
`output/client-delivery/{client_id}/evidence-log.md`
`output/client-delivery/{client_id}/qa-checklist.md`
`output/client-delivery/{client_id}/weekly-delivery-summary.md`
`output/client-delivery/{client_id}/client-update-draft.md`

Safety note:
Local delivery planning only. It does not use APIs, browser automation, external services, credentials, client systems, email, CRM, invoices, payment tools, or automated client communication.

## `npm run client:evidence`

Purpose:
Generate or refresh only the local evidence log for one existing client.

Example:

```sh
npm run client:evidence -- --id demo-retainer-client
```

Output file:
`output/client-delivery/{client_id}/evidence-log.md`

Safety note:
Does not invent evidence. Missing evidence sections are explicitly marked `No evidence currently recorded.` Human approval is required before evidence is shared.

## `npm run client:delivery-report`

Purpose:
Generate polished local client delivery reports from one existing client, local delivery artifacts, and the local evidence log.

Example:

```sh
npm run client:delivery-report -- --id demo-retainer-client
```

Output files:
`output/client-reporting/{client_id}/executive-summary.md`
`output/client-reporting/{client_id}/weekly-report.md`
`output/client-reporting/{client_id}/monthly-report.md`
`output/client-reporting/{client_id}/value-delivered.md`
`output/client-reporting/{client_id}/renewal-signal.md`

Safety note:
Evidence-first reporting only. It does not invent defects, bugs, test executions, coverage, screenshots, results, or revenue impact. It does not send reports, use APIs, scrape, automate browsers, connect email/CRM/payment systems, or access client systems.

## `npm run client:update-draft`

Purpose:
Generate a client-facing update draft for Daniel review from local client data and local evidence.

Example:

```sh
npm run client:update-draft -- --id demo-retainer-client
```

Output file:
`output/client-reporting/{client_id}/client-update-draft.md`

Safety note:
Draft only. It is not sent anywhere and includes the required `DRAFT ONLY — REQUIRES DANIEL REVIEW BEFORE SENDING` approval banner.

## `npm run renewal:tracker`

Purpose:
Generate the local retainer renewal and expansion tracker across all clients.

Example:

```sh
npm run renewal:tracker
```

Output files:
`output/renewals/renewal-pipeline.md`
`output/renewals/client-health.md`
`output/renewals/renewal-risk-report.md`
`output/renewals/expansion-opportunities.md`
`output/renewals/renewal-actions.md`

Safety note:
Uses local client data and local generated artifacts only. It does not invent revenue, client satisfaction, defects, business outcomes, or retention probability. It does not automate outreach, scheduling, email, CRM, invoices, payments, APIs, scraping, browser automation, credentials, client systems, or external databases.

## `npm run renewal:review`

Purpose:
Refresh focused renewal health, risk, expansion, and action reports for one client.

Example:

```sh
npm run renewal:review -- --id demo-retainer-client
```

Output files:
`output/renewals/client-health.md`
`output/renewals/renewal-risk-report.md`
`output/renewals/expansion-opportunities.md`
`output/renewals/renewal-actions.md`

Safety note:
Manual review only. The command recommends local actions for Daniel and does not send messages, schedule calls, connect CRMs, create invoices, process payments, scrape, browse, call APIs, or access client systems.

## `npm run operator:daily`

Purpose:
Generate one local daily command center across revenue, opportunities, follow-ups, client health, renewals, expansion watchlist, and top actions.

Example:

```sh
npm run operator:daily
```

Output file:
`output/operator/daily-command-center.md`

Safety note:
Local prioritization only. It does not use APIs, scrape, automate browsers, connect CRMs, automate outreach, send emails, schedule calendar events, process payments, use credentials, or write external databases.

## `npm run success:weekly`

Purpose:
Generate a local weekly client success and revenue review from existing Studio data and reports.

Example:

```sh
npm run success:weekly
```

Output file:
`output/operator/weekly-success-review.md`

Safety note:
Uses local files only and requires Daniel approval before outreach, follow-up, scheduling, proposal, renewal, expansion, invoice, or payment action.

## `npm run success:monthly`

Purpose:
Generate a local monthly client success review covering revenue, client health, renewals, expansion opportunities, top opportunities, risks, and next-month priorities.

Example:

```sh
npm run success:monthly
```

Output file:
`output/operator/monthly-success-review.md`

Safety note:
Uses local files only. It does not claim outcomes, send messages, connect external systems, use credentials, or automate client communication.

## `npm run audit:site`

Purpose:
Generate a passive QA Audit Pack from a URL using local Playwright evidence.

Example:

```sh
npm run audit:site -- --url https://example.com
```

Output file:
`output/audits/{safe-domain}/audit-report.md`

Safety note:
Do not log in, submit forms, bypass auth, test payment flows, or use credentials.

## `npm run audit:pack`

Purpose:
Transform an existing qualified lead into a sellable QA Audit Pack using local lead data, local research packs, and local audit outputs.

Example:

```sh
npm run audit:pack -- --id pushpress
```

Output files:
`output/audit-packs/{lead_id}/executive-summary.md`
`output/audit-packs/{lead_id}/qa-risk-summary.md`
`output/audit-packs/{lead_id}/playwright-opportunities.md`
`output/audit-packs/{lead_id}/automation-roadmap.md`
`output/audit-packs/{lead_id}/retainer-recommendation.md`

Safety note:
Uses local files only. It does not scrape, call APIs, browse, or send outreach. Human approval is required before any generated document is used client-side.

## `npm run sow:generate`

Purpose:
Generate a Proposal/SOW draft from local lead data.

Example:

```sh
npm run sow:generate -- --id acme-saas-demo
```

Output file:
`output/sows/{lead_id}-sow.md`

Safety note:
Proposal is a draft. Daniel must review pricing, scope, and claims before sending manually.

## `npm run client:report`

Purpose:
Generate a local client report from demo/local client data.

Example:

```sh
npm run client:report -- --id demo-retainer-client
```

Output file:
`output/client-reports/{client_id}-report.md`

Safety note:
Do not invent client results, metrics, ROI, or private data.

## `npm run metrics:revenue`

Purpose:
Generate local revenue and pipeline summary.

Example:

```sh
npm run metrics:revenue
```

Output file:
`output/metrics/revenue-summary.md`

Safety note:
MRR uses local client data only. Lead opportunity values are estimates, not booked revenue.

## `npm run day:plan`

Purpose:
Generate the daily plan from local lead data.

Example:

```sh
npm run day:plan
```

Output file:
`output/day-plan.md`

Safety note:
Recommended actions require human review.

## `npm run mac:daily`

Purpose:
Refresh the daily plan, revenue summary, and daily briefing.

Example:

```sh
npm run mac:daily
```

Output file:
`output/daily/daily-briefing.md`

Safety note:
This is not launchd automation and does not send notifications or messages.

## `npm run cockpit`

Purpose:
Generate the local action cockpit.

Example:

```sh
npm run cockpit
```

Output file:
`output/cockpit/action-cockpit.md`

Safety note:
This is a local markdown/HTML summary, not a SaaS dashboard or CRM.

## `npm run content:from-audits`

Purpose:
Generate educational content drafts from local audit reports.

Example:

```sh
npm run content:from-audits
```

Output file:
`output/content/content-calendar.md`

Safety note:
Does not post to social media, generate images, call AI services, or expose client-sensitive information.

## `npm run system:check`

Purpose:
Check whether core local files and outputs exist for the main revenue workflow.

Example:

```sh
npm run system:check
```

Output file:
`output/system-readiness/readiness-report.md`

Safety note:
Readiness is a local file check only. It does not validate business quality or send anything externally.
