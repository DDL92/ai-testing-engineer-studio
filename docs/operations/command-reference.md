# Command Reference

All commands are local-first. None of these commands should send outreach, connect APIs, scrape websites, or use credentials.

## `npm run outreach:review`

Purpose:
Generate the First Outreach Execution Review for PushPress and the Top 5 commercial leads before any manual contact is sent.

Example:

```sh
npm run outreach:review
```

Output files:
`output/outreach-review/outreach-review.md`
`output/outreach-review/pushpress-review.md`
`output/outreach-review/contact-decision.md`
`output/outreach-review/send-readiness.md`
`output/outreach-review/top-5-review.md`
`output/outreach-review/research-gaps.md`
`output/outreach-review/approval-checklist.md`

Safety note:
Review-only. It does not send outreach, invent contacts, invent findings, call APIs, scrape, browse, automate email/LinkedIn, connect a CRM, use credentials, or process payments. Daniel approval remains required before any external action.

## `npm run contact:decision`

Purpose:
Generate the deterministic PushPress contact decision: `SEND`, `NEEDS RESEARCH`, or `DO NOT SEND`.

Example:

```sh
npm run contact:decision
```

Output files:
`output/outreach-review/contact-decision.md`
`output/outreach-review/send-readiness.md`
`output/outreach-review/approval-checklist.md`

Safety note:
Decision support only. It does not send messages or approve contacts automatically. `SEND` requires manually approved contact and approved message status in local records.

## `npm run revenue:validate`

Purpose:
Generate the First Revenue Validation Pack for moving from v1.0 candidate readiness into the first paid audit and first retainer validation path.

Example:

```sh
npm run revenue:validate
```

Output files:
`output/first-revenue-validation/revenue-validation-pack.md`
`output/first-revenue-validation/first-client-path.md`
`output/first-revenue-validation/pushpress-action-plan.md`
`output/first-revenue-validation/top-5-commercial-action-plan.md`
`output/first-revenue-validation/release-cleanup-plan.md`
`output/first-revenue-validation/v1-score-improvement-plan.md`
`output/first-revenue-validation/approval-checklist.md`

Safety note:
Local-only validation. It does not invent booked revenue, contacts, findings, proposal status, or client outcomes. It does not send outreach, call APIs, scrape, browse, connect external systems, process payments, or use credentials.

## `npm run first-client:path`

Purpose:
Generate the first-client path and related first-revenue action plans, focused on PushPress, TeamUp, Wodify, ABC Glofox, and Bookee.

Example:

```sh
npm run first-client:path
```

Output files:
`output/first-revenue-validation/first-client-path.md`
`output/first-revenue-validation/pushpress-action-plan.md`
`output/first-revenue-validation/top-5-commercial-action-plan.md`
`output/first-revenue-validation/approval-checklist.md`

Safety note:
Manual planning only. Daniel must approve company verification, contact verification, message copy, pricing, and follow-up before anything is sent. No CRM, outreach automation, email/LinkedIn sending, scraping, payments, credentials, or external databases are used.

## `npm run os:release-check`

Purpose:
Generate the AI Studio OS v1.0 Candidate release check with PASS/WARNING/FAIL status across commands, reports, workflows, revenue consistency, documentation, and system health.

Example:

```sh
npm run os:release-check
```

Output file:
`output/v1-candidate/v1-release-check.md`

Safety note:
Local release audit only. It does not send outreach, call APIs, scrape, browse, connect a CRM, use payments, use credentials, or modify business data. Human approval is required before external action.

## `npm run os:v1-report`

Purpose:
Generate the official AI Studio OS v1.0 Candidate release package, including release score, release recommendation, architecture summary, command inventory, workflow inventory, revenue readiness, first-client readiness, known warnings, and post-v1 roadmap.

Example:

```sh
npm run os:v1-report
```

Output files:
`output/v1-candidate/v1-release-check.md`
`output/v1-candidate/v1-report.md`
`output/v1-candidate/architecture-summary.md`
`output/v1-candidate/command-inventory.md`
`output/v1-candidate/workflow-inventory.md`
`output/v1-candidate/revenue-readiness.md`
`output/v1-candidate/first-client-readiness.md`
`output/v1-candidate/known-warnings.md`
`output/v1-candidate/roadmap-after-v1.md`

Safety note:
Local-only release reporting. It does not invent revenue, contacts, audit findings, proposal status, or client outcomes. It does not send outreach, call APIs, scrape, browse, connect external systems, process payments, or use credentials.

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

## `npm run lead:discover:assistant`

Purpose:
Generate the local Lead Discovery Automation Assistant, 50-query manual search playbook, and lead approval checklist.

Example:

```sh
npm run lead:discover:assistant
```

Output files:
`output/lead-discovery-automation/discovery-assistant.md`
`output/lead-discovery-automation/search-playbook.md`
`output/lead-discovery-automation/lead-approval-checklist.md`

