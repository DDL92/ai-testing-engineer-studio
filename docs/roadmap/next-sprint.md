# Next Sprint Roadmap

## Sprint 1: Documentation Foundation

Goal:
Create the core operating documentation for token-efficient Codex work, task templates, loop architecture, and the next-sprint roadmap.

Why it matters:
The project needs clear constraints before more modules are built. This prevents overengineering and keeps the business focused on local-first revenue workflows.

Expected commands if relevant:

```sh
git status --short
ls docs
find docs -maxdepth 3 -type f | sort
```

What not to build yet:
Do not implement application code, dashboards, integrations, package installs, or automated outreach.

## Sprint 2: Lead Tracker + Scoring Model

Goal:
Create a local lead tracker and simple scoring model for manually reviewed QA Automation opportunities.

Why it matters:
Daniel needs a low-cost way to identify and prioritize leads before spending time on audits or proposals.

Expected commands if relevant:

```sh
npm run lead:review
```

What not to build yet:
Do not add paid CRM tools, aggressive scraping, auto-DMs, mass email, or contact enrichment using private data.

Completion notes:

- Added a local-first lead tracker under `src/leads`.
- Added deterministic 0-10 lead scoring with reasons and recommended offer selection.
- Added `data/leads.json` as the simple local source of truth.
- Added `npm run leads:seed` to create five fake sample leads idempotently.
- No outreach, scraping, external APIs, CRM integrations, dashboards, or paid services were added.

Sprint 3 should create `npm run day:plan` using the local lead data to recommend daily review, audit, proposal, and follow-up priorities while still requiring human approval before any external action.

## Sprint 3: Day Plan Generator

Goal:
Create a local daily planning command that turns current pipeline, delivery, and admin context into a focused work plan.

Why it matters:
A solo business needs a repeatable operating rhythm that prioritizes revenue-producing work.

Expected commands if relevant:

```sh
npm run day:plan
```

What not to build yet:
Do not create a full calendar system, notification bot, dashboard, or autonomous agent.

Completion notes:

- Added `npm run day:plan` as a local deterministic planning command.
- Added day plan rules under `src/dayPlan` that prioritize high-score leads, audit-ready leads, agency partner retainers, and QA automation retainers.
- Generated `output/day-plan.md` with summary, top revenue actions, manual actions, safety rules, and suggested next commands.
- Lost, paused, and not-fit leads are excluded from revenue actions.
- No outreach, scraping, external APIs, dashboards, credentials, or autonomous actions were added.

Sprint 4 should create `npm run lead:pack` so each selected lead can produce a focused manual review pack with offer fit, QA pain signals, audit angle, and approved next-step options.

## Sprint 4: Lead Pack Generator

Goal:
Generate small lead packs from approved local inputs with scoring, QA pain signals, and recommended manual next actions.

Why it matters:
Lead packs feed the first revenue loop: Lead -> Audit -> Proposal -> Retainer -> Monthly Report -> Renewal.

Expected commands if relevant:

```sh
npm run lead:pack
```

What not to build yet:
Do not automate outreach, bypass site rules, scrape aggressively, or purchase lead data.

Completion notes:

- Added `npm run lead:pack -- --id lead_id` as a local manual-review pack generator.
- Added lead pack rules under `src/leadPack` for overview, score, fit, pain points, offer, audit angle, outreach angle, drafts, call questions, proposal angle, risks, next action, and suggested commands.
- Generated packs write to `output/lead-packs/{lead_id}.md`.
- Message drafts are concise, manual-review only, based on existing local lead fields, and include no invented claims or fake metrics.
- No outreach, scraping, external APIs, CRM integrations, dashboards, credentials, or automated sending were added.

Sprint 5 should create the QA Audit Pack base so approved leads can produce Playwright/Lighthouse evidence and a client-ready audit summary from an explicitly approved URL.

## Sprint 5: QA Audit Pack Base With Playwright/Lighthouse Evidence

