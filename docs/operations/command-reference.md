# Command Reference

All commands are local-first. None of these commands should send outreach, connect APIs, scrape websites, or use credentials.

## `npm run day:plan`

Purpose:
Generate today's Daily Revenue Loop plan from local lead, outreach, contact, opportunity, audit, proposal, evidence, and outreach tracking outputs.

Example:

```sh
npm run day:plan
```

Output files:
`output/daily-revenue/today-plan.md`
`output/daily-revenue/highest-priority-actions.md`
`output/daily-revenue/followup-priorities.md`
`output/daily-revenue/proposal-priorities.md`
`output/daily-revenue/audit-priorities.md`
`output/daily-revenue/revenue-opportunities.md`

Safety note:
Planning only. It does not send outreach, send emails, send proposals, send invoices, create payment links, create calendar events, auto-contact leads, invent replies, invent meetings, invent opportunities, invent revenue, or infer client interest.

## `npm run day:summary`

Purpose:
Generate today's local activity summary from existing Studio data and generated files.

Example:

```sh
npm run day:summary
```

Output file:
`output/daily-revenue/today-summary.md`

Safety note:
Counts reflect current local files and JSON records. No conversations, revenue, meetings, or client interest are inferred.

## `npm run week:review`

Purpose:
Generate a weekly revenue review with top opportunities, pipeline health, research gaps, evidence gaps, and next week priorities.

Example:

```sh
npm run week:review
```

Output file:
`output/daily-revenue/week-review.md`

Safety note:
Weekly planning only. It does not send outreach, send proposals, create invoices, use credentials, call APIs, or take external action.

## `npm run sow:generate`

Purpose:
Generate a reviewable proposal and SOW package in Markdown and PDF from the local client audit report and evidence.

Example:

```sh
npm run sow:generate -- --company PushPress
```

Output files:
`output/proposals/{company_id}-proposal.md`
`output/proposals/{company_id}-proposal.pdf`

Inputs:
`output/client-audit-reports`
`output/unified-audits`
`output/opportunities`
`output/evidence`

Safety note:
Review-only proposal and SOW package. It does not generate contracts, invoices, payment requests, send proposals, send emails, send outreach, use credentials, invent findings, invent bugs, invent vulnerabilities, invent incidents, invent outages, invent customer quotes, or invent metrics. Daniel approval is required before external use.

## `npm run sow:portfolio`

Purpose:
Generate portfolio-level proposal summary, proposal priorities, and retainer candidate reports.

Example:

```sh
npm run sow:portfolio
```

Output files:
`output/proposals/proposal-summary.md`
`output/proposals/proposal-priorities.md`
`output/proposals/retainer-candidates.md`

Safety note:
Local summary only. It reads generated proposal packages and does not send proposals, emails, outreach, contracts, invoices, payment requests, or external communications.

## `npm run audit:pdf`

Purpose:
Generate a client-ready QA Audit Report in Markdown, HTML, and PDF from the local Unified Audit evidence.

Example:

```sh
npm run audit:pdf -- --company PushPress
```

Output files:
`output/client-audit-reports/{company_id}-qa-audit-report.md`
`output/client-audit-reports/{company_id}-qa-audit-report.html`
`output/client-audit-reports/{company_id}-qa-audit-report.pdf`

Inputs:
`output/unified-audits`
`output/playwright-runner`
`output/lighthouse`
`output/opportunities`
`output/evidence`

Safety note:
Client audit report only. It does not generate proposals, contracts, invoices, payment requests, outreach, confirmed bugs, confirmed vulnerabilities, confirmed outages, invented findings, invented complaints, invented customer quotes, or invented metrics. Daniel approval is required before sending or external use.

## `npm run audit:pdf-portfolio`

Purpose:
Generate portfolio-level client audit report summary and readiness files.

Example:

```sh
npm run audit:pdf-portfolio
```

Output files:
`output/client-audit-reports/portfolio-summary.md`
`output/client-audit-reports/report-readiness.md`

Safety note:
Local summary only. It reads generated client audit artifacts and does not send reports, browse, scan, authenticate, generate proposals, use credentials, or invent findings.