Safety note:
Public-search guidance only. It does not scrape, browse automatically, call APIs, invent companies, enrich contacts, send outreach, automate LinkedIn/email, connect a CRM, use payments, use credentials, or add leads without Daniel approval.

## `npm run lead:discover`

Purpose:
Run Lead Discovery Engine v1 for a niche using the local seed catalog only, score matching companies, and save review-only candidates.

Example:

```sh
npm run lead:discover -- --niche "gym management SaaS"
```

Output files:
`data/leads/discovered-leads.json`
`output/leads/lead-discovery-{niche}.md`
`output/discovery/lead-discovery-report.md`

Safety note:
Local deterministic discovery only. It does not browse, scrape, call APIs, automate LinkedIn, send messages, connect a CRM, enrich contacts, use credentials, or promote candidates into `data/leads.json` without human approval.

## `npm run lead:candidate-queue`

Purpose:
Generate a blank manual-entry candidate queue template with current lead inventory, Tier A/B/C counts, top ICPs, and the approved `lead:add` command template.

Example:

```sh
npm run lead:candidate-queue
```

Output file:
`output/lead-discovery-automation/candidate-queue.md`

Safety note:
Manual-entry template only. Do not invent companies. Fill rows only after Daniel manually reviews public search results and approves each candidate.

## `npm run lead:intake:approved`

Purpose:
Parse the manual candidate queue and generate approved, rejected, and summary intake reports without adding leads.

Example:

```sh
npm run lead:intake:approved
```

Output files:
`output/lead-intake/approved-candidates.md`
`output/lead-intake/rejected-candidates.md`
`output/lead-intake/intake-summary.md`

Safety note:
Report generation only. It does not execute `lead:add`, modify `data/leads.json`, scrape, browse, call APIs, automate outreach, connect CRMs, use credentials, or access external systems.

## `npm run lead:intake:batch`

Purpose:
Generate copy/paste-ready `lead:add` command drafts for candidates that Daniel marked approved and that pass local duplicate/safety checks.

Example:

```sh
npm run lead:intake:batch
```

Output files:
`output/lead-intake/lead-add-command-batch.md`
`output/lead-intake/approved-candidates.md`
`output/lead-intake/rejected-candidates.md`
`output/lead-intake/intake-summary.md`

Safety note:
Command batch only. Daniel must review and manually run any command. This command does not add leads, send outreach, scrape, browse, call APIs, enrich contacts, connect CRMs, use payments, use credentials, or access external systems.

## `npm run lead:research`

Purpose:
Generate a structured contact research report for one manually tracked company from `data/contacts/contacts.json`.

Example:

```sh
npm run lead:research -- --company PushPress
npm run lead:research -- --company Glofox
npm run lead:research -- --company TeamUp
```

Output file:
`output/contact-research/{company_id}-contact-research.md`

Safety note:
Uses local contact data only. It does not invent contacts, scrape LinkedIn, browse automatically, call APIs, send outreach, connect a CRM, use credentials, or use external databases. Human approval is required before any external action.

## `npm run lead:channels`

Purpose:
Generate a multi-channel lead research pack for one company from local lead data, `data/channels/channels.json`, and existing approved contact records.

Example:

```sh
npm run lead:channels -- --company PushPress
npm run lead:channels -- --company Glofox
npm run lead:channels -- --company TeamUp
```

Output file:
`output/channel-research/{company_id}.md`

Safety note:
Local channel research only. It does not browse, scrape, automate LinkedIn, submit website forms, send email/messages, call APIs, connect a CRM, use credentials, enrich private data, or use external databases. Blank URLs mean the exact public path is not recorded yet and must be manually verified before use.

## `npm run lead:channel-plan`

Purpose:
Generate a prioritized multi-channel plan from local channel records.

Example:

```sh
npm run lead:channel-plan
```

Output file:
`output/channel-research/channel-plan.md`

Safety note:
Planning only. The command does not send outreach, generate submissions, automate LinkedIn, scrape, call APIs, use CRM data, use credentials, or use external databases. Human approval is required before any channel action.

## `npm run pain:research`

Purpose:
Generate a customer pain intelligence report for one company from existing local lead notes and `data/pain-intelligence/pain-research.json`.

Example:

```sh
npm run pain:research -- --company PushPress
npm run pain:research -- --company Glofox
npm run pain:research -- --company TeamUp
npm run pain:research -- --company Wodify
```

Output file:
`output/pain-research/{company_id}-pain-research.md`

Safety note:
Customer pain intelligence only. It is not a security scanner and does not perform vulnerability scanning. It does not scrape, browse, call APIs, use credentials, use external databases, send outreach, invent complaints, invent customer quotes, invent findings, invent incidents, or invent vulnerabilities. Potential risk language must stay clearly labeled until manually verified.

## `npm run pain:summary`

