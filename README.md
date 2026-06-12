# AI Testing Engineer Studio

AI Testing Engineer Studio is a lean MVP for selling QA Automation and AI Testing services fast. It combines a reusable Playwright + TypeScript starter framework, AI testing templates, client delivery documents, Upwork assets, Codex prompts, and launch content.

## Why This Repo Exists

This repo is both a public portfolio asset and a delivery kit for QA Automation and AI Testing services. It shows how I structure client-ready Playwright work, package AI testing audits, and deliver practical QA artifacts without overbuilding.

## MVP Scope

This repo supports three services:

- Playwright QA Automation Audit: $300-$500
- Playwright Starter Framework: $800-$1,500
- AI Testing Audit: $500-$1,000

The goal is not to build a SaaS. The goal is to close the first paid audit, deliver a professional result, and convert the client into a framework project or monthly retainer.

## Portfolio Use

- Recruiters should review the Playwright framework structure, TypeScript setup, and README clarity.
- Clients should review the service offers, client delivery templates, and sample automation workflow.
- SaaS teams should review the UI smoke, API health, and AI response quality test examples.

## Install

```bash
npm install
npx playwright install
cp .env.example .env
```

Update `.env` with the client app URLs and test credentials.

## .env Usage

`.env` is local only and must not be committed. Use `.env.example` to document safe variable names for public sharing, onboarding, and client setup.

## Run Tests

```bash
npm test
npm run test:chromium
npm run test:ui
npm run test:api
npm run test:ai
npm run test:headed
npm run report
```

## QA Audit Runner

```bash
npm run audit -- --url https://example.com
npm run audit:sample
npm run audit:site -- --url https://example.com
npm run lead:discover:assistant
npm run lead:candidate-queue
npm run lead:intake:approved
npm run lead:intake:batch
npm run audit:pack -- --id pushpress
npm run outreach:pack -- --id pushpress
npm run outreach:operating-pack
npm run outreach:first-audit-path
npm run contact:review -- --id pushpress
npm run contact:update -- --id pushpress --status prepared --channel linkedin
npm run client:prep -- --id pushpress
npm run client:onboard -- --id pushpress
npm run pipeline:opportunities
npm run pipeline:prioritize
npm run pipeline:next-actions
npm run commercial:summary
npm run dashboard
npm run revenue:visibility
npm run revenue:command-center
npm run revenue:forecast
npm run client-readiness:pack
npm run first-audit:sales-pack
npm run proposal:center
npm run sow:center
npm run outreach:execute-pack
npm run outreach:follow-up-plan
npm run first-audit:workflow
npm run first-audit:kickoff
npm run mobile:center
npm run mobile:summary
npm run revenue:daily
npm run revenue:next-actions
npm run cockpit:daily
npm run cockpit:approve
npm run os:dashboard
npm run os:today
npm run os:audit
npm run os:health
npm run os:release-check
npm run os:v1-report
npm run mac:daily
npm run mac:summary
npm run client:ops
npm run client:next-actions
npm run client:delivery -- --id demo-retainer-client
npm run client:evidence -- --id demo-retainer-client
npm run client:delivery-report -- --id demo-retainer-client
npm run client:update-draft -- --id demo-retainer-client
npm run renewal:tracker
npm run renewal:review -- --id demo-retainer-client
npm run operator:daily
npm run success:weekly
npm run success:monthly
```

