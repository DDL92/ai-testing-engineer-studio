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

Sprint 22 should create an Audit Pack Generator that turns a qualified lead, local research pack, and existing audit output into sellable QA audit pack documents.

## Sprint 22: Audit Pack Generator

Goal:
Transform an existing qualified lead into a sellable QA Audit Pack.

Why it matters:
The system needs a local bridge from lead qualification and audit evidence into client-reviewable QA audit assets.

Expected commands if relevant:

```sh
npm run audit:pack -- --id lead_id
```

What not to build yet:
Do not scrape, call APIs, send outreach, browse, use credentials, or invent audit findings.

Completion notes:

- Added `npm run audit:pack -- --id lead_id`.
- The command reads local lead data, detects local research packs, detects local audit reports, and writes five review-only audit pack documents under `output/audit-packs/{lead_id}/`.
- Generated documents cover executive summary, QA risk summary, Playwright opportunities, automation roadmap, and retainer recommendation.
- Paused, lost, not-fit, and low-score leads are blocked before generation.
- No scraping, APIs, browsing, outreach, credentials, or client system access were added.

Sprint 23 should create an Outreach Pack Generator so reviewed audit packs can become safe manual contact assets without automating messages.

## Sprint 23: Outreach Pack Generator

Goal:
Turn a qualified lead, research pack, audit pack, and audit report availability into safe manual outreach drafts.

Why it matters:
Daniel needs approved outreach assets after an audit pack exists, but the system must not send messages, automate LinkedIn, or invent claims.

Expected commands if relevant:

```sh
npm run outreach:pack -- --id lead_id
```

What not to build yet:
Do not install packages, use APIs, scrape, browse, automate LinkedIn, send emails/messages, create CRM integrations, invent contacts, or invent audit findings.

Completion notes:

- Added `npm run outreach:pack -- --id lead_id`.
- The command reads local lead data, detects local research packs, detects local audit packs, detects local audit reports, and writes outreach assets under `output/outreach-packs/{lead_id}/`.
- Generated files include contact strategy, LinkedIn message, email draft, two follow-ups, call invite, and safety checklist.
- Outreach copy uses deterministic offer and score logic, keeps tone short and no-pressure, and uses role types instead of invented people.
- The generator blocks paused, lost, not-fit, and low-score leads.
- No packages, APIs, scraping, browsing, email sending, LinkedIn automation, CRM integrations, credentials, invented contacts, or invented findings were added.

Sprint 24 should create Contact Review + Follow-Up Tracker so manually found contacts and approved send/follow-up decisions can be tracked locally without automating outreach.

## Sprint 24: Contact Review + Follow-Up Tracker

Goal:
Create a local review tracker for manually found contacts, approved outreach status, and follow-up dates.

Why it matters:
Once outreach packs exist, Daniel needs a safe way to remember which contact was reviewed, which message was approved, what was sent manually, and when to follow up.

Expected commands if relevant:

```sh
npm run contact:review -- --id lead_id
npm run followup:track -- --id lead_id
```

What not to build yet:
Do not send messages, sync calendars, scrape contacts, enrich private data, automate LinkedIn/email, connect a CRM, or use external APIs.

Completion notes:

- Added `npm run contact:review -- --id lead_id`.
- Added `npm run contact:update -- --id lead_id` for safe local updates to contact status, message status, channel, manually verified contact fields, follow-up date, and notes.
- Added `data/contact-reviews.json` as the local contact review store.
- Contact review reports write to `output/contact-reviews/{lead_id}/contact-review.md`.
- Reports include lead summary, contact research status, target roles, current contact record, outreach asset availability, manual approval checklist, follow-up plan, recommended next action, and safety rules.
- The update command preserves omitted fields and updates local JSON only.
- Outreach queue integration with contact review status remains future work to avoid refactoring the existing queue path in this sprint.
- No packages, APIs, scraping, browsing, credentials, automated LinkedIn/email, CRM integrations, invented contacts, or message sending were added.