Purpose:
Generate cross-company complaint-signal, QA-risk, solution, outreach-angle, and summary reports from local pain intelligence records.

Example:

```sh
npm run pain:summary
```

Output files:
`output/pain-research/customer-complaints.md`
`output/pain-research/qa-risk-map.md`
`output/pain-research/solution-recommendations.md`
`output/pain-research/outreach-angles.md`
`output/pain-research/pain-summary.md`

Safety note:
Summary reporting only. It does not validate public reviews, scrape websites, call APIs, enrich private data, use credentials, connect CRMs, use external databases, or send messages. Human approval is required before using any pain, audit, or outreach angle externally.

## `npm run site:intelligence`

Purpose:
Generate deterministic website QA intelligence for one company from local site-intelligence records, existing approved lead data, channel research, and pain intelligence.

Example:

```sh
npm run site:intelligence -- --company PushPress -- --url https://www.pushpress.com
npm run site:intelligence -- --company Glofox -- --url https://www.glofox.com
npm run site:intelligence -- --company TeamUp -- --url https://goteamup.com
npm run site:intelligence -- --company Wodify -- --url https://www.wodify.com
```

Output file:
`output/site-intelligence/{company_id}-site-intelligence.md`

Safety note:
Website QA intelligence only. It is not penetration testing, vulnerability scanning, or security testing. The command does not browse, scrape, run browser automation, log in, use credentials, use private data, claim confirmed bugs, claim vulnerabilities, claim outages, or send outreach. Screenshot capture is documented as not available unless a local screenshot artifact already exists.

## `npm run site:summary`

Purpose:
Generate cross-company website QA findings, UX opportunities, automation opportunities, audit recommendations, and site summary reports.

Example:

```sh
npm run site:summary
```

Output files:
`output/site-intelligence/qa-findings.md`
`output/site-intelligence/ux-opportunities.md`
`output/site-intelligence/automation-opportunities.md`
`output/site-intelligence/audit-recommendations.md`
`output/site-intelligence/site-summary.md`

Safety note:
Summary reporting only. It does not collect live website evidence, run security scans, use credentials, scrape behind login, use private data, or send outreach. Human approval is required before using any finding, audit recommendation, or outreach intelligence externally.

## `npm run opportunity:generate`

Purpose:
Generate a unified commercial QA opportunity decision report for one company using local lead research, channel research, pain intelligence, site intelligence, contacts, and outreach tracking.

Example:

```sh
npm run opportunity:generate -- --company PushPress
npm run opportunity:generate -- --company Glofox
npm run opportunity:generate -- --company TeamUp
npm run opportunity:generate -- --company Wodify
```

Output file:
`output/opportunities/{company_id}-opportunity.md`

Safety note:
Decision support only. It does not send outreach, connect external systems, invent contacts, invent complaints, invent bugs, invent vulnerabilities, invent incidents, invent customer feedback, or invent metrics. It uses approved pricing only: `QA Audit ($199-$500)`, `Playwright Starter Pack ($900-$1500)`, and `QA Automation Retainer ($1500-$3000/month)`.

## `npm run opportunity:summary`

Purpose:
Generate portfolio-level best opportunities, audit priorities, commercial priorities, outreach priorities, and unified opportunity summary reports.

Example:

```sh
npm run opportunity:summary
```

Output files:
`output/opportunities/best-opportunities.md`
`output/opportunities/audit-priorities.md`
`output/opportunities/commercial-priorities.md`
`output/opportunities/outreach-priorities.md`
`output/opportunities/opportunity-summary.md`

Safety note:
Local-only portfolio decision support. Human approval is required before outreach, proposal, audit, or retainer action.

## `npm run audit:generate`

Purpose:
Generate a company QA Audit Pack from Opportunity Engine output and local Studio intelligence.

Example:

```sh
npm run audit:generate -- --company PushPress
npm run audit:generate -- --company Glofox
npm run audit:generate -- --company TeamUp
npm run audit:generate -- --company Wodify
```

Output file:
`output/audit-packs/{company_id}-audit-pack.md`

Safety note:
QA Audit Pack only. It is not a consulting report, proposal, invoice, contract, or payment instruction generator. It does not send outreach or invent bugs, complaints, vulnerabilities, incidents, customer feedback, findings, or metrics. Approved pricing only: `QA Audit ($199-$500)`, `Playwright Starter Pack ($900-$1500)`, and `QA Automation Retainer ($1500-$3000/month)`.

## `npm run audit:portfolio`

Purpose:
Generate portfolio audit prioritization, delivery roadmap, and retainer opportunity reports from local QA Audit Packs.

Example:

```sh
npm run audit:portfolio
```

Output files:
`output/audit-packs/audit-portfolio.md`
`output/audit-packs/audit-priorities.md`
`output/audit-packs/audit-delivery-roadmap.md`
`output/audit-packs/retainer-opportunities.md`