Reports are written to `reports/latest` and remain local.
Local audit pack sales drafts are written to `output/audit-packs/{lead_id}` and require human approval before client use.
Manual outreach packs are written to `output/outreach-packs/{lead_id}`. They are review-only drafts and do not send messages, automate LinkedIn, call APIs, scrape, or update a CRM.
Real outreach operating packs are written to `output/outreach-operating` with Commercial Mode enabled by default. They exclude demo/sample leads, do not invent contacts or company facts, and do not send messages, scrape, browse, call APIs, automate LinkedIn/email, connect CRMs, use credentials, or access external systems.
Contact review records are stored in `data/contact-reviews.json` and rendered to `output/contact-reviews/{lead_id}`. They track manually reviewed contact and follow-up status only.
First client workflow assets are written to `output/client-workflows/{lead_id}` for discovery prep, audit sale planning, onboarding, delivery, and retainer conversion. They do not send messages, create invoices, request stored credentials, or connect payment/CRM tools.
Pipeline opportunity reports are written to `output/pipeline` and summarize local lead, artifact, contact review, follow-up, proposal, and client workflow readiness without external systems.
Pipeline prioritization reports are written to `output/pipeline-prioritization` for prioritized opportunities, top 10 revenue paths, top 5 manual actions, and stalled opportunities. They use deterministic local scoring only and do not scrape, browse, call APIs, automate outreach, connect CRMs, use credentials, or treat opportunity value as booked revenue.
Commercial Mode reports are written to `output/commercial-mode` for demo/sample isolation and commercial-only opportunity summaries. Revenue-facing reports use the shared Commercial Mode rules so demo/sample leads remain available for testing without distorting commercial reporting.
The daily dashboard writes `output/dashboard/dashboard.md`, `output/dashboard/dashboard.html`, and `output/dashboard/revenue-visibility.md` as static local reports.
The Revenue Command Center writes `output/revenue-command-center` reports for booked MRR, speculative MRR forecasts, audit opportunities, retainer opportunities, renewal/expansion visibility, property-progress scenarios, and top manual revenue actions. It uses local Studio data only and does not treat opportunities as booked revenue.
The Real Client Readiness Pack writes `output/real-client-readiness` reports for Top 5 commercial lead readiness, manual contact planning, outreach safety checks, first audit sales positioning, and SOW readiness. It does not invent contacts or findings and does not send outreach.
The Proposal Command Center writes `output/proposal-center` reports for proposal-ready leads, SOW readiness, proposal priority, pricing recommendations, and approval checks. It is local-only and does not send proposals, invent findings, or treat opportunities as booked revenue.
The Real Outreach Execution Pack writes `output/outreach-execution` reports for final message drafts, manual contact research, follow-up timing, first audit CTA, and approval checks. It does not send messages, invent contacts, invent findings, browse, scrape, automate outreach, or connect external systems.
The First Audit Sale Workflow writes `output/first-audit-workflow` reports for positive-reply handling, discovery call prep, audit scope confirmation, kickoff, delivery, retainer upgrade path, and approval checks. It does not process payments, generate invoices, invent findings, or guarantee outcomes.
The Mobile Command Center writes `output/mobile-command-center` reports for mobile-ready Today, top actions, top opportunities, revenue snapshot, client status, manual follow-up queue, approvals needed, and local report health. It is Markdown-only foundation work for future dashboard/PWA/mobile surfaces and does not add APIs, React, Next.js, UI frameworks, CRM integrations, outreach automation, sending, external databases, or external services.
The Daily Revenue Operator writes `output/daily-revenue-operator` reports for the daily revenue snapshot, next actions, priority list, risks, 30-minute focus, consistency audit, and approval checklist. Revenue Command Center is the source of truth for booked MRR; demo/sample/sandbox/test/example client records are excluded from booked revenue.
The Action Cockpit v1 writes `output/action-cockpit` reports for one daily operating view: Top 3 actions, Top 5 opportunities, Revenue Command Center snapshot, client watchlist, manual follow-up watchlist, approval queue, local report health, and the next recommended command. It is local Markdown only and never auto-approves, sends outreach, connects CRMs, calls APIs, or uses external services.
The Operator OS Dashboard writes `output/operator-os-dashboard` reports for the primary AI Studio OS homepage: executive summary, today view, opportunity center, revenue center, approval center, follow-up center, system status, and exact next command. It uses Revenue Command Center and Action Cockpit as sources of truth and remains local-only.
The Studio OS Stabilization reports write `output/os-stabilization` audits for command consistency, report availability, revenue consistency, workflow completeness, documentation coverage, system health, and v1.0 candidate readiness. They are audit-only and do not modify business data.
The AI Studio OS v1.0 Candidate reports write `output/v1-candidate` for release checks, the official v1 report, architecture summary, command inventory, workflow inventory, revenue readiness, first-client readiness, known warnings, and post-v1 roadmap. They are local-only, do not invent revenue, do not send outreach, do not connect external systems, and require human approval before any external action.
Client operations reports are written to `output/client-ops` for daily priorities, next actions, readiness groups, reporting needs, and manual approval rules.
Client delivery artifacts are written to `output/client-delivery/{client_id}` for delivery planning, evidence logs, QA checklists, weekly summaries, and client update drafts.
Polished client reporting artifacts are written to `output/client-reporting/{client_id}` for executive summaries, weekly reports, monthly reports, value delivered summaries, renewal signals, and draft client updates. They are evidence-first, local-only, and require Daniel review before sending.
Renewal and expansion reports are written to `output/renewals` for client health, renewal risk, expansion opportunities, renewal actions, and the renewal pipeline. They use local client data and generated artifacts only.
The daily operator and success rhythm reports are written to `output/operator` as one local command center plus weekly and monthly reviews. They summarize pipeline, follow-ups, client health, renewals, expansion watchlists, and suggested human-approved commands.
Mac Daily Automation reports are written to `output/mac-daily` for one-command local refreshes of dashboard, operator, pipeline prioritization, client operations, renewals, and Commercial Mode summaries. `npm run mac:summary` reads existing local outputs only and refreshes the consolidated daily summary, system health, and action cockpit without rerunning the full report sequence.
Lead discovery automation reports are written to `output/lead-discovery-automation` for manual search guidance, a 50-query search playbook, a blank candidate queue template, and an approval checklist. They do not scrape, browse, call APIs, invent companies, automate outreach, connect CRMs, use credentials, or add leads without Daniel approval.
Lead intake reports are written to `output/lead-intake` for approved candidates, rejected candidates, intake summaries, and copy/paste-ready `lead:add` command batches. They do not execute commands, modify `data/leads.json`, scrape, browse, call APIs, automate outreach, use CRMs, use credentials, or create leads without Daniel approval.