## `npm run audit:unified`

Purpose:
Generate one professional unified QA audit report for a company from existing local Studio evidence.

Example:

```sh
npm run audit:unified -- --company PushPress
```

Output file:
`output/unified-audits/{company_id}-unified-audit.md`

Inputs:
`output/opportunities`
`output/audit-packs`
`output/evidence`
`output/playwright-runner`
`output/lighthouse`

Safety note:
Unified audit report only. It does not generate proposals, contracts, invoices, payment requests, outreach, confirmed bugs, confirmed vulnerabilities, confirmed outages, invented findings, invented complaints, invented customer quotes, or invented metrics. Daniel approval is required before external use.

## `npm run audit:unified-summary`

Purpose:
Generate portfolio-level unified audit summary, priorities, comparison, and readiness reports.

Example:

```sh
npm run audit:unified-summary
```

Output files:
`output/unified-audits/audit-summary.md`
`output/unified-audits/audit-priorities.md`
`output/unified-audits/audit-comparison.md`
`output/unified-audits/audit-readiness.md`

Safety note:
Local summary only. It reads existing local audit and evidence outputs and does not browse, scan, authenticate, send outreach, generate proposals, use credentials, or invent findings.

## `npm run evidence:lighthouse`

Purpose:
Collect objective Lighthouse evidence for one public homepage URL.

Example:

```sh
npm run evidence:lighthouse -- --company PushPress -- --url https://www.pushpress.com
```

Output files:
`output/lighthouse/{company_id}-lighthouse.md`
`data/evidence/lighthouse/reports/{company_id}-lighthouse-evidence.json`
`data/evidence/lighthouse/raw/{company_id}-lighthouse-lhr.json`
`data/evidence/lighthouse/raw/{company_id}-lighthouse.html`

Safety note:
Homepage-only public evidence. It captures only Performance, Accessibility, Best Practices, and SEO scores. It does not authenticate, log in, create accounts, submit forms, submit payments, crawl aggressively, use credentials, run vulnerability scans, or perform penetration testing.

## `npm run evidence:lighthouse-summary`

Purpose:
Generate portfolio summaries from existing local Lighthouse evidence without rerunning Lighthouse.

Example:

```sh
npm run evidence:lighthouse-summary
```

Output files:
`output/lighthouse/lighthouse-summary.md`
`output/lighthouse/lighthouse-priorities.md`
`output/lighthouse/lighthouse-comparison.md`

Safety note:
Local summary only. It reads `data/evidence/lighthouse/reports` and does not browse, scan, authenticate, use credentials, or contact websites.

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
Generate Sprint 69 client onboarding from local client delivery data and existing audit, proposal, evidence, Playwright, Lighthouse, and Daily Revenue Loop outputs.

Example:

```sh
npm run client:onboard -- --client pushpress
```

Output file:
`output/client-delivery/client-onboarding.md`

Safety note:
Review-only onboarding. It does not send reports, send emails, create invoices, create contracts, create payment links, use credentials, access production client systems, invent client feedback, invent client satisfaction, or invent delivered work.

## `npm run client:weekly-report`

Purpose:
Generate a weekly client report draft from local delivery data and generated evidence artifacts.

Example:

```sh
npm run client:weekly-report -- --client pushpress
```

Output file:
`output/client-delivery/weekly-report.md`

Safety note:
Review-only weekly report. It is not sent and does not invent delivered work, client feedback, client satisfaction, payment status, or acceptance.

## `npm run client:monthly-report`

Purpose:
Generate a monthly client report draft with executive summary, local work evidence, automation progress, risks, and recommendations.

Example:

```sh
npm run client:monthly-report -- --client pushpress
```

Output file:
`output/client-delivery/monthly-report.md`

Safety note:
Review-only monthly report. No report, email, invoice, payment request, contract, or external action is sent.

## `npm run client:renewal-check`

Purpose:
Generate renewal review, client health, and retention opportunity drafts based only on local project data.

Example:

```sh
npm run client:renewal-check -- --client pushpress
```

Output files:
`output/client-delivery/renewal-review.md`
`output/client-delivery/client-health.md`
`output/client-delivery/client-retention.md`