Sprint 25 should create the First Client Workflow so a won audit or starter engagement can move into local onboarding, delivery checklist, report generation, and retainer follow-up without using real client credentials by default.

## Sprint 25: First Client Workflow

Goal:
Create a local workflow for onboarding the first paying QA audit or Playwright starter client from accepted scope through delivery and retainer follow-up.

Why it matters:
Once outreach and follow-up tracking produce a real opportunity, Daniel needs a repeatable delivery path that stays evidence-first and avoids leaking credentials or client data.

Expected commands if relevant:

```sh
npm run client:prep -- --id lead_id
npm run client:onboard -- --id lead_id
```

What not to build yet:
Do not connect production client systems, store real credentials, upload sensitive screenshots, automate client communication, connect payment tools, or create a SaaS dashboard.

Completion notes:

- Added `npm run client:prep -- --id lead_id` for discovery call prep and audit sale planning.
- Added `npm run client:onboard -- --id lead_id` for onboarding checklist, delivery plan, and retainer conversion planning.
- Client workflow assets write to `output/client-workflows/{lead_id}/`.
- Eligibility blocks paused, lost, not-fit, and score-below-6 leads.
- Discovery prep includes practical QA risk, qualification, audit opportunity, retainer opportunity, red flags, call goals, and next-step options.
- Onboarding and delivery plans avoid storing credentials and keep all client communication, invoicing, payment, and CRM work manual and outside the command.
- No packages, APIs, scraping, browsing, outreach, invoices, payment integrations, credentials, CRM integrations, or call automation were added.

Sprint 26 should create Pipeline Management + Opportunity Tracker so lead, contact, proposal, client workflow, and follow-up status can be summarized into one local opportunity view.

## Sprint 26: Pipeline Management + Opportunity Tracker

Goal:
Create a local opportunity tracker that summarizes qualified leads, contact reviews, outreach status, proposal readiness, client workflow readiness, and follow-up timing.

Why it matters:
Daniel needs one local view of which opportunities are ready for outreach, discovery, audit sale, onboarding, delivery, retainer conversion, or follow-up.

Expected commands if relevant:

```sh
npm run pipeline:opportunities
```

What not to build yet:
Do not create a hosted CRM, sync external contacts, scrape, call APIs, automate outreach, create invoices, connect payment tools, or use private client credentials.

Completion notes:

- Added `npm run pipeline:opportunities`.
- The command reads `data/leads.json`, `data/contact-reviews.json`, and local output folders for research packs, audit packs, outreach packs, SOWs, contact reviews, and client workflows.
- Generated reports write to `output/pipeline/opportunity-tracker.md`, `output/pipeline/top-opportunities.md`, and `output/pipeline/follow-up-needed.md`.
- Pipeline stages are inferred deterministically from local lead status, contact review status, follow-up dates, and artifact presence.
- Opportunity scores use local lead score, offer fit, tier, and local artifact readiness only.
- No APIs, scraping, browsing, CRM integrations, outreach automation, email sending, LinkedIn automation, payment systems, or external databases were added.

Sprint 27 should create Client Dashboard + Revenue Visibility so local pipeline, client workflow, revenue, and delivery status can be viewed together without creating a hosted SaaS or external integrations.

## Sprint 27: Client Dashboard + Revenue Visibility

Goal:
Create a local dashboard/report view that combines opportunity pipeline, client workflow readiness, revenue summary, active clients, and next commercial actions.

Why it matters:
Daniel needs a single revenue visibility layer after the pipeline tracker exists, so daily decisions can connect lead work, client prep, active delivery, and retainer growth.

Expected commands if relevant:

```sh
npm run dashboard
npm run revenue:visibility
```

What not to build yet:
Do not create hosted analytics, external databases, CRM integrations, payment integrations, invoice systems, scraping, outreach automation, or credentialed client connections.

