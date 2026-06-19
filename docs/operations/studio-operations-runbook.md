# Studio Operations Runbook

Generated: 2026-06-19T01:58:13.280Z

## Morning Workflow
1. Run `npm run studio:health`.
2. Run `npm run revenue:morning`.
3. Review the actionable lead and evidence package.

## Daily Workflow
1. Run the 07:00 local runner or `npm run runner:test` when explicitly approved.
2. Review `npm run revenue:today` output.
3. Complete external actions manually.
4. Record only real outcomes.

## Weekly Workflow
1. Run `npm run revenue:weekly`.
2. Review follow-ups, evidence freshness, delivery readiness, and system health.

## Monthly Workflow
1. Review finance, clients, retainers, archive candidates, and learning calibration.
2. Run backup and recovery recommendations.

## Backup Recommendations
- Run `npm run studio:backup` and review the generated plan.
- Keep private runtime data out of public repositories.

## Review Recommendations
- Apply no cleanup, archive, outreach, delivery, or revenue action without human approval.

## Stability Boundary
- Studio v1 remains local-only and human-approved.
- Release Manager generates documentation and validation evidence only.
- No business workflow, command, data source, database, integration, or commercial rule is modified.
- No outreach, messages, meetings, invoices, payments, revenue, or outcomes are created.