Safety note:
Renewal planning only. Health and renewal probability are local project-data signals, not client satisfaction or client intent.

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

## `npm run dashboard:generate`

Purpose:
Generate the Sprint 67 read-only PWA dashboard data from Daily Revenue Loop, opportunity, audit, proposal, evidence, and outreach tracking outputs.

Example:

```sh
npm run dashboard:generate
```

Output files:
`output/dashboard/dashboard.json`
`output/dashboard/dashboard-summary.md`
`output/dashboard/dashboard-health.md`
`dashboard/dashboard.json`
`data/dashboard/dashboard.json`

Safety note:
Read-only dashboard generation. It does not send outreach, send emails, send proposals, create invoices, create payments, modify data, call APIs, use credentials, or take external action.

## `npm run dashboard:build`

Purpose:
Build and verify the static local dashboard package under `dashboard/`.

Example:

```sh
npm run dashboard:build
```

Output files:
`dashboard/index.html`
`dashboard/styles.css`
`dashboard/app.js`
`dashboard/manifest.json`
`dashboard/dashboard.json`

Safety note:
Static local build only. No data is modified beyond generated dashboard artifacts.

## `npm run dashboard:preview`

Purpose:
Serve the static dashboard locally for phone or browser review.

Example:

```sh
npm run dashboard:preview
```

Preview URL:
`http://127.0.0.1:4177/dashboard/index.html`

Safety note:
Local preview server only. It does not expose a SaaS, client portal, CRM, sending workflow, API integration, payment system, or external service.

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

## `npm run finance:monthly`

Purpose:
Generate the local monthly finance package from `data/finance/finance.json`, including current MRR, target progress, one-time revenue, operating cost, net monthly profit, MRR tracker, and local revenue opportunities.

Example:

```sh
npm run finance:monthly
```

Output files:
`output/finance/monthly-finance.md`
`output/finance/mrr-tracker.md`
`output/finance/revenue-opportunities.md`

Safety note:
Booked revenue is counted only from local finance records with status `booked` or `received`. This command does not process payments, send invoices, create payment links, connect Stripe, connect PayPal, connect banks, call APIs, scrape, browse, use credentials, or treat lead candidates as booked revenue.

## `npm run finance:dashboard`

Purpose:
Generate the local finance dashboard with current MRR, target MRR progress, best revenue opportunity, retainer candidates, audit candidates, monthly forecast, savings forecast, and property progress.

Example:

```sh
npm run finance:dashboard
```

Output files:
`output/finance/finance-dashboard.md`
`output/finance/monthly-finance.md`
`output/finance/mrr-tracker.md`
`output/finance/revenue-opportunities.md`
`output/finance/savings-plan.md`
`output/finance/property-progress.md`

Safety note:
Dashboard opportunities are local lead candidates only. The dashboard does not invent revenue, process payments, create invoices, create payment links, call APIs, scrape, browse, connect financial systems, use credentials, or move money.

## `npm run finance:forecast`

Purpose:
Generate local conservative, base case, and aggressive finance forecasts using approved offer ranges only.

Example:

```sh
npm run finance:forecast
```

Output files:
`output/finance/finance-forecast.md`
`output/finance/savings-plan.md`
`output/finance/property-progress.md`

Safety note:
Forecasts are planning math only. They do not claim revenue exists unless it is stored in `data/finance/finance.json`, and they do not connect payment tools, invoices, APIs, CRMs, scraping, browsing, external databases, banks, or credentials.

## `npm run revenue:targets`

Purpose:
Generate Sprint 72 revenue targets for First Audit Sold, First Starter Pack Sold, First Retainer Sold, and $3,000 MRR.

Example:

```sh
npm run revenue:targets
```

Output files:
`output/revenue/revenue-targets.md`
`output/revenue/first-client-plan.md`

Safety note:
Revenue targets use local finance and Studio readiness data only. They do not send outreach, send emails, send proposals, create invoices, create payments, invent meetings, invent replies, invent revenue, or infer client interest.

## `npm run revenue:pipeline`

Purpose:
Rank PushPress, TeamUp, Glofox, and Wodify by opportunity score, evidence readiness, proposal readiness, contact readiness, and audit readiness.