Safety note:
Portfolio planning only. It does not send audit packs externally, generate contracts, generate invoices, create payment instructions, connect external systems, or bypass Daniel approval.

## `npm run evidence:collect`

Purpose:
Collect and score local evidence readiness for one company using existing Studio outputs only.

Example:

```sh
npm run evidence:collect -- --company PushPress
npm run evidence:collect -- --company Glofox
npm run evidence:collect -- --company TeamUp
npm run evidence:collect -- --company Wodify
```

Output file:
`output/evidence/{company_id}-evidence.md`

Safety note:
Evidence organization only. It does not run browser automation, Playwright, Lighthouse, scans, screenshots, APIs, scraping, credentials, or external databases. It does not invent bugs, vulnerabilities, incidents, outages, screenshots, customer quotes, complaints, findings, metrics, or evidence.

## `npm run evidence:portfolio`

Purpose:
Generate portfolio-level evidence readiness, evidence gaps, evidence priorities, and research-needed summaries.

Example:

```sh
npm run evidence:portfolio
```

Output files:
`output/evidence/evidence-portfolio.md`
`output/evidence/evidence-gaps.md`
`output/evidence/evidence-readiness.md`
`output/evidence/evidence-priorities.md`

Safety note:
Portfolio planning only. It reads local Studio data and generated outputs only, does not collect live evidence, and requires human approval before any client-facing use.

## `npm run evidence:capture-plan`

Purpose:
Generate the architecture-only evidence capture plan, future evidence source report, and storage architecture report.

Example:

```sh
npm run evidence:capture-plan
```

Output files:
`output/evidence-capture/evidence-capture-plan.md`
`output/evidence-capture/future-evidence-sources.md`
`output/evidence-capture/evidence-storage-architecture.md`

Safety note:
Architecture planning only. It does not run Playwright, run Lighthouse, capture screenshots, perform scans, use browser automation, use APIs, use credentials, use external databases, or collect evidence.

## `npm run evidence:roadmap`

Purpose:
Generate the future evidence roadmap and implementation priority roadmap.

Example:

```sh
npm run evidence:roadmap
```

Output files:
`output/evidence-capture/evidence-roadmap.md`
`output/evidence-capture/evidence-priority-roadmap.md`

Safety note:
Roadmap generation only. It does not invent evidence, screenshots, metrics, results, findings, bugs, vulnerabilities, or incidents, and it preserves human approval before future evidence capture.

## `npm run evidence:playwright-plan`

Purpose:
Generate the planning-only Playwright evidence strategy, target priorities, and storage plan.

Example:

```sh
npm run evidence:playwright-plan
```

Output files:
`output/playwright-evidence/playwright-evidence-plan.md`
`output/playwright-evidence/playwright-target-priorities.md`
`output/playwright-evidence/playwright-storage-plan.md`

Safety note:
Planning only. It does not execute Playwright, crawl websites, use browser automation, capture screenshots, create traces, scrape, use credentials, use APIs, or collect evidence.

## `npm run evidence:playwright-readiness`

Purpose:
Generate Playwright framework readiness and safety rule reports before any future controlled execution sprint.

Example:

```sh
npm run evidence:playwright-readiness
```

Output files:
`output/playwright-evidence/playwright-readiness.md`
`output/playwright-evidence/playwright-safety-rules.md`

Safety note:
Readiness reporting only. It documents the future `npm run evidence:playwright-run -- --company PushPress` command but does not implement or run it. Human approval remains required before any future public-page execution.

## `npm run evidence:playwright-run`

Purpose:
Run controlled passive Playwright observations for one approved public company website.

Example:

```sh
npm run evidence:playwright-run -- --company PushPress
npm run evidence:playwright-run -- --company TeamUp
npm run evidence:playwright-run -- --company Glofox
```

Output files:
`output/playwright-runner/{company_id}-playwright-evidence.md`
`data/evidence/playwright/reports/{company_id}-playwright-evidence.json`
`data/evidence/playwright/observations/{company_id}-observations.json`
`data/evidence/playwright/screenshots/{company_id}-{page_type}.png` when screenshot capture succeeds

Safety note:
Public-page passive observation only. Maximum 5 pages per company and maximum 1 navigation depth. It does not submit forms, log in, create accounts, trigger payments, trigger bookings, access authenticated/private areas, scrape, crawl aggressively, use credentials, use authenticated APIs, send outreach, send email, or send messages.

## `npm run evidence:playwright-summary`

Purpose:
Summarize local Playwright evidence runner outputs for QA audit support.

Example:

```sh
npm run evidence:playwright-summary
```

Output files:
`output/playwright-runner/playwright-summary.md`
`output/playwright-runner/playwright-findings.md`
`output/playwright-runner/playwright-observations.md`
`output/playwright-runner/playwright-readiness.md`

Safety note:
Reads local Playwright evidence records only. It does not run browser automation, collect new evidence, scrape, call APIs, use credentials, or claim confirmed bugs, vulnerabilities, incidents, or outages.