Goal:
Create the first repeatable QA Audit Pack workflow using Playwright evidence, Lighthouse snapshots, screenshots, and markdown/HTML reporting.

Why it matters:
Audit evidence is the core delivery asset for paid QA audits, proposals, and retainer conversion.

Expected commands if relevant:

```sh
npm run audit:site
```

What not to build yet:
Do not test production systems without approval, use real credentials by default, or overbuild a complete audit platform.

Completion notes:

- Added `npm run audit:site -- --url https://example.com` as a local Playwright-based QA Audit Pack command.
- Added passive homepage evidence capture under `src/audit`, including final URL, page title, console errors, visible landmark counts, forms, buttons, links, and a homepage screenshot.
- Generated audit output under `output/audits/{safe-domain}/audit-report.md`.
- Findings use cautious language such as potential issue, recommended manual review, and automation opportunity.
- No login, form submission, payment testing, scraping, Lighthouse claims, accessibility compliance claims, dashboards, credentials, or outreach were added.

Sprint 6 should create `npm run sow:generate` so approved lead packs and audit reports can become manually reviewed proposal/SOW drafts.

## Sprint 6: Proposal/SOW Generator

Goal:
Create a local generator for draft proposals and statements of work using reviewed lead context, audit findings, offer type, and pricing guidance.

Why it matters:
Fast, consistent proposals help convert qualified audits into paid engagements.

Expected commands if relevant:

```sh
npm run sow:generate
```

What not to build yet:
Do not send proposals automatically, create e-signature integrations, or make binding commitments without review.

Completion notes:

- Added `npm run sow:generate -- --id lead_id` as a local Proposal/SOW draft generator.
- Added SOW rules under `src/sow` for executive summary, QA opportunity, recommended offer, scope, deliverables, timeline, pricing, assumptions, exclusions, client responsibilities, success criteria, next step, and safety review.
- Generated drafts write to `output/sows/{lead_id}-sow.md`.
- Included three standard pricing options: QA Audit, Playwright Starter Pack, and QA Automation Retainer.
- SOW drafts use cautious language, avoid invented audit findings, avoid fake client data, and require manual approval before sending.

Sprint 7 should create `npm run client:report` so active client work can produce weekly or monthly client-ready progress reports with evidence, risks, next actions, and renewal context.

## Sprint 7: Client Report Generator

Goal:
Create a local generator for weekly and monthly client reports with evidence, progress, risks, and recommended next actions.

Why it matters:
Reporting supports retention, renewal, trust, and upsell opportunities for QA retainers.

Expected commands if relevant:

```sh
npm run client:report
```

What not to build yet:
Do not send reports automatically, expose sensitive screenshots, or connect to client systems without approval.

Completion notes:

- Added `npm run client:report -- --id client_id` as a local client report generator.
- Added fake/demo client data in `data/clients.json` for one QA Automation Retainer client and one Playwright Starter Pack client.
- Added client report rules under `src/clientReports` for executive summary, completed work, current QA coverage, risks, automation opportunities, next steps, retainer value, next-week focus, and manual review notes.
- Generated reports write to `output/client-reports/{client_id}-report.md`.
- Reports use local data only, avoid invented metrics or ROI claims, and require manual approval before sending.
- Updated `tsconfig.json` to use a modern `NodeNext` module/moduleResolution pairing instead of deprecated Node resolution.

Sprint 8 should create a Metrics + Revenue Tracker using local data to summarize monthly revenue, offer performance, pipeline value, and progress toward the $3,000-$5,000/month and $7,000-$10,000/month targets.

## Sprint 8: Metrics + Revenue Tracker

Goal:
Create a simple local metrics and revenue tracker for monthly revenue, pipeline value, offer performance, and follow-up health.

Why it matters:
The business needs visibility into progress from $3,000-$5,000/month toward $7,000-$10,000/month.

Expected commands if relevant:

```sh
npm run revenue:monthly
```

What not to build yet:
Do not connect bank accounts, payment processors, tax tools, or paid analytics platforms.

Completion notes:

