# SOW Readiness Report

Generated: 2026-06-12T07:28:37.110Z

| Company | Readiness Status | Offer Type | Scope Clarity | Audit Evidence Status | Contact Status | Next Required Step | Suggested Command |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PushPress | READY | QA Automation Retainer | READY | Audit pack exists | Contact review prepared | Review proposal and SOW approval checklist for PushPress. | `npm run sow:generate -- --id pushpress` |
| TeamUp | PARTIAL | QA Automation Retainer | PARTIAL | Lead pack exists; audit evidence needed | Contact review needed | Generate audit pack for TeamUp. | `npm run audit:pack -- --id teamup` |
| Wodify | PARTIAL | QA Automation Retainer | PARTIAL | Lead pack exists; audit evidence needed | Contact review needed | Generate audit pack for Wodify. | `npm run audit:pack -- --id wodify` |
| ABC Glofox | NOT READY | QA Automation Retainer | NOT READY | No audit evidence yet | Contact review needed | Generate research pack for ABC Glofox. | `npm run lead:research -- --id abc-glofox` |
| Bookee | NOT READY | QA Automation Retainer | NOT READY | No audit evidence yet | Contact review needed | Generate research pack for Bookee. | `npm run lead:research -- --id bookee` |

## Readiness Rules
- READY: audit evidence, contact review, and enough local scope context exist to review or generate a SOW.
- PARTIAL: some assets exist but scope, contact, or audit evidence is incomplete.
- NOT READY: research/audit/contact context is too thin for SOW work.

## Manual Approval Reminder
- Human approval is required before sending proposals, SOWs, outreach, follow-ups, invoices, or payment requests.
- This command center uses local Studio data only.
- Opportunities are not booked revenue.
- Do not invent clients, contacts, findings, metrics, ROI, scope, approvals, or outcomes.
- No APIs, scraping, browsing, CRM, outreach automation, email sending, payments, credentials, or external databases were used.