## `npm run outreach:status`

Purpose:
Generate local outreach tracking status from `data/outreach/outreach.json`.

Example:

```sh
npm run outreach:status
```

Output files:
`output/outreach-tracking/outreach-status.md`
`output/outreach-tracking/company-status.md`
`output/outreach-tracking/contact-status.md`
`output/outreach-tracking/pipeline-summary.md`

Safety note:
Tracking only. It does not send messages, automate follow-ups, scrape LinkedIn, call APIs, connect a CRM, use credentials, or use external databases.

## `npm run followup:queue`

Purpose:
Generate the manual follow-up queue for message-sent records whose `nextFollowUpAt` date is today or earlier.

Example:

```sh
npm run followup:queue
```

Output file:
`output/outreach-tracking/followup-queue.md`

Safety note:
Invitation-sent records are excluded until connected, and the command does not generate or send actual follow-up messages. Daniel approval is required before any follow-up action.

## `npm run lead:pack`

Purpose:
Generate lead summary, scoring, contact recommendations, outreach drafts, QA opportunity analysis, outbound plan, follow-up plan, and next commands.

Example:

```sh
npm run lead:pack -- --id acme-saas-demo
npm run lead:pack -- --company PushPress
```

Output files:
`output/lead-packs/{lead_id}.md`
`output/outbound/{lead_id}-outbound-plan.md`
`output/leads/{lead_id}-lead-pack.md`

Safety note:
Drafts are manual-review only. No message is sent. `--company` can read from approved local leads or the latest `data/leads/discovered-leads.json` candidates.

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

## `npm run outreach:operating-pack`

Purpose:
Generate the Real Outreach Operating Pack with Commercial Mode filtering, Top 5 real outreach leads, manual contact research checklist, first-audit offer path, and excluded demo/sample lead report.

Example:

```sh
npm run outreach:operating-pack
```

Output files:
`output/outreach-operating/real-outreach-operating-pack.md`
`output/outreach-operating/top-5-real-outreach.md`
`output/outreach-operating/contact-research-checklist.md`
`output/outreach-operating/first-audit-offer-path.md`
`output/outreach-operating/excluded-demo-leads.md`

Safety note:
Commercial Mode excludes demo/sample, paused, lost, and not-fit leads. This command does not scrape, browse, call APIs, send outreach, automate email/LinkedIn, invent contacts, invent company facts, connect CRMs, use credentials, use payments, or access external systems.

## `npm run outreach:first-audit-path`

Purpose:
Refresh the first-audit offer path and supporting real outreach operating files for the current Commercial Mode Top 5.

Example:

```sh
npm run outreach:first-audit-path
```

Output files:
`output/outreach-operating/first-audit-offer-path.md`
`output/outreach-operating/real-outreach-operating-pack.md`
`output/outreach-operating/top-5-real-outreach.md`
`output/outreach-operating/contact-research-checklist.md`
`output/outreach-operating/excluded-demo-leads.md`

Safety note:
Manual planning only. Daniel must approve before sending anything. It does not claim completed audits unless local audit packs exist, does not invent findings, and does not use external systems.

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

## `npm run pipeline:prioritize`

Purpose:
Generate the local Pipeline Auto-Prioritization Engine reports with deterministic priority scores, top revenue paths, top manual actions, and stalled opportunity detection.

Example:

```sh
npm run pipeline:prioritize
```

Output files:
`output/pipeline-prioritization/prioritized-pipeline.md`
`output/pipeline-prioritization/top-10-revenue-opportunities.md`
`output/pipeline-prioritization/top-5-actions.md`
`output/pipeline-prioritization/stalled-opportunities.md`

Safety note:
Uses local Studio data only. It does not scrape, browse, call APIs, send outreach, automate LinkedIn/email, connect CRMs, use external databases, create invoices, use payments, use credentials, or treat opportunity value as booked revenue.

## `npm run pipeline:next-actions`

Purpose:
Refresh the Top 5 manual pipeline actions and supporting prioritization reports from local lead, artifact, contact review, client, operator, renewal, and dashboard context.

Example:

```sh
npm run pipeline:next-actions
```

Output files:
`output/pipeline-prioritization/top-5-actions.md`
`output/pipeline-prioritization/prioritized-pipeline.md`
`output/pipeline-prioritization/top-10-revenue-opportunities.md`
`output/pipeline-prioritization/stalled-opportunities.md`

Safety note:
Recommendation only. Daniel must approve before executing commands or taking external action. This command does not modify leads, send messages, scrape, browse, call APIs, connect CRMs, use credentials, or access external systems.

## `npm run commercial:summary`

Purpose:
Generate the shared Commercial Mode summary and demo isolation report using the same filtering logic as revenue-facing dashboards and reports.

Example:

```sh
npm run commercial:summary
```

Output files:
`output/commercial-mode/demo-isolation-report.md`
`output/commercial-mode/commercial-mode-summary.md`