- Added `npm run metrics:revenue` as a local metrics and revenue summary command.
- Added revenue rules under `src/metrics` for lead pipeline counts, top scored leads, active clients, service mix, MRR, one-time opportunity estimates, retainer opportunity estimates, at-risk clients, and next revenue actions.
- Generated `output/metrics/revenue-summary.md`.
- MRR uses only active retainer clients and their `monthlyFee` values from `data/clients.json`.
- Lead opportunity ranges are clearly labeled as estimates and are not treated as booked revenue.
- No APIs, dashboards, payment integrations, credentials, outreach, or invented revenue were added.

Sprint 9 should create the Mac Daily Runner so Daniel can run the key local commands in a predictable daily sequence with safe stopping points.

## Sprint 9: Mac Daily Runner

Goal:
Create a lightweight local runner for daily operating commands on Daniel's Mac.

Why it matters:
Daily operations should run locally with minimal Codex usage and minimal manual setup.

Expected commands if relevant:

```sh
npm run mac:daily
```

What not to build yet:
Do not install background agents, auto-send messages, or create risky unattended automation.

Completion notes:

- Added `npm run mac:daily` as a local daily runner.
- The runner refreshes `output/day-plan.md` and `output/metrics/revenue-summary.md` by calling the existing local commands.
- Added `output/daily/daily-briefing.md` with revenue focus, top actions, revenue snapshot, generated file paths, suggested manual actions, suggested commands, and safety rules.
- No launchd automation, notifications, APIs, scraping, dashboards, credentials, or outreach were added.

Sprint 10 should clean up the dashboard/action cockpit only after the local command outputs are stable, focusing on surfacing the same highest-value next actions without adding paid tools or unnecessary complexity.

## Sprint 10: Dashboard Cleanup/Action Cockpit

Goal:
Clean up existing dashboard or action cockpit views so they show only the highest-value next actions and business status.

Why it matters:
A dashboard is useful only after the underlying loops produce reliable local data.

Expected commands if relevant:

```sh
npm run dashboard
```

What not to build yet:
Do not build a complex BI platform, add paid dashboard tools, or create a dashboard before data flows are stable.

Completion notes:

- Added `npm run cockpit` as a local Action Cockpit generator.
- Generated `output/cockpit/action-cockpit.md` and a simple static `output/cockpit/action-cockpit.html`.
- The cockpit reads local leads, clients, and existing generated outputs only.
- It shows today's focus, revenue snapshot, top leads, active clients, generated files, next manual actions, recommended commands, and safety rules.
- No APIs, web server, auth, database, dashboard framework, credentials, scraping, outreach, or external services were added.

Sprint 11 should create `npm run content:from-audits` to turn approved, sanitized audit themes into draft content ideas without publishing automatically or exposing client details.

## Sprint 11: Content From Audits

Goal:
Create a system for turning sanitized audit findings into content drafts and ideas.

Why it matters:
Content can build authority and generate inbound interest without cold automation or paid tools.

Expected commands if relevant:

```sh
npm run content:from-audits
```

What not to build yet:
Do not auto-publish, mention clients without permission, or expose confidential audit findings.

Completion notes:

- Added `npm run content:from-audits` as a local content draft generator.
- The generator scans `output/audits/**/audit-report.md`, extracts cautious local findings, and writes `output/content/content-calendar.md`.
- Generated drafts include LinkedIn, Instagram carousel, short-video script, and QA lesson formats.
- Drafts are anonymized by default, educational, and use only local audit language.
- No APIs, AI calls, Canva, images, video automation, dashboards, posting, credentials, or invented findings were added.

Sprint 12 should create a Real Outbound Operating Pack for manual, approved outreach workflows: reviewed lead context, approved message drafts, follow-up checklist, and send/no-send decision support without auto-sending.

## Sprint 12: Real Outbound Operating Pack

Goal:
Create a manual outbound operating pack for reviewed leads, approved message drafts, follow-up checklists, and send/no-send decision support.

Why it matters:
Outbound should remain human-approved, low-volume, evidence-led, and connected to lead packs, audits, and SOW drafts.

