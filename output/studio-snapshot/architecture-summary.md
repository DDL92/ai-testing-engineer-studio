# Architecture Summary

Generated: 2026-06-13T20:49:46.780Z

## Lead Research

Purpose: Find and summarize target companies for QA services.

Inputs:
- data/leads
- data/first-50-targets.json

Outputs:
- output/leads
- output/lead-packs

Commands:
- npm run lead:research
- npm run lead:pack

## Contact Research

Purpose: Track manually reviewed contacts and contact readiness.

Inputs:
- data/contacts/contacts.json
- data/contact-reviews.json

Outputs:
- output/contact-research

Commands:
- npm run contact:review

## Outreach Tracking

Purpose: Track manual outreach status without sending messages.

Inputs:
- data/outreach/outreach.json

Outputs:
- output/outreach-tracking

Commands:
- npm run outreach:status
- npm run followup:queue

## Opportunity Engine

Purpose: Rank commercial QA opportunities from local evidence.

Inputs:
- data/opportunities/opportunities.json

Outputs:
- output/opportunities

Commands:
- npm run opportunity:generate
- npm run opportunity:summary

## Audit Engine

Purpose: Generate audit packs and portfolio audit priorities.

Inputs:
- data/audit-packs/audit-packs.json

Outputs:
- output/audit-packs

Commands:
- npm run audit:generate
- npm run audit:portfolio

## Evidence Engine

Purpose: Collect and summarize local evidence artifacts.

Inputs:
- data/evidence/evidence.json

Outputs:
- output/evidence

Commands:
- npm run evidence:collect
- npm run evidence:portfolio

## Playwright Evidence

Purpose: Store public-page Playwright observations.

Inputs:
- data/evidence/playwright

Outputs:
- output/playwright-runner

Commands:
- npm run evidence:playwright-run
- npm run evidence:playwright-summary

## Lighthouse Evidence

Purpose: Store objective public homepage Lighthouse reports.

Inputs:
- data/evidence/lighthouse

Outputs:
- output/lighthouse

Commands:
- npm run evidence:lighthouse
- npm run evidence:lighthouse-summary

## Proposal Engine

Purpose: Generate review-only proposal and SOW packages.

Inputs:
- output/client-audit-reports
- output/unified-audits

Outputs:
- output/proposals

Commands:
- npm run sow:generate
- npm run sow:portfolio

## Executive Layer

Purpose: Translate QA evidence into executive business language.

Inputs:
- output/unified-audits
- output/client-audit-reports

Outputs:
- output/executive

Commands:
- npm run executive:summary
- npm run executive:portfolio

## Revenue Activation

Purpose: Rank first-client and first-retainer execution targets.

Inputs:
- output/opportunities
- output/proposals
- data/finance/finance.json

Outputs:
- output/revenue

Commands:
- npm run revenue:targets
- npm run revenue:pipeline
- npm run revenue:focus
- npm run revenue:score

## Execution Pack

Purpose: Generate first-client GO / NO GO execution support.

Inputs:
- output/revenue
- output/executive

Outputs:
- output/execution

Commands:
- npm run execute:first-client
- npm run execute:decision-board
- npm run execute:outreach-review

## Outcome Tracking

Purpose: Track manually entered outcomes after Daniel acts externally.

Inputs:
- data/outcomes/outcomes.json

Outputs:
- output/outcomes

Commands:
- npm run outcome:add
- npm run outcome:dashboard
- npm run outcome:review

## Follow-Up OS

Purpose: Prioritize manual follow-up reviews from local outcomes and revenue signals.

Inputs:
- data/followups/followups.json
- data/outcomes/outcomes.json

Outputs:
- output/followups

Commands:
- npm run followup:queue
- npm run followup:daily
- npm run followup:priorities
- npm run followup:review

## Win/Loss Intelligence

Purpose: Learn from real manually recorded outcomes only.

Inputs:
- data/outcomes/outcomes.json

Outputs:
- output/winloss

Commands:
- npm run winloss:analysis
- npm run winloss:patterns
- npm run winloss:insights
- npm run winloss:strategy

## Finance Tracking

Purpose: Report booked finance data and forecasts from local finance records.

Inputs:
- data/finance/finance.json

Outputs:
- output/finance

Commands:
- npm run finance:monthly
- npm run finance:dashboard
- npm run finance:forecast

## Dashboard

Purpose: Generate static read-only PWA dashboard data and UI.

Inputs:
- data/dashboard/dashboard.json
- output/dashboard/dashboard.json

Outputs:
- dashboard

Commands:
- npm run dashboard:generate
- npm run dashboard:mobile

## Mobile Command Center

Purpose: Generate mobile review, queue, and summary reports.

Inputs:
- data/mobile/mobile-state.json
- dashboard/dashboard.json

Outputs:
- output/mobile
- output/mobile-command-center

Commands:
- npm run mobile:review
- npm run mobile:summary
- npm run mobile:queue

## Safety Rules
- Read-only documentation and recovery planning only.
- Do not send outreach.
- Do not send emails.
- Do not create meetings.
- Do not create invoices.
- Do not create payments.
- Do not modify financial records.
- Do not modify outcome records.
