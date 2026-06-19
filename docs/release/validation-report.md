# Studio v1 Validation Report

Generated: 2026-06-19T01:56:35.299Z

- Overall Status: PASS
- Release Status: RELEASE LOCKED

| Command | Status | Exit Code | Duration | Summary |
| --- | --- | ---: | ---: | --- |
| npm run studio:health | PASS | 0 | 181 ms | Studio health reports generated: output/studio-health/ / Health Score: 83/100 / Doctor Status: WATCH |
| npm run revenue:morning | PASS | 0 | 487 ms | > ai-testing-engineer-studio@1.0.0 revenue:morning / > node --import tsx src/revenueMode/generateMorningBrief.ts / Morning brief generated for Setmore. |
| npm run dashboard:generate | PASS | 0 | 1228 ms | - output/dashboard/dashboard.md / - output/dashboard/dashboard.html / Read-only PWA dashboard. No outreach, emails, proposals, invoices, payments, data edits, or external actions were performed. |
| npm run mobile:summary | PASS | 0 | 973 ms | Best Action: Review Setmore message pack and public evidence; decide manually whether to prepare a QA Audit offer. / Revenue Health: Current MRR: $0 / Summary is read-only. No outreach, emails, LinkedIn messages, proposals, invoices, payments, outcomes, revenue, or external actions were performed. |
| npm run typecheck | PASS | 0 | 1458 ms | TypeScript compilation completed. |
| npm test | PASS | 0 | 5182 ms | 12 skipped 255 passed (4.9s) |

PASS requires every validation command to exit successfully. Skipped tests remain visible in the npm test summary and do not become failures.

## Stability Boundary
- Studio v1 remains local-only and human-approved.
- Release Manager generates documentation and validation evidence only.
- No business workflow, command, data source, database, integration, or commercial rule is modified.
- No outreach, messages, meetings, invoices, payments, revenue, or outcomes are created.