Expected commands if relevant:

```sh
npm run outbound:pack
```

What not to build yet:
Do not auto-send outreach, add CRM integrations, scrape contact data, create mass email workflows, or bypass manual approval.

Completion notes:

- Added a documentation-first Real Outbound Operating Pack under `docs/outbound`.
- Documented ICPs, first 50 target framework, daily outbound SOP, message library, follow-up library, qualification scoring, audit offer ladder, and outbound tracking framework.
- Outbound remains manual, low-volume, evidence-led, and human-approved.
- No scraping, browser automation, APIs, CRM integrations, dashboards, credentials, package installs, or message sending were added.

Sprint 13 should create a Real Lead Intake System that turns manually researched leads into structured local data for review, scoring, day planning, lead packs, audits, SOWs, and outbound tracking.

## Sprint 13: Real Lead Intake System

Goal:
Create a local, manual lead intake workflow for adding real prospects into structured JSON/CSV without scraping, APIs, CRM integrations, or automated outreach.

Why it matters:
The outbound operating pack needs a practical way to move manually researched leads into the local AI Studio OS pipeline so Daniel can score, review, and act on them consistently.

Expected commands if relevant:

```sh
npm run lead:intake
```

What not to build yet:
Do not scrape leads, enrich private contact data, connect LinkedIn/email APIs, auto-send messages, or add CRM/SaaS integrations.

Completion notes:

- Added `npm run lead:add -- --company ... --website ... --industry ... --source ... --notes ...` as a safe local lead intake command.
- Added deterministic lead ID generation, duplicate prevention by company and website, local scoring, recommended offer assignment, and suggested next commands.
- Updated the first 50 target framework with real lead intake examples for SaaS, e-commerce, and agency leads.
- Real lead intake remains manual-research only and does not scrape, enrich private data, call APIs, send messages, or connect a CRM.

Sprint 14 should integrate real lead intake with lead packs and outbound operations so newly added leads can move through review, lead pack generation, audit planning, SOW drafting, and manual send/no-send decisions.

## Sprint 14: Lead Pack + Real Outbound Integration

Goal:
Connect real manually added leads to lead packs, audit planning, SOW drafting, and outbound operating docs so Daniel has one repeatable manual path from lead intake to approved outreach.

Why it matters:
The system should help Daniel move from researched lead to qualified opportunity without relying on sample data, scraping, or automated messaging.

Expected commands if relevant:

```sh
npm run lead:pack -- --id lead_id
npm run outbound:review -- --id lead_id
```

What not to build yet:
Do not auto-send messages, scrape contact data, connect LinkedIn/email APIs, or create CRM/SaaS integrations.

Completion notes:

- Extended the lead model with optional outbound contact, channel, status, follow-up, notes, and qualification fields while keeping existing lead data compatible.
- Added deterministic outbound rules for channel recommendation, status recommendation, manual next action, follow-up timing, and outreach checklist generation.
- Updated lead packs with outbound status, contact information, qualification summary, outreach channel recommendation, manual outreach checklist, follow-up plan, and updated recommended next action.
- `npm run lead:pack -- --id lead_id` now also writes `output/outbound/{lead_id}-outbound-plan.md`.
- No messages are sent and no APIs, scraping, CRM integrations, dashboards, credentials, or external services were added.

Sprint 15 should polish the QA Audit Pack and prepare Lighthouse readiness without adding heavy dependencies or paid services.

## Sprint 15: Audit Pack Polish + Lighthouse Readiness

Goal:
Improve QA Audit Pack output quality, evidence organization, and Lighthouse readiness planning while keeping the audit workflow local-first and safe.

Why it matters:
Audit reports are directly monetizable and should be client-ready, cautious, evidence-backed, and easy to turn into SOWs or retainers.

Expected commands if relevant:

```sh
npm run audit:site -- --url https://example.com
```

What not to build yet:
Do not add paid tools, heavy dashboards, credentialed testing, production form submission, payment testing, or Lighthouse claims unless Lighthouse is explicitly installed and validated.