## Lead Operator

```bash
npm run lead:daily
npm run lead:auto
npm run lead:update -- --id sample-lead --status contacted --note "Sent LinkedIn DM"
npm run lead:audit -- --id sample-lead
npm run lead:enrich -- --id sample-lead --email "sample@example.com"
npm run lead:sent -- --id sample-lead --channel linkedin --note "Sent first DM"
npm run lead:followups:due
npm run lead:pipeline
npm run lead:review -- --id sample-lead
npm run lead:convert -- --id sample-lead --offer monthly_qa_maintenance --amount 1000 --note "Closed after audit call"
npm run lead:close -- --id sample-lead-close --result lost --reason other --note "Close test"
npm run revenue:summary
npm run actions:cockpit
npm run lead:optimize -- --id sample-lead --type linkedin_dm
npm run message:optimize -- --file sales-marketing-engine/operator/approval-queue/lead-sample-lead-proposal.md --type follow_up
npm run message:queue
npm run message:review -- --file lead-sample-lead-optimized-linkedin_dm.md --status approved --note "Reviewed"
npm run message:sent -- --file lead-sample-lead-optimized-linkedin_dm.md --channel linkedin --note "Sent manually"
npm run sources:report
npm run business:weekly
npm run dashboard
npm run dashboard:check
npm run validate:business
```

The local dashboard viewer can still be started with `npm run dashboard:dev` at `http://localhost:4173` and only reads local generated files. The Action Cockpit page ranks the next human-reviewed revenue actions from `data/leads/action-cockpit.json` and `sales-marketing-engine/operator/generated/action-cockpit.md`.

The lead operator stores local JSON data in `data/leads`, writes proposal drafts to `sales-marketing-engine/operator/approval-queue`, and writes daily, pipeline, revenue, weekly, and action cockpit reports to `sales-marketing-engine/operator/generated`. No outreach is sent automatically.

AI-assisted message optimization is optional and disabled by default. Without `AI_COPY_ENABLED=true` and a local `OPENAI_API_KEY`, `lead:optimize` and `message:optimize` use deterministic fallback copy and still write review-only drafts to the approval queue.

The Message Review Queue tracks pending, approved, needs-edit, rejected, sent, and archived local drafts in `data/leads/message-review-queue.json`. `message:sent` records a manual send in local outreach history when a lead ID is known; it does not send anything externally.

Source quality reporting scores public and manual lead sources in `data/leads/source-quality.json` and writes `sales-marketing-engine/operator/generated/source-quality-report.md`. Use it to keep high-fit QA Automation sources and disable noisy ones.

## Test Behavior Without Environment Variables

The sample tests are designed to skip until a real app or endpoint is configured. UI tests need `BASE_URL`, `TEST_USER_EMAIL`, and `TEST_USER_PASSWORD`. API tests need `API_BASE_URL`. AI tests need `AI_API_URL`. This keeps the public repo runnable without exposing client credentials or depending on external services.

## Sample Client Scenario

Example: SaaS login + dashboard + API health audit.

1. Configure `BASE_URL` for the SaaS app.
2. Add test credentials to local `.env`.
3. Adapt login and dashboard locators in the page objects.
4. Configure `API_BASE_URL` and `API_HEALTH_PATH`.
5. Run UI smoke and API health checks.
6. Deliver findings with the audit report and coverage matrix.

## Adapt To A Client

1. Set `BASE_URL`, `API_BASE_URL`, and optional `AI_API_URL` in `.env`.
2. Update page objects in `playwright-framework/pages`.
3. Replace generic login and dashboard assertions with client-specific stable locators.
4. Add API endpoints in `playwright-framework/tests/api`.
5. Add AI prompts and expected quality criteria in `playwright-framework/tests/ai`.
6. Deliver using the templates in `client-delivery-system`.

## Repo Areas

- `docs`: MVP plan, business model, service offers, automation strategy, launch checklist.
- `playwright-framework`: reusable Playwright framework with POM, fixtures, UI/API/AI examples.
- `ai-testing-kit`: prompt, injection, RAG, and response quality testing assets.
- `client-delivery-system`: intake, audit report, coverage matrix, delivery, retainer proposal.
- `codex-prompts`: prompts to accelerate delivery with Codex.
- `upwork-assets`: profile, project catalogs, proposal templates.
- `content-engine`: first posts, carousels, and 7-day content plan.

## Delivery Workflow

1. Qualify client with the intake form.
2. Run a short manual + automated audit.
3. Customize the framework for 1-3 critical flows.
4. Generate report and coverage matrix.
5. Send final delivery message.
6. Offer the starter framework or monthly retainer as the next step.