Example:

```sh
npm run revenue:pipeline
```

Output files:
`output/revenue/revenue-pipeline.md`
`output/revenue/first-retainer-plan.md`

Safety note:
Pipeline scores are readiness scores, not booked revenue or client interest. Human approval is required before external action.

## `npm run revenue:focus`

Purpose:
Answer the daily execution question: if Daniel only had 30 minutes today, what should he do to move toward the first paying client?

Example:

```sh
npm run revenue:focus
```

Output files:
`output/revenue/revenue-focus.md`
`output/revenue/first-client-plan.md`
`output/revenue/first-retainer-plan.md`

Safety note:
Focus actions are planning only. This command does not send outreach, follow-ups, proposals, invoices, payments, or client updates.

## `npm run revenue:score`

Purpose:
Generate the detailed revenue activation scorecard for the four current target companies.

Example:

```sh
npm run revenue:score
```

Output files:
`output/revenue/revenue-score.md`
`output/revenue/revenue-pipeline.md`

Safety note:
Scores use local Studio evidence only and do not invent meetings, replies, revenue, client commitments, or results.

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

## `npm run mobile:review`

Purpose:
Generate the Sprint 68 Mobile Command Center review package for audits, proposals, evidence, follow-ups, revenue priorities, and the Top 5 action queue.

Example:

```sh
npm run mobile:review
```

Output files:
`output/mobile/mobile-review.md`
`output/mobile/mobile-summary.md`
`output/mobile/mobile-queue.md`
`output/mobile/mobile-priorities.md`
`output/mobile/mobile-health.md`

Safety note:
Read-only review package. It does not send outreach, send emails, send proposals, send invoices, create payment requests, modify lead data, modify proposal data, call APIs, use credentials, or take external action.

## `npm run mobile:summary`

Purpose:
Refresh only the compact Sprint 68 mobile summary from dashboard and local Studio outputs.

Example:

```sh
npm run mobile:summary
```

Output file:
`output/mobile/mobile-summary.md`

Safety note:
Summary-only local report generation. It does not schedule or send follow-ups, automate outreach, send proposals, connect CRMs, call APIs, use external databases, use credentials, or modify data.

## `npm run mobile:queue`

Purpose:
Generate the mobile action queue with Priority 1 through Priority 5, reason, impact, and recommended action.

Example:

```sh
npm run mobile:queue
```

Output file:
`output/mobile/mobile-queue.md`

Safety note:
Queue is review-only. It does not send messages, proposals, invoices, payments, or modify data.

## `npm run dashboard:mobile`

Purpose:
Serve the PWA dashboard on the local network for same-WiFi iPhone, Android, or desktop browser review.

Example:

```sh
npm run dashboard:mobile
```

Output:
Prints local network URLs such as `http://192.168.x.x:4177/dashboard/index.html`.

Safety note:
Local network only. This is not public deployment, a client portal, CRM, SaaS, payment flow, or sending tool.

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

## `npm run studio:health`

Purpose:
Generate Sprint 71 Studio Health checks across lead research, contact research, outreach tracking, opportunity, audit, evidence, proposal, daily revenue, client delivery, finance, dashboard, and mobile command center modules.

Example:

```sh
npm run studio:health
```

Output files:
`output/studio/studio-health.md`
`output/studio/command-status.md`
`output/studio/system-readiness.md`

Safety note:
Local file and command validation only. It does not send outreach, send emails, send proposals, create invoices, create payments, call APIs, scrape, browse, use credentials, invent clients, invent results, or invent revenue.

## `npm run studio:summary`

Purpose:
Generate a consolidated Studio operating summary with revenue readiness, daily/weekly/monthly command cadence, daily operation readiness, and the Sprint 72 recommendation.

Example:

```sh
npm run studio:summary
```

Output files:
`output/studio/studio-summary.md`
`output/studio/daily-operation-readiness.md`
`output/studio/system-readiness.md`

Safety note:
Review-only local reporting. Current MRR comes from local finance data only; candidates, forecasts, and pipeline estimates are not booked revenue.

## `npm run studio:release-check`