Completion notes:

- Added `npm run dashboard` to generate `output/dashboard/dashboard.md` and `output/dashboard/dashboard.html`.
- Added `npm run revenue:visibility` to generate `output/dashboard/revenue-visibility.md`.
- Dashboard summarizes executive status, revenue snapshot, lead tiers, pipeline stages, top opportunities, follow-ups, immediate actions, and system health.
- Static HTML dashboard uses plain HTML/CSS only with no JavaScript libraries, frameworks, CSS frameworks, APIs, or external assets.
- Revenue visibility shows estimated MRR, active clients, Tier A/B opportunity estimates, and conservative/expected/optimistic retainer scenarios.
- Existing local dashboard viewer remains available through `npm run dashboard:dev`.
- No APIs, scraping, browsing, CRM integrations, outreach automation, email sending, LinkedIn automation, payment systems, invoices, external databases, or credentialed client connections were added.

Sprint 28 should create Client Operations Center so active client delivery, reports, risks, next actions, and retainer renewal work can be managed locally from one operations view.

## Sprint 28: Client Operations Center

Goal:
Create a local client operations center for active clients, delivery status, report readiness, open risks, renewal opportunities, and next manual actions.

Why it matters:
Once the business dashboard exists, Daniel needs a focused delivery view for protecting active revenue and preparing client reports or renewal conversations.

Expected commands if relevant:

```sh
npm run client:ops
npm run client:next-actions
```

What not to build yet:
Do not connect client systems, store credentials, upload sensitive screenshots, send client messages, create invoices, connect payment tools, use CRMs, or build a hosted SaaS dashboard.

Completion notes:

- Added `npm run client:ops` to generate `output/client-ops/client-operations-center.md` and `output/client-ops/client-readiness.md`.
- Added `npm run client:next-actions` to generate `output/client-ops/next-actions.md`.
- Client ops reads local leads, clients, contact reviews, pipeline reports, top-opportunity reports, and generated artifact folders.
- Reports include operating priorities, pipeline health, opportunities closest to revenue, follow-ups, client prep, delivery prep, reporting needs, readiness groups, risks, recommended commands, and manual approval rules.
- Recommendations use deterministic pipeline stage and opportunity score data only.
- No APIs, scraping, browsing, CRM integrations, outreach automation, email sending, LinkedIn automation, payment systems, invoice generation, external databases, credentials, or client-system access were added.

Sprint 29 should create Client Delivery Engine so approved client work can move from onboarding into evidence collection, delivery artifacts, report readiness, and retainer renewal support while remaining local-first.

## Sprint 29: Client Delivery Engine

Goal:
Create a local delivery engine for approved client engagements that organizes scope, evidence, delivery artifacts, report readiness, open risks, and renewal prompts.

Why it matters:
After the operations center identifies client work, Daniel needs a delivery path that protects active revenue and turns approved work into client-ready evidence without leaking credentials or sensitive data.

Expected commands if relevant:

```sh
npm run client:delivery -- --id client_id
npm run client:evidence -- --id client_id
```

What not to build yet:
Do not connect production systems, store credentials, upload private screenshots, send client messages, create invoices, connect payment tools, use CRMs, or automate client delivery without approval.

Completion notes:

- Added `npm run client:delivery -- --id client_id`.
- Added `npm run client:evidence -- --id client_id`.
- Delivery artifacts write to `output/client-delivery/{client_id}/`.
- Generated delivery files include delivery plan, evidence log, QA checklist, weekly delivery summary, and client update draft.
- Evidence logs do not invent evidence; missing evidence sections say `No evidence currently recorded.`
- Delivery plans use local client data and detect local client workflow/report artifacts when present.
- No APIs, browser automation, external services, credentials, production client systems, email sending, invoice generation, payment integrations, CRM integrations, or automated client communication were added.

