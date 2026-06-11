# Lead Operator

Local lead acquisition operator for QA Automation services.

## Commands

```bash
npm run lead:add
npm run lead:find
npm run lead:score
npm run lead:proposal
npm run lead:proposal -- --id sample-lead
npm run lead:update -- --id sample-lead --status contacted --note "Sent LinkedIn DM"
npm run lead:audit -- --id sample-lead
npm run lead:enrich -- --id sample-lead --contact-name "Sample Founder" --role "Founder" --email "sample@example.com"
npm run lead:sent -- --id sample-lead --channel linkedin --note "Sent LinkedIn DM"
npm run lead:followups:due
npm run lead:pipeline
npm run lead:review -- --id sample-lead
npm run lead:convert -- --id sample-lead --offer monthly_qa_maintenance --amount 1000
npm run lead:close -- --id sample-lead-close --result lost --reason other
npm run revenue:summary
npm run actions:cockpit
npm run lead:optimize -- --id sample-lead --type linkedin_dm
npm run message:optimize -- --file sales-marketing-engine/operator/approval-queue/lead-sample-lead-proposal.md --type follow_up
npm run message:queue
npm run message:review -- --file lead-sample-lead-optimized-linkedin_dm.md --status approved --note "Reviewed"
npm run message:sent -- --file lead-sample-lead-optimized-linkedin_dm.md --channel linkedin --note "Sent manually"
npm run sources:report
npm run business:weekly
npm run lead:daily
npm run lead:auto
```

## Status Updates

`lead:update` validates the lead ID and status, appends the optional note, updates `updatedAt`, sets `lastContactedAt` when status is `contacted`, and schedules follow-up dates for outreach statuses.

Supported statuses:

- new
- scored
- approved
- contacted
- replied
- audit_offered
- audit_completed
- proposal_sent
- won
- lost
- ignored

## Lead Audits

`lead:audit` loads a lead by ID, audits its public website with the QA Audit Runner, saves reports under `reports/leads/<leadId>`, updates the lead to `audit_completed`, and writes an audit-based proposal draft to the approval queue.

No message is sent automatically.

## Manual Enrichment

`lead:enrich` only uses values Daniel provides manually. It validates email and URL formats, updates contact/company fields, appends the optional note, and updates `updatedAt`.

## Outreach Tracking

`lead:sent` records manually sent outreach, updates the lead to `proposal_sent`, sets `lastContactedAt`, schedules the next follow-up, and appends a record to `data/leads/outreach-history.json`.

## Follow-Ups And Pipeline

`lead:followups:due` generates review-only follow-up drafts for due leads. `lead:pipeline` writes `sales-marketing-engine/operator/generated/pipeline-summary.md`.

## Lead Review

`lead:review` generates a one-lead CRM review with qualification, contact details, outreach history, audit/report status, missing fields, red flags, and the deterministic next recommended action.

## Revenue Tracking

`lead:convert` marks a lead as won, writes conversion/client records, and updates projected revenue. `lead:close` marks lost or ignored leads with a close reason. `revenue:summary` writes the revenue report.

## Action Cockpit

`actions:cockpit` ranks the next human-reviewed lead actions, writes `sales-marketing-engine/operator/generated/action-cockpit.md`, and stores dashboard data in `data/leads/action-cockpit.json`.

## Message Optimizer

`lead:optimize` generates a review-only optimized message from lead context. `message:optimize` improves an existing local Markdown draft. AI copy is optional; fallback mode is deterministic and works without an API key.

Allowed message types: `linkedin_dm`, `cold_email`, `instagram_dm`, `upwork_proposal`, `follow_up`, `audit_based_proposal`, `objection_response`, `closing_message`.

Every optimized draft includes quality warnings and must be reviewed before sending.

## Message Review Queue

`message:queue` scans approval-queue Markdown drafts into local review metadata. `message:review` changes status to approved, needs_edit, rejected, or archived. `message:sent` marks a draft as manually sent and, when a lead ID is known, updates local outreach tracking and next follow-up dates. It never sends the message.

## Source Quality

`sources:report` scores configured public/manual sources and writes `data/leads/source-quality.json` plus `sales-marketing-engine/operator/generated/source-quality-report.md`. Use it to improve keywords, disable noisy sources, and find more sources similar to excellent performers.

## Weekly Dashboard

`business:weekly` generates the executive dashboard for the last 7 days by default. Use `npm run business:weekly -- --days 14` for a wider period.