Completion notes:

- Upgraded QA Audit Pack report structure with executive summary, site overview, evidence metadata, severity summary, findings, automation opportunities, QA risk assessment, recommended next steps, suggested service path, Lighthouse readiness, manual review checklist, and scope limitations.
- Added deterministic severity summaries, key observations, QA risk assessment, and suggested service path logic.
- Prepared Lighthouse readiness language without installing Lighthouse, generating scores, or making performance/accessibility compliance claims.
- Audit evidence remains passive and local-first: screenshot, timestamp, final URL, page title, element counts, and console error count.
- No package installs, APIs, dashboards, credentials, login testing, payment testing, Lighthouse execution, or invented metrics were added.

Sprint 16 should polish proposal and pricing packs so audit evidence, lead fit, and service paths turn into clearer client-ready pricing options without overpromising scope.

## Sprint 16: Proposal + Pricing Pack Polish

Goal:
Improve Proposal/SOW output quality, pricing clarity, assumptions, exclusions, and service-path alignment with lead packs and audit reports.

Why it matters:
Daniel needs proposal drafts that are fast to review, commercially clear, bounded in scope, and easy to send manually after approval.

Expected commands if relevant:

```sh
npm run sow:generate -- --id lead_id
```

What not to build yet:
Do not send proposals automatically, add e-signature tools, connect payment systems, create legal templates beyond lightweight SOW drafts, or promise unlimited QA/results.

Completion notes:

- Upgraded Proposal/SOW output with clearer business-readable sections: why this matters, recommended service path, pricing options, recommended package, upgrade path, terms notes, and manual review note.
- Refined deterministic package rules for QA Audit, Playwright Starter Pack, QA Automation Retainer, and Agency Partner Retainer.
- Expanded pricing tier detail with deliverables, best-fit language, and bounded scope.
- Updated the audit offer framework with package positioning, comparison table, upgrade paths, recommendation rules, and what not to include.
- No proposal sending, APIs, packages, dashboards, credentials, invented audit findings, or unlimited-scope promises were added.

Sprint 17 should create the First 50 Lead List + Real Outreach Queue so Daniel can manually collect, score, review, and queue outbound work without scraping or automated sending.

## Sprint 17: First 50 Lead List + Real Outreach Queue

Goal:
Create a local manual workflow for building the first 50 real leads and queueing reviewed outbound actions without sending messages automatically.

Why it matters:
The system needs real prospects and a simple manual queue so daily work can move from planning into reviewed outreach, audit offers, and proposal opportunities.

Expected commands if relevant:

```sh
npm run lead:add -- --company "Company Name" --website "https://example.com" --industry "SaaS" --source "Manual Research"
npm run outreach:queue
```

What not to build yet:
Do not scrape, enrich private contact data, auto-send messages, connect LinkedIn/email APIs, or add CRM/SaaS integrations.

Completion notes:

- Added a local first-50 target structure in `data/first-50-targets.json` with fake/demo targets only.
- Added `npm run outreach:queue` to generate `output/outreach/outreach-queue.md`.
- The queue ranks leads by score, offer fit, outreach status, follow-up need, audit opportunity, proposal opportunity, and retainer potential.
- First 50 progress is summarized from local target statuses only.
- Suggested commands point Daniel to lead packs, audits, SOWs, daily planning, and cockpit review.
- No messages are sent and no APIs, scraping, CRM integrations, credentials, dashboards, or external services were added.

Sprint 18 should create a Lead Research Pack Generator so Daniel can manually research one target and produce a structured pre-lead review before adding it to `data/leads.json`.

## Sprint 18: Lead Research Pack Generator

Goal:
Create a local command that turns one first-50 target into a structured manual research pack before Daniel decides whether to add it as a lead.

Why it matters:
Daniel needs a consistent way to evaluate real targets before outreach, reduce low-fit leads, and keep the first 50 workflow disciplined.

Expected commands if relevant:

```sh
npm run lead:research -- --id lead_id
```

