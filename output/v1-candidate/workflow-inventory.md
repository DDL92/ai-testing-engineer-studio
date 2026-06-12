# Workflow Inventory

Generated: 2026-06-12T17:07:28.252Z

Lead -> Research -> Audit -> Outreach -> Proposal -> Discovery Call -> Audit Sale -> Delivery -> Retainer -> Renewal

| Stage | Implemented | Supporting Reports | Supporting Commands | Missing |
| --- | --- | --- | --- | --- |
| Lead | implemented | None | npm run lead:add | None |
| Research | implemented | output/research | npm run lead:research | None |
| Audit | implemented | output/audit-packs | npm run audit:pack<br>npm run audit:site | None |
| Outreach | implemented | output/outreach-execution/outreach-execution-pack.md | npm run outreach:pack<br>npm run outreach:execute-pack | None |
| Proposal | implemented | output/proposal-center/proposal-command-center.md | npm run proposal:center<br>npm run sow:generate | None |
| Discovery Call | implemented | output/first-audit-workflow/discovery-call-prep.md | npm run first-audit:workflow | None |
| Audit Sale | implemented | output/first-audit-workflow/audit-scope-confirmation.md<br>output/first-audit-workflow/audit-kickoff-plan.md | npm run first-audit:kickoff | None |
| Delivery | implemented | output/client-delivery/demo-retainer-client/delivery-plan.md | npm run client:delivery | None |
| Retainer | implemented | output/client-reporting/demo-retainer-client/monthly-report.md | npm run client:delivery-report | None |
| Renewal | implemented | output/renewals/renewal-pipeline.md | npm run renewal:tracker | None |

## Human Approval Reminder
- Human approval is required before outreach, follow-up, proposal, SOW, discovery call, audit delivery, client report, renewal, invoice, payment, or external action.
- This release package is local-only and deterministic from repository files and local JSON data.
- No APIs, scraping, browsing, CRM, outreach automation, sending, payments, credentials, or external databases were used.
- Revenue readiness uses booked revenue from commercial local client records only; opportunities are not booked revenue.
