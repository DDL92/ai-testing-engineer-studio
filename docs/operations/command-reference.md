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