Purpose:
Generate the Sprint 71 release check with critical issues, warnings, recommendations, and readiness for outreach, audit sales, retainers, and client delivery.

Example:

```sh
npm run studio:release-check
```

Output files:
`output/studio/release-check.md`
`output/studio/system-readiness.md`
`output/studio/daily-operation-readiness.md`
`output/studio/command-status.md`

Safety note:
Uses only local evidence. It does not send outreach, emails, proposals, invoices, payments, client updates, call APIs, scrape, browse, connect external systems, invent revenue, invent clients, or invent results.

## `npm run executive:summary`

Purpose:
Generate a business-readable executive summary for one company using existing Opportunity Engine, Audit Pack, Evidence, Playwright, Lighthouse, Unified Audit, Proposal, and Revenue Activation outputs.

Example:

```sh
npm run executive:summary -- --company PushPress
```

Output file:
`output/executive/{company_id}-executive-summary.md`

Safety note:
Executive summaries translate existing QA evidence into business language. They do not invent revenue, customers, conversions, bugs, outages, incidents, vulnerabilities, lost sales, churn, customer complaints, customer quotes, outreach, proposals, invoices, or payments.

## `npm run executive:portfolio`

Purpose:
Generate portfolio-level executive business risk, priorities, roadmap, readiness, ranking, and company executive summaries.

Example:

```sh
npm run executive:portfolio
```

Output files:
`output/executive/pushpress-executive-summary.md`
`output/executive/teamup-executive-summary.md`
`output/executive/glofox-executive-summary.md`
`output/executive/business-risk.md`
`output/executive/executive-priorities.md`
`output/executive/executive-roadmap.md`
`output/executive/executive-portfolio.md`
`output/executive/executive-readiness.md`

Safety note:
Portfolio reports are local-only and review-only. They use potential, possible, may indicate, and could increase risk language where uncertainty exists and require human approval before external use.

## `npm run execute:first-client`

Purpose:
Generate the First Revenue Execution Pack for the current top target, including first-client checklist, first-revenue checklist, and manual execution plan.

Example:

```sh
npm run execute:first-client
```

Output files:
`output/execution/first-client-checklist.md`
`output/execution/first-revenue-checklist.md`
`output/execution/manual-execution-plan.md`

Safety note:
GO means ready for Daniel's manual review, not permission to send. This command never sends outreach, sends emails, creates invoices, creates payments, creates meetings, or claims revenue.

## `npm run execute:decision-board`

Purpose:
Generate a GO / NO GO decision board with exact reasons, remaining blockers, manual next action, time to execute, estimated value, and confidence score.

Example:

```sh
npm run execute:decision-board
```

Output file:
`output/execution/decision-board.md`

Safety note:
Decision support only. Revenue value is an approved offer range, not booked revenue. Human approval remains required before external action.

## `npm run execute:outreach-review`

Purpose:
Generate an outreach readiness review for the current top target without generating or sending a message.

Example:

```sh
npm run execute:outreach-review
```

Output file:
`output/execution/outreach-review.md`

Safety note:
Review-only. It never sends outreach, emails, meeting invites, proposals, invoices, or payment links, and it does not infer replies, interest, meetings, clients, or revenue.

## `npm run outcome:add`

Purpose:
Initialize the local outcome store or append an explicit Daniel-entered manual outcome record.

Example:

```sh
npm run outcome:add -- --company PushPress --contact "Manual Contact" --channel linkedin --date 2026-06-13 --action-type manual_dm --message-sent true --response-status sent --next-action "Wait for reply"
```

Data file:
`data/outcomes/outcomes.json`

Safety note:
Manual outcome tracking only. It never sends messages, emails, proposals, meetings, invoices, payments, replies, interest, or revenue.

## `npm run outcome:dashboard`

Purpose:
Generate local outcome dashboard reports for pipeline status, response rates, and revenue by source.

Example:

```sh
npm run outcome:dashboard
```

Output files:
`output/outcomes/pipeline-status.md`
`output/outcomes/response-rates.md`
`output/outcomes/revenue-by-source.md`