Safety note:
Local deterministic filtering only. It does not delete demo data, mutate leads, scrape, browse, call APIs, automate outreach, connect CRMs, use payments, use credentials, or access external databases. Human approval remains required before action.

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

## `npm run revenue:command-center`

Purpose:
Generate the local Revenue Command Center with booked MRR, speculative MRR forecasts, audit opportunities, retainer opportunities, renewal opportunities, expansion opportunities, property-progress scenarios, risks, and top manual revenue actions.

Example:

```sh
npm run revenue:command-center
```

Output files:
`output/revenue-command-center/revenue-command-center.md`
`output/revenue-command-center/mrr-forecast.md`
`output/revenue-command-center/audit-opportunities.md`
`output/revenue-command-center/retainer-opportunities.md`
`output/revenue-command-center/property-progress.md`

Safety note:
Uses local Studio data and generated reports only. It does not use APIs, scraping, browsing, CRMs, outreach automation, email, LinkedIn automation, payment systems, credentials, or external databases. Booked MRR comes only from active local retainer client records; opportunities and speculative forecasts are not booked revenue.

## `npm run revenue:forecast`

Purpose:
Refresh only the MRR forecast report for 30-day, 60-day, 90-day, 180-day, and 12-month conservative, expected, and aggressive scenarios.

Example:

```sh
npm run revenue:forecast
```

Output file:
`output/revenue-command-center/mrr-forecast.md`

Safety note:
Speculative MRR is deterministic scenario math from local retainer opportunities and is not booked revenue. This command does not connect payment tools, invoices, APIs, CRMs, scraping, browsing, external databases, or credentials.

## `npm run client-readiness:pack`

Purpose:
Generate the Real Client Readiness Pack for the current Top 5 commercial leads, including contact planning, manual outreach safety, first audit sales context, SOW readiness, risks, and suggested local commands.

Example:

```sh
npm run client-readiness:pack
```

Output files:
`output/real-client-readiness/real-client-readiness-pack.md`
`output/real-client-readiness/first-audit-sales-pack.md`
`output/real-client-readiness/top-5-contact-plan.md`
`output/real-client-readiness/manual-outreach-checklist.md`
`output/real-client-readiness/sow-readiness.md`

Safety note:
Local-only preparation. It does not send outreach, browse, scrape, call APIs, connect CRMs, use email or LinkedIn automation, use payments, use credentials, invent contacts, invent names, or invent audit findings. Human approval remains required before external action.

## `npm run first-audit:sales-pack`

Purpose:
Refresh only the First Audit Sales Pack with the QA Audit offer, $199-$500 pricing, audit scope, discovery topics, deliverables, upgrade path, objection handling, follow-up plan, and approval checklist.

Example:

```sh
npm run first-audit:sales-pack
```

Output file:
`output/real-client-readiness/first-audit-sales-pack.md`

Safety note:
Sales preparation only. It does not send messages, invent findings, guarantee outcomes, use APIs, scrape, browse, connect CRMs, automate outreach, use payment systems, or use credentials.

## `npm run proposal:center`

Purpose:
Generate the Proposal Command Center with proposal-ready leads, audit offer candidates, starter pack candidates, retainer candidates, missing requirements, pricing recommendations, SOW readiness, and approval checks.

Example:

```sh
npm run proposal:center
```

Output files:
`output/proposal-center/proposal-command-center.md`
`output/proposal-center/sow-readiness-report.md`
`output/proposal-center/proposal-priority-list.md`
`output/proposal-center/pricing-recommendations.md`
`output/proposal-center/approval-checklist.md`

Safety note:
Local-only proposal preparation. It does not send proposals or SOWs, use APIs, scrape, browse, connect CRMs, automate outreach, send email, use payment systems, use credentials, invent clients, invent findings, or treat opportunities as booked revenue.

## `npm run sow:center`

Purpose:
Refresh only the SOW readiness report for the Top 5 commercial leads.

Example:

```sh
npm run sow:center
```

Output file:
`output/proposal-center/sow-readiness-report.md`

Safety note:
Readiness reporting only. Daniel must approve scope, pricing, findings, assumptions, exclusions, and any client-facing use before sending a SOW.

## `npm run outreach:execute-pack`

Purpose:
Generate the Real Outreach Execution Pack with final review-only message drafts, contact research plan, follow-up plan, first audit CTA, and approval checklist for the Top 5 commercial leads.

Example:

```sh
npm run outreach:execute-pack
```

Output files:
`output/outreach-execution/outreach-execution-pack.md`
`output/outreach-execution/final-message-drafts.md`
`output/outreach-execution/contact-research-plan.md`
`output/outreach-execution/follow-up-plan.md`
`output/outreach-execution/first-audit-cta.md`
`output/outreach-execution/approval-checklist.md`