Sprint 30 should create Client Delivery Report Polish so local evidence logs, QA checklists, weekly summaries, and client update drafts can become cleaner client-ready reports after Daniel approval.

## Sprint 30: Client Delivery Report Polish

Goal:
Improve client-facing report quality for approved delivery artifacts while preserving evidence-first claims and local-only safety boundaries.

Why it matters:
After delivery artifacts exist, Daniel needs a polished handoff layer that turns reviewed evidence and delivery notes into professional client updates without overclaiming results.

Expected commands if relevant:

```sh
npm run client:delivery-report -- --id client_id
npm run client:update-draft -- --id client_id
```

What not to build yet:
Do not send reports automatically, upload files externally, connect client systems, store credentials, create invoices, connect payment tools, or claim results without reviewed evidence.

Completion notes:

- Added `npm run client:delivery-report -- --id client_id`.
- Added `npm run client:update-draft -- --id client_id`.
- Client reporting artifacts write to `output/client-reporting/{client_id}/`.
- Generated reporting files include executive summary, weekly report, monthly report, value delivered summary, renewal signal, and client update draft.
- Reports consume local client data plus local delivery artifacts and evidence logs only.
- Missing evidence remains explicit as `No evidence currently recorded.`
- Renewal signal is HIGH, MEDIUM, or LOW based only on local client status, fee, completed work, next steps, and evidence count.
- Client update drafts include `DRAFT ONLY — REQUIRES DANIEL REVIEW BEFORE SENDING` and are not sent.
- No APIs, scraping, browser automation, email, CRM, payment systems, invoices, credentials, external services, or client-system access were added.

Sprint 31 should create Retainer Renewal + Expansion Tracker so active clients can be reviewed for renewal risk, approved expansion opportunities, next-month scope, and manual renewal conversation prep without sending messages or creating payment workflows.

## Sprint 31: Retainer Renewal + Expansion Tracker

Goal:
Create a local tracker for retainer renewal readiness, expansion opportunities, risk signals, and next-month scope recommendations.

Why it matters:
After client reports are polished, Daniel needs a retention-focused workflow that turns evidence, risks, completed work, and recommendations into manual renewal and expansion prep.

Expected commands if relevant:

```sh
npm run retainer:renewal -- --id client_id
npm run client:expansion -- --id client_id
```

What not to build yet:
Do not send renewal messages, create invoices, connect payment systems, sync CRMs, use external APIs, scrape, browse, automate calls, use credentials, or claim business impact without reviewed evidence.

Completion notes:

- Added `npm run renewal:tracker`.
- Added `npm run renewal:review -- --id client_id`.
- Renewal reports write to `output/renewals/`.
- Generated reports include renewal pipeline, client health, renewal risk report, expansion opportunities, and renewal actions.
- Client health is classified as GREEN, YELLOW, or RED using local active status, completed deliverables, evidence count, reporting activity, next actions, and follow-up state.
- Missing evidence, reports, or activity are called out directly, with `Insufficient data available.` used where the local data is not enough.
- Expansion paths are suggested only when local service type, completed work, risks, reports, or next actions justify review.
- No revenue, client satisfaction, defects, business outcomes, retention probability, outreach, scheduling, email, CRM, invoices, payments, APIs, scraping, browser automation, credentials, client systems, or external databases were added.

Sprint 32 should create Client Success Operating Rhythm so weekly and monthly retention work can be planned from renewal health, delivery reports, evidence gaps, and next approved actions without automating client communication.

## Sprint 32: Client Success Operating Rhythm

Goal:
Create a local weekly/monthly client success planner that turns renewal health, reporting gaps, evidence gaps, and expansion opportunities into a repeatable retention routine.

Why it matters:
After renewal risk is visible, Daniel needs a lightweight operating rhythm that keeps active clients warm, evidence-backed, and ready for manual renewal conversations.

Expected commands if relevant:

```sh
npm run success:weekly
npm run success:monthly
```

