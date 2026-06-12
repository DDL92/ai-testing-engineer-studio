# Command Reference

All commands are local-first. None of these commands should send outreach, connect APIs, scrape websites, or use credentials.

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
