# Release Cleanup Plan

Generated: 2026-06-12T17:23:54.582Z

## Cleanup Boundary
- Do not delete commands yet.
- Add deprecation labels and source-of-truth rules first.
- Keep current workflows working until v1.0 stable criteria are approved.

## Warning Cleanup
| Warning | Cleanup Rule | Source Of Truth | Recommended Action |
| --- | --- | --- | --- |
| Legacy dashboard overlap | Label `npm run dashboard` as legacy and `npm run os:dashboard` as primary. | Operator OS Dashboard | Update docs and command inventory; do not delete the legacy dashboard yet. |
| Legacy cockpit overlap | Label `npm run cockpit` as legacy and `npm run cockpit:daily` as current. | Action Cockpit v1 | Add deprecation language only; keep compatibility until stable release. |
| Lead command family overlap | Group `lead:*` commands by lifecycle stage instead of removing commands. | Lead -> Research -> Audit -> Outreach lifecycle | Document owner command for each stage and defer cleanup until after first revenue validation. |
| Client command family overlap | Group `client:*` commands by prep, delivery, reporting, and next actions. | Client Operations and Client Reporting | Add source-of-truth notes before any command consolidation. |
| Operator command family overlap | Separate older sales-marketing operator commands from current OS dashboard commands. | Operator OS Dashboard | Deprecation labels only; do not remove scripts yet. |
| Demo/sample revenue records | Keep demo/sample client fee records excluded from booked MRR. | Revenue Command Center | Document exclusion rule and keep booked revenue at $0 until real commercial client record exists. |

## Manual Approval Reminder
- Human approval is required before outreach, follow-up, proposal, SOW, discovery call, audit delivery, retainer discussion, invoice, payment, or external action.
- This pack is local-only and uses existing Studio data and generated reports.
- No APIs, scraping, browsing, CRM, outreach automation, sending, payments, credentials, or external databases were used.
- Do not invent contacts, audit findings, private company facts, revenue, client outcomes, or unsupported claims.
- Opportunities are not booked revenue until a real commercial local client record exists.