Safety note:
Manual outreach preparation only. It does not send messages, use APIs, scrape, browse, connect CRMs, send email, automate LinkedIn, automate outreach, use payments, use credentials, invent contacts, invent findings, or invent company facts.

## `npm run outreach:follow-up-plan`

Purpose:
Refresh only the manual follow-up plan for the Top 5 commercial leads.

Example:

```sh
npm run outreach:follow-up-plan
```

Output file:
`output/outreach-execution/follow-up-plan.md`

Safety note:
Planning only. It does not schedule, send, automate, or update external systems. Daniel must manually approve, send, and record any follow-up.

## `npm run first-audit:workflow`

Purpose:
Generate the First Audit Sale Workflow for positive replies, discovery call prep, audit scope confirmation, manual payment/invoice tracking boundaries, kickoff, delivery, reporting, and retainer upgrade path.

Example:

```sh
npm run first-audit:workflow
```

Output files:
`output/first-audit-workflow/first-audit-workflow.md`
`output/first-audit-workflow/discovery-call-prep.md`
`output/first-audit-workflow/audit-scope-confirmation.md`
`output/first-audit-workflow/audit-kickoff-plan.md`
`output/first-audit-workflow/audit-delivery-checklist.md`
`output/first-audit-workflow/retainer-upgrade-path.md`
`output/first-audit-workflow/approval-checklist.md`

Safety note:
Workflow preparation only. It does not process payments, generate invoices, send outreach, call APIs, scrape, browse, connect CRMs, use credentials, invent findings, invent defects, invent clients, or guarantee outcomes.

## `npm run first-audit:kickoff`

Purpose:
Refresh only the audit kickoff plan for an approved first audit.

Example:

```sh
npm run first-audit:kickoff
```

Output file:
`output/first-audit-workflow/audit-kickoff-plan.md`

Safety note:
Kickoff planning only. Scope, approvals, and manual payment/invoice status must be reviewed outside this command before delivery begins.

## `npm run mobile:center`

Purpose:
Generate the local Mobile Command Center foundation with Today, Top 5 Actions, Top 5 Opportunities, Revenue Snapshot, Client Status, manual Follow-Up Queue, Approvals Needed, and System Health.

Example:

```sh
npm run mobile:center
```

Output files:
`output/mobile-command-center/mobile-command-center.md`
`output/mobile-command-center/mobile-summary.md`
`output/mobile-command-center/top-actions-mobile.md`
`output/mobile-command-center/top-opportunities-mobile.md`
`output/mobile-command-center/revenue-mobile.md`
`output/mobile-command-center/client-status-mobile.md`
`output/mobile-command-center/followup-queue-mobile.md`

Safety note:
Local Markdown generation only. It does not create a web dashboard, PWA, mobile app, API, CRM integration, outreach automation, email/LinkedIn automation, external database, external service, or sending workflow. Human approval is required before every external action.

## `npm run mobile:summary`

Purpose:
Refresh only the compact mobile summary from local data and existing local report outputs.

Example:

```sh
npm run mobile:summary
```

Output file:
`output/mobile-command-center/mobile-summary.md`

Safety note:
Summary-only local report generation. It does not schedule or send follow-ups, automate outreach, connect CRMs, call APIs, use external databases, or use credentials.

## `npm run revenue:daily`

Purpose:
Generate the Daily Revenue Operator with Revenue Command Center sourced booked MRR, top revenue opportunities, revenue risks, renewal watch, proposal watch, client expansion watch, next actions, 30-minute focus, approval checklist, and revenue consistency report.

Example:

```sh
npm run revenue:daily
```

Output files:
`output/daily-revenue-operator/daily-revenue-operator.md`
`output/daily-revenue-operator/revenue-next-actions.md`
`output/daily-revenue-operator/revenue-priority-list.md`
`output/daily-revenue-operator/revenue-risks.md`
`output/daily-revenue-operator/revenue-focus-today.md`
`output/daily-revenue-operator/revenue-consistency-report.md`
`output/daily-revenue-operator/approval-checklist.md`

Safety note:
Local deterministic reporting only. Revenue Command Center is the booked MRR source of truth. It does not invent revenue, count demo/sample/sandbox/test client records as booked revenue, send outreach, call APIs, connect CRMs, use external databases, use credentials, create invoices, or process payments.

## `npm run revenue:next-actions`

Purpose:
Refresh only the Revenue Next Actions report using the same Daily Revenue Operator rules.

Example:

```sh
npm run revenue:next-actions
```

Output file:
`output/daily-revenue-operator/revenue-next-actions.md`

Safety note:
Recommendation only. Daniel must approve before outreach, proposals, follow-ups, delivery changes, invoices, payments, or client-facing use.

## `npm run cockpit:daily`

Purpose:
Generate Action Cockpit v1 as the unified daily operating screen across Revenue Command Center, Mobile Command Center, Daily Revenue Operator, Proposal Center, First Audit Workflow, Client Readiness, Client Ops, Renewals, and local follow-up context.

