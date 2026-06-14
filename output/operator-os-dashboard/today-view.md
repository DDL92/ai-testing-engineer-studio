# Today View

Generated: 2026-06-14T05:28:49.227Z

If Daniel only works 30 minutes today, what should he do?

1. Review Appointy package
   - Reason: Revenue Intelligence source of truth: GO; Review evidence and position a scoped QA Audit as the first paid step toward a retainer path.
   - Expected Outcome: Move the unified top lead forward through manual review only.
   - Command: npm run revenue:recommendation
   - Approval: Daniel approval required before any external action. No outreach is sent.
2. Review follow-up path: PushPress
   - Reason: lead score 8/10; offer boost 18; top 5 outreach lead; research pack exists; lead pack exists; audit pack exists; outreach pack exists; contact review exists; SOW exists; client workflow exists; follow-up signal exists
   - Expected Outcome: Resolve the highest-priority manual follow-up decision.
   - Command: npm run contact:review -- --id pushpress
   - Approval: Daniel approval required before external action. No guarantee of conversion or revenue.
3. Move retainer opportunity: Appointy
   - Reason: Appointy has revenue priority 1000/100.
   - Expected Outcome: Move a high-fit retainer path into the next local review asset.
   - Command: npm run revenue:recommendation
   - Approval: Daniel approval required before external action. No guarantee of conversion or revenue.

## Priority Rules
- Prioritize revenue.
- Then client retention.
- Then proposal progress.
- Do not send, schedule, invoice, approve, or update external systems from this report.