What not to build yet:
Do not send client updates, schedule meetings, connect calendars, use CRMs, create invoices, connect payment systems, scrape, browse, call APIs, use credentials, access client systems, or claim outcomes without evidence.

Completion notes:

- Added `npm run operator:daily`.
- Added `npm run success:weekly`.
- Added `npm run success:monthly`.
- Operator reports write to `output/operator/`.
- Daily command center summarizes revenue snapshot, top opportunities, follow-ups, client health, renewal watchlist, expansion watchlist, top actions, and suggested commands.
- Weekly and monthly success reviews summarize local pipeline, lead, client, renewal, expansion, risk, and priority signals.
- Daily priority scores use deterministic local weighting from opportunity score, pipeline stage, follow-up status, renewal health, and expansion potential.
- Reports gracefully degrade when optional local report files are missing.
- No APIs, scraping, browser automation, CRM, outreach automation, emails, calendars, payments, credentials, external databases, or client-system access were added.

Sprint 33 should create Lead Discovery Automation Assistant so Daniel can generate semi-automated public-search guidance, manual search checklists, and reviewed lead intake candidates without scraping, APIs, or browser automation.

## Sprint 33: Lead Discovery Automation Assistant

Goal:
Create a local assistant that guides manual public lead discovery and prepares reviewed lead intake candidates from Daniel-approved search criteria.

Why it matters:
After the daily operator focuses execution, Daniel needs a safer way to keep the pipeline supplied without aggressive scraping or paid lead databases.

Expected commands if relevant:

```sh
npm run lead:discover:assistant
npm run lead:candidate-queue
```

What not to build yet:
Do not scrape, browse automatically, call APIs, enrich private contact data, send outreach, automate LinkedIn/email, connect CRMs, use paid lead databases, use credentials, or add external databases.

Completion notes:

- Added `npm run lead:discover:assistant`.
- Added `npm run lead:candidate-queue`.
- Added `src/leadDiscoveryAutomation` with local-only rules, types, assistant generation, and candidate queue generation.
- Generated `output/lead-discovery-automation/discovery-assistant.md`.
- Generated `output/lead-discovery-automation/search-playbook.md` with 50 manual search queries across fitness SaaS, wellness SaaS, booking platforms, hospitality SaaS, property management SaaS, scheduling SaaS, SaaS agencies, HealthTech SaaS, and e-commerce platforms.
- Generated `output/lead-discovery-automation/candidate-queue.md` as a blank manual-entry template with current total leads, Tier A/B/C counts, current top ICPs, approval fields, and the approved `lead:add` command template.
- Generated `output/lead-discovery-automation/lead-approval-checklist.md` with required manual approval checks before adding any lead.
- The assistant reads `data/leads.json`, `output/discovery/first-50-progress.md`, `output/operator/daily-command-center.md`, and `output/dashboard/dashboard.md` when available, and degrades gracefully when optional files are missing.
- No companies are invented. No scraping, APIs, browser automation, CRM, outreach automation, email, LinkedIn automation, payments, credentials, external services, private data, or automatic lead additions were added.

## Sprint 34: Lead Queue Builder + Approved Candidate Intake

Goal:
Convert approved candidate queue entries into structured `lead:add` command batches while still requiring Daniel approval.

Why it matters:
The discovery assistant creates safe manual search guidance, but Daniel still needs a controlled way to turn approved candidates into repeatable local intake commands without bypassing review.

Expected commands if relevant:

```sh
npm run lead:intake:approved
npm run lead:intake:batch
```

What not to build yet:
Do not parse the open internet, scrape candidate data, call enrichment APIs, send outreach, automate LinkedIn/email, connect CRMs, use paid lead databases, store credentials, or automatically write approved candidates into `data/leads.json` without Daniel confirmation.

Completion notes:

- Added `npm run lead:intake:approved`.
- Added `npm run lead:intake:batch`.
- Added `src/leadIntake` with types, local Markdown queue parsing, approval/rejection rules, duplicate checks against `data/leads.json`, command batch rendering, and intake summaries.
- Generated `output/lead-intake/approved-candidates.md`.
- Generated `output/lead-intake/lead-add-command-batch.md`.
- Generated `output/lead-intake/rejected-candidates.md`.
- Generated `output/lead-intake/intake-summary.md`.
- Approved candidates are included only when Daniel marks the queue row approved and local checks do not reject it as a duplicate, missing required data, low fit, outside ICP, or paused.
- Command batches are copy/paste-ready only and use the existing `npm run lead:add -- --company ... --website ... --industry ... --source ... --notes ...` interface.
- No lead data is modified. No commands are executed. No fake companies, scraping, browsing, APIs, CRM integrations, outreach automation, contact enrichment, payments, credentials, external systems, or automatic lead creation were added.

## Sprint 35: Pipeline Auto-Prioritization Engine

Goal:
Prioritize local pipeline opportunities and generate next manual actions from approved leads, existing artifacts, opportunity score, follow-up state, and client readiness.

Why it matters:
Once approved candidates can become local leads, Daniel needs the system to rank which pipeline actions should happen next without automating outreach or touching external systems.

Suggested commands:

```sh
npm run pipeline:prioritize
npm run pipeline:next-actions
```

What not to build yet:
Do not send outreach, automate LinkedIn/email, browse websites, scrape, call APIs, connect CRMs, create invoices, use credentials, access client systems, or auto-change lead status without Daniel approval.

Completion notes:

- Added `npm run pipeline:prioritize`.
- Added `npm run pipeline:next-actions`.
- Added `src/pipelinePrioritization` with types, deterministic priority scoring, artifact detection, revenue path mapping, stalled opportunity detection, top action generation, and local context summaries.
- Generated `output/pipeline-prioritization/prioritized-pipeline.md`.
- Generated `output/pipeline-prioritization/top-10-revenue-opportunities.md`.
- Generated `output/pipeline-prioritization/top-5-actions.md`.
- Generated `output/pipeline-prioritization/stalled-opportunities.md`.
- Priority score uses lead score, tier, recommended offer, existing research pack, lead pack, audit pack, outreach pack, contact review, SOW, client workflow, follow-up status, and matched client signals when available.
- Revenue paths use pricing ranges only and do not treat opportunity value as booked revenue.
- Reports read local Studio data and optional generated reports when available, and degrade gracefully when optional files are missing.
- No APIs, scraping, browsing, CRM integrations, outreach automation, email, LinkedIn automation, payment systems, credentials, external databases, or automatic status changes were added.

## Sprint 36: Real Outreach Operating Pack

Goal:
Turn prioritized Top 5 opportunities into a manual outreach execution pack with contact research instructions, approved messages, follow-up schedule, and first-audit offer path.

Why it matters:
After the pipeline is prioritized, Daniel needs a controlled manual execution pack that turns the highest-priority opportunities into reviewed outreach preparation without automating messages or contact collection.

Suggested commands:

```sh
npm run outreach:operating-pack
npm run outreach:first-audit-path
```

What not to build yet:
Do not send outreach, automate LinkedIn/email, scrape contacts, browse websites automatically, call APIs, connect CRMs, create calendar events, create invoices, use payment systems, use credentials, or access external systems.

Completion notes:

- Added `npm run outreach:operating-pack`.
- Added `npm run outreach:first-audit-path`.
- Added `src/outreachOperating` with Commercial Mode filtering, deterministic outreach prioritization, asset detection, contact research checklist rendering, first-audit offer path rendering, and excluded demo/sample lead reporting.
- Generated `output/outreach-operating/real-outreach-operating-pack.md`.
- Generated `output/outreach-operating/top-5-real-outreach.md`.
- Generated `output/outreach-operating/contact-research-checklist.md`.
- Generated `output/outreach-operating/first-audit-offer-path.md`.
- Generated `output/outreach-operating/excluded-demo-leads.md`.
- Commercial Mode excludes sample IDs, `.example` websites, sample sources, Demo/Sandbox/Test company names, not-fit offers, paused leads, and lost leads.
- Top 5 real outreach leads are selected from eligible commercial leads only and show available assets, missing assets, next action, and suggested command.
- No APIs, scraping, browsing, CRM integrations, outreach automation, email sending, LinkedIn automation, payment systems, credentials, external databases, invented contacts, invented URLs, invented company facts, or automated sending were added.

## Sprint 37: Commercial Mode Dashboard + Demo Data Isolation

Goal:
Ensure all revenue-facing dashboards can toggle or default to commercial mode excluding demo/sample data.

Why it matters:
After Commercial Mode is available for outreach, revenue-facing dashboards and operator reports should avoid mixing demo/sample records with real commercial priorities unless Daniel explicitly opts into demo mode.

Suggested commands:

```sh
npm run dashboard:commercial
npm run operator:commercial
```

What not to build yet:
Do not delete demo data, mutate existing lead records, connect external systems, browse, scrape, call APIs, automate outreach, send messages, use credentials, or hide records without a clear local report explaining what was filtered.

Completion notes:

- Added shared Commercial Mode helpers in `src/commercialMode`.
- Added `isCommercialLead()` and `isDemoLead()` using deterministic local lead rules.
- Added `npm run commercial:summary`.
- Generated `output/commercial-mode/demo-isolation-report.md`.
- Generated `output/commercial-mode/commercial-mode-summary.md`.
- Updated dashboard generation to use Commercial Mode by default and generate `output/dashboard/commercial-dashboard.md`.
- Updated revenue visibility to use Commercial Mode by default and generate `output/dashboard/commercial-revenue-visibility.md`.
- Updated daily operator to show `Commercial Mode: ON`, commercial lead counts, excluded demo counts, and commercial Top 5 context.
- Updated pipeline prioritization to use commercial leads by default and generate `output/pipeline-prioritization/commercial-prioritized-pipeline.md`.
- Updated client operations to use commercial-filtered opportunities and display Commercial Mode status.
- Added Commercial Mode language to renewal outputs while leaving client records intact.
- Demo/sample data remains available for testing and is not deleted or mutated.
- No APIs, scraping, browsing, CRM integrations, outreach automation, payments, credentials, external databases, or automatic external actions were added.

## Sprint 38: Mac Daily Automation Runner

Goal:
Allow the Studio to automatically generate dashboard, operator report, pipeline report, and renewal report from a single local command.

Why it matters:
After Commercial Mode is enforced across revenue-facing reports, Daniel needs one local daily command that refreshes the core commercial operating system without manually running each report.

Suggested commands:

```sh
npm run mac:daily
npm run mac:summary
```

What not to build yet:
Do not run external automations, send messages, open browsers, scrape, call APIs, connect CRMs, create invoices, use payments, use credentials, or schedule operating-system jobs without explicit approval.

Completion notes:

- Added `npm run mac:daily`.
- Added `npm run mac:summary`.
- Added `src/macAutomation` with typed command execution results, deterministic local summary rules, system health checks, and summary-only generation.
- `npm run mac:daily` runs the dashboard, daily operator, pipeline prioritization, client operations, renewal tracker, and Commercial Mode summary commands in sequence.
- Generated `output/mac-daily/mac-daily-summary.md`.
- Generated `output/mac-daily/executed-reports.md`.
- Generated `output/mac-daily/system-health.md`.
- Generated `output/mac-daily/action-cockpit.md`.
- `npm run mac:summary` refreshes the summary, system health, and action cockpit from existing local data and report outputs without rerunning the daily command sequence.
- No APIs, scraping, browsing, CRM integrations, outreach automation, email sending, LinkedIn automation, payments, credentials, external databases, or operating-system scheduled jobs were added.