Example:

```sh
npm run cockpit:daily
```

Output files:
`output/action-cockpit/action-cockpit.md`
`output/action-cockpit/daily-focus.md`
`output/action-cockpit/top-opportunities.md`
`output/action-cockpit/approval-queue.md`
`output/action-cockpit/revenue-snapshot.md`
`output/action-cockpit/client-watchlist.md`
`output/action-cockpit/followup-watchlist.md`
`output/action-cockpit/system-health.md`

Safety note:
Local deterministic reporting only. It does not auto-approve, send outreach, schedule follow-ups, call APIs, connect CRMs, browse, scrape, use external databases, use credentials, create invoices, or process payments. Human approval is required before every external action.

## `npm run cockpit:approve`

Purpose:
Refresh only the local approval queue for manual review.

Example:

```sh
npm run cockpit:approve
```

Output file:
`output/action-cockpit/approval-queue.md`

Safety note:
Approval queue generation only. Never auto-approve. Daniel must manually review and approve any outreach, proposal, SOW, audit, onboarding, renewal, expansion, invoice, payment, or client-facing action.

## `npm run os:dashboard`

Purpose:
Generate the Operator OS Dashboard v1 as the primary local operating dashboard across Action Cockpit, Revenue Command Center, Mobile Command Center, opportunities, follow-ups, approvals, clients, and report health.

Example:

```sh
npm run os:dashboard
```

Output files:
`output/operator-os-dashboard/operator-dashboard.md`
`output/operator-os-dashboard/today-view.md`
`output/operator-os-dashboard/executive-summary.md`
`output/operator-os-dashboard/opportunity-center.md`
`output/operator-os-dashboard/revenue-center.md`
`output/operator-os-dashboard/approval-center.md`
`output/operator-os-dashboard/followup-center.md`
`output/operator-os-dashboard/system-status.md`

Safety note:
Local deterministic reporting only. It does not send outreach, auto-approve, schedule follow-ups, call APIs, connect CRMs, browse, scrape, use external databases, use credentials, create invoices, or process payments. Human approval remains required before external action.

## `npm run os:today`

Purpose:
Refresh only the 30-minute Today View from the Operator OS Dashboard rules.

Example:

```sh
npm run os:today
```

Output file:
`output/operator-os-dashboard/today-view.md`

Safety note:
Today view generation only. It recommends local next steps and does not approve, send, schedule, invoice, call APIs, connect CRMs, or update external systems.

## `npm run os:audit`

Purpose:
Generate the Studio OS stabilization audit across commands, reports, workflows, revenue consistency, documentation coverage, system health, and v1.0 candidate readiness.

Example:

```sh
npm run os:audit
```

Output files:
`output/os-stabilization/system-audit.md`
`output/os-stabilization/system-health.md`
`output/os-stabilization/command-audit.md`
`output/os-stabilization/report-audit.md`
`output/os-stabilization/revenue-audit.md`
`output/os-stabilization/workflow-audit.md`
`output/os-stabilization/documentation-audit.md`
`output/os-stabilization/stabilization-summary.md`

Safety note:
Audit-only local report generation. It does not modify business data, send outreach, auto-approve, schedule follow-ups, call APIs, connect CRMs, browse, scrape, use external databases, use credentials, create invoices, or process payments.

## `npm run os:health`

Purpose:
Refresh only the Studio OS stabilization system health report.

Example:

```sh
npm run os:health
```

Output file:
`output/os-stabilization/system-health.md`

Safety note:
Health check only. It reads local files and generated reports without modifying business data or taking external action.

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
Run the local Mac Daily Automation Runner. It refreshes the dashboard, daily operator, pipeline prioritization, client operations, renewal tracker, and Commercial Mode summary, then writes a consolidated daily summary, execution log, system health report, and action cockpit.

Example:

```sh
npm run mac:daily
```

Output files:
`output/mac-daily/mac-daily-summary.md`
`output/mac-daily/executed-reports.md`
`output/mac-daily/system-health.md`
`output/mac-daily/action-cockpit.md`

Safety note:
Local-only deterministic reporting. It does not use APIs, scrape, browse, connect CRMs, send outreach, send email, automate LinkedIn, use payments, use credentials, or access external databases. Human approval remains required before external action.

## `npm run mac:summary`

Purpose:
Refresh the Mac Daily summary, system health, and action cockpit from existing local outputs without rerunning the full report sequence.

Example:

```sh
npm run mac:summary
```

Output files:
`output/mac-daily/mac-daily-summary.md`
`output/mac-daily/system-health.md`
`output/mac-daily/action-cockpit.md`

Safety note:
Summary-only local reporting. It reads existing local data and generated output files only. It does not rerun reports, use APIs, scrape, browse, connect CRMs, send outreach, send email, automate LinkedIn, use payments, use credentials, or access external databases.

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