Safety note:
Uses only manually recorded local outcomes. If no outcomes exist, reports say `No outcomes recorded yet.`

## `npm run outcome:review`

Purpose:
Generate win-loss and lessons-learned reports from manually recorded outcomes.

Example:

```sh
npm run outcome:review
```

Output files:
`output/outcomes/win-loss-analysis.md`
`output/outcomes/lessons-learned.md`

Safety note:
No replies, client interest, revenue, wins, losses, or meetings are inferred.

## `npm run message:review`

Purpose:
Generate a safety and readiness review for manual PushPress message drafts.

Example:

```sh
npm run message:review -- --company PushPress
```

Output files:
`output/messages/pushpress-message-review.md`
`output/messages/message-priorities.md`

Safety note:
Manual review only. It does not send LinkedIn messages, emails, proposals, meeting invites, invoices, payment links, or claims.

## `npm run message:pack`

Purpose:
Generate concise manual-review message drafts for LinkedIn, email, follow-up, executive angle, audit offer angle, and interested-reply handling.

Example:

```sh
npm run message:pack -- --company PushPress
```

Output files:
`output/messages/pushpress-message-pack.md`
`output/messages/approved-manual-messages.md`

Safety note:
Drafts use public-page QA review language and potential/may indicate framing. Nothing is sent or approved for external use until Daniel manually reviews it.

## `npm run followup:queue`

Purpose:
Generate the local Follow-Up Operating System queue with categories for first message, follow-up, waiting response, proposal review, paused, closed won, and closed lost.

Example:

```sh
npm run followup:queue
```

Output files:
`output/followups/followup-queue.md`
`output/followups/followup-cadence.md`

Safety note:
Planning only. It does not send messages, emails, proposals, meeting invites, invoices, payment links, or outcomes.

## `npm run followup:daily`

Purpose:
Generate today's Top 5 manual follow-ups with reason, suggested message type, priority score, and expected next step.

Example:

```sh
npm run followup:daily
```

Output file:
`output/followups/daily-followup-plan.md`

Safety note:
Manual review only. Suggested message type is not a sent message and does not imply client interest.

## `npm run followup:priorities`

Purpose:
Generate ranked follow-up priorities and dashboard summary counts.

Example:

```sh
npm run followup:priorities
```

Output file:
`output/followups/followup-priorities.md`

Safety note:
Uses local Revenue Activation, Outcome Tracking, Message Review, Executive Layer, and Execution Pack outputs only.

## `npm run followup:review`

Purpose:
Generate the follow-up review layer: what is stuck, what is moving, what needs Daniel attention, biggest opportunity, and biggest risk.

Example:

```sh
npm run followup:review
```

Output file:
`output/followups/followup-review.md`

Safety note:
Does not invent replies, meetings, proposals, revenue, client interest, wins, losses, or outcomes.

## `npm run winloss:analysis`

Purpose:
Generate local win/loss metrics from manually recorded Outcome Tracking data.

Example:

```sh
npm run winloss:analysis
```

Output files:
`output/winloss/win-loss-analysis.md`
`output/winloss/offer-performance.md`

Safety note:
If there is insufficient outcome data, the report says so. It does not invent outcomes, replies, meetings, revenue, clients, wins, or losses.

## `npm run winloss:patterns`

Purpose:
Generate supported local pattern analysis and reply patterns.

Example:

```sh
npm run winloss:patterns
```

Output files:
`output/winloss/pattern-analysis.md`
`output/winloss/reply-patterns.md`

Safety note:
Only patterns supported by local outcomes are reported.

## `npm run winloss:insights`

Purpose:
Generate opportunity insights such as highest converting segment, highest converting offer, most promising target profile, and biggest weakness.

Example:

```sh
npm run winloss:insights
```

Output file:
`output/winloss/opportunity-insights.md`

Safety note:
No revenue, clients, replies, meetings, or interest are inferred.

## `npm run winloss:strategy`

Purpose:
Generate strategy recommendations from real local outcomes.

Example:

```sh
npm run winloss:strategy
```

Output file:
`output/winloss/strategy-recommendations.md`

Safety note:
Recommendations are evidence-based and local-only. Human approval remains required before any external action.

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