What not to build yet:
Do not scrape, browse automatically, enrich contact data, send messages, connect APIs, create dashboards, or add CRM integrations.

Completion notes:

- Added `npm run lead:research -- --id lead_id`.
- The command reads one local lead from `data/leads.json`, recalculates score and recommended offer, and writes `output/research/{lead_id}-research-pack.md`.
- Research packs include local lead summary, fit reasoning, potential QA risk areas, audit angles, automation opportunities, discovery questions, proposal angle, recommended offer, revenue potential, suggested commands, and assumptions.
- Risk and opportunity language is cautious and framed as manual-review suggestions only.
- No website inspection, external research, browsing, scraping, APIs, credentials, dashboards, or outreach were added.

Sprint 19 should consolidate the current system, validate the real-lead workflow, and document the daily operating process before adding more features.

## Sprint 19: System Consolidation + Real Lead Readiness Check

Goal:
Confirm the main local revenue workflow works end-to-end and document the exact daily usage process for real manually researched leads.

Why it matters:
Before adding more features, Daniel needs confidence that lead intake, research, lead packs, audits, SOWs, outreach queue, revenue summary, daily briefing, and cockpit outputs work together.

Expected commands if relevant:

```sh
npm run mac:daily
npm run cockpit
npm run outreach:queue
npm run system:check
```

What not to build yet:
Do not record calls, transcribe calls, send calendar invites, connect APIs, scrape, browse externally, create dashboards, or automate client communication.

Completion notes:

- Added operations documentation for daily usage, real lead readiness, command reference, and end-to-end demo flow.
- Added `npm run system:check` to verify key local files exist and generate `output/system-readiness/readiness-report.md`.
- Validated the main workflow commands for research pack, lead pack, audit, SOW, outreach queue, revenue summary, daily briefing, cockpit, and system readiness.
- The documented daily workflow keeps outreach, follow-ups, proposals, reports, and client communication manual and human-approved.
- No packages, APIs, scraping, credentials, dashboards, paid tools, MCP, Browserbase, Stagehand, Ruflo, or automated outreach were added.

Sprint 20 should create a Lead Discovery Assistant in manual review mode so Daniel can find better categories, search ideas, and manual discovery workflows without scraping, APIs, or automated outreach.

## Sprint 20: Lead Discovery Assistant (Manual Review Mode)

Goal:
Create a local command that generates lead discovery categories, ICP priorities, search ideas, and manual discovery workflow guidance.

Why it matters:
Daniel should spend less time wondering where to look for leads and more time evaluating high-quality opportunities.

Expected commands if relevant:

```sh
npm run lead:discover
```

What not to build yet:
Do not scrape, use APIs, automate LinkedIn, automate outreach, create lead databases from the internet, add browser automation, use credentials, invent actual companies, or create dashboards.

Completion notes:

- Added `npm run lead:discover`.
- The command generates `output/discovery/lead-discovery-report.md`.
- The discovery report includes prioritized ICPs, high-probability target categories, recommended places to manually look, 25+ copy/paste search queries, a manual lead research workflow, a 30-minute daily plan, weekly lead discovery goals, suggested next commands, and safety rules.
- No actual companies are generated and no scraping, APIs, browser automation, credentials, outreach, CRM integration, or external access were added.

Sprint 21 should create a Lead Discovery Queue + Candidate Review Workflow so manually discovered categories and search ideas can become reviewed candidate entries before they are added as leads.

## Sprint 21: Lead Discovery Queue + Candidate Review Workflow

Goal:
Create a local workflow for manually recording candidate lead ideas, reviewing fit, and deciding whether to add them as real leads.

Why it matters:
Daniel needs a safe middle step between search ideas and `data/leads.json` so low-quality or unreviewed candidates do not pollute the real lead pipeline.

Expected commands if relevant:

```sh
npm run discovery:queue
```

What not to build yet:
Do not scrape, browse automatically, use APIs, enrich contact data, auto-send messages, connect CRM tools, or create dashboards.