## Sprint 39: Revenue Command Center

Goal:
Create a single revenue-focused local view that combines MRR, projected MRR, audit opportunities, retainer opportunities, renewal opportunities, and expansion opportunities.

Why it matters:
After the daily Mac runner reduces operating friction, Daniel needs one revenue-specific command center that separates current booked value from projected opportunity value and next manual revenue actions.

Suggested commands:

```sh
npm run revenue:command-center
npm run revenue:forecast
```

What not to build yet:
Do not connect banks, payment processors, invoices, CRMs, external databases, APIs, scraping, browsing, outreach automation, email sending, LinkedIn automation, credentials, or revenue claims not backed by local data.

Completion notes:

- Added `npm run revenue:command-center`.
- Added `npm run revenue:forecast`.
- Added `src/revenueCommandCenter` with typed local inputs, deterministic revenue scoring, forecast rendering, audit opportunity rendering, retainer opportunity rendering, renewal/expansion visibility, property-progress scenarios, and shared safety reminders.
- Generated `output/revenue-command-center/revenue-command-center.md`.
- Generated `output/revenue-command-center/mrr-forecast.md`.
- Generated `output/revenue-command-center/audit-opportunities.md`.
- Generated `output/revenue-command-center/retainer-opportunities.md`.
- Generated `output/revenue-command-center/property-progress.md`.
- Current booked MRR uses active local retainer clients only.
- Pipeline potential and speculative forecasts are clearly separated from booked revenue.
- Commercial Mode exclusions suppress demo/sample, paused, lost, and not-fit leads from revenue-facing opportunity scoring.
- No APIs, scraping, browsing, CRM integrations, outreach automation, email sending, LinkedIn automation, payment systems, credentials, external databases, invented clients, or invented booked revenue were added.

## Sprint 40: Real Client Readiness Pack

Goal:
Prepare the highest-priority commercial leads for actual manual outreach, first audit sales, discovery calls, and SOW generation without sending anything.

Why it matters:
After revenue visibility exists, Daniel needs a practical readiness layer that turns commercial priorities into safe, reviewed next actions for real prospects.

Suggested commands:

```sh
npm run client-readiness:pack
npm run first-audit:sales-pack
```

What not to build yet:
Do not send messages, automate outreach, browse, scrape, call APIs, connect CRMs, use email or LinkedIn automation, use payment systems, use credentials, invent contacts, invent names, or invent audit findings.

Completion notes:

- Added `npm run client-readiness:pack`.
- Added `npm run first-audit:sales-pack`.
- Added `src/clientReadiness` with typed local inputs, deterministic readiness scoring, asset detection, Top 5 contact planning, manual outreach checklist rendering, first audit sales pack rendering, and SOW readiness rendering.
- Generated `output/real-client-readiness/real-client-readiness-pack.md`.
- Generated `output/real-client-readiness/first-audit-sales-pack.md`.
- Generated `output/real-client-readiness/top-5-contact-plan.md`.
- Generated `output/real-client-readiness/manual-outreach-checklist.md`.
- Generated `output/real-client-readiness/sow-readiness.md`.
- Readiness score uses commercial eligibility, not-paused/not-lost status, lead score, revenue fit, retainer fit, outreach pack, audit pack, contact review, client workflow, SOW, and Top 5 outreach signals.
- Contact names and audit findings are never invented.
- No APIs, scraping, browsing, CRM integrations, outreach automation, email sending, LinkedIn automation, payments, credentials, external databases, or automatic external actions were added.

## Sprint 41: Proposal + SOW Command Center

Goal:
Generate proposal-ready and SOW-ready assets for approved opportunities.

Suggested commands:

```sh
npm run proposal:center
npm run sow:center
```

What not to build yet:
Do not send proposals, create binding commitments, use e-signature tools, connect payment systems, use client credentials, or invent scope, pricing, findings, contacts, or approvals.
