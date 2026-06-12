# System Audit

Generated: 2026-06-12T15:48:17.132Z

## Scope
- Commands
- Reports
- Workflows
- Dependencies
- Generated outputs

## Findings
- Commands audited: 112
- Reports audited: 174
- Workflow stages audited: 10
- Health areas checked: 17
- Critical issues: 0
- Warnings: 20

## Duplicates / Overlap
- client:delivery: large command family (9 client:* commands); review overlap manually
- client:delivery-report: large command family (9 client:* commands); review overlap manually
- client:evidence: large command family (9 client:* commands); review overlap manually
- client:next-actions: large command family (9 client:* commands); review overlap manually
- client:onboard: large command family (9 client:* commands); review overlap manually
- client:ops: large command family (9 client:* commands); review overlap manually
- client:prep: large command family (9 client:* commands); review overlap manually
- client:report: large command family (9 client:* commands); review overlap manually
- client:update-draft: large command family (9 client:* commands); review overlap manually
- cockpit: legacy cockpit overlaps with cockpit:daily
- dashboard: dashboard overlaps with os:dashboard as an older view
- lead:add: large command family (24 lead:* commands); review overlap manually
- lead:audit: large command family (24 lead:* commands); review overlap manually
- lead:auto: large command family (24 lead:* commands); review overlap manually
- lead:candidate-queue: large command family (24 lead:* commands); review overlap manually
- lead:close: large command family (24 lead:* commands); review overlap manually
- lead:convert: large command family (24 lead:* commands); review overlap manually
- lead:daily: large command family (24 lead:* commands); review overlap manually
- lead:discover: large command family (24 lead:* commands); review overlap manually
- lead:discover:assistant: large command family (24 lead:* commands); review overlap manually

## Missing Outputs
- None.

## Missing Validations
- No required validation command gaps detected.

## Consistency Risks
- client:delivery: large command family (9 client:* commands); review overlap manually
- client:delivery-report: large command family (9 client:* commands); review overlap manually
- client:evidence: large command family (9 client:* commands); review overlap manually
- client:next-actions: large command family (9 client:* commands); review overlap manually
- client:onboard: large command family (9 client:* commands); review overlap manually
- client:ops: large command family (9 client:* commands); review overlap manually
- client:prep: large command family (9 client:* commands); review overlap manually
- client:report: large command family (9 client:* commands); review overlap manually
- client:update-draft: large command family (9 client:* commands); review overlap manually
- cockpit: legacy cockpit overlaps with cockpit:daily
- dashboard: dashboard overlaps with os:dashboard as an older view
- lead:add: large command family (24 lead:* commands); review overlap manually
- output/dashboard/commercial-dashboard.md: older dashboard surface may overlap with Operator OS Dashboard
- output/dashboard/commercial-revenue-visibility.md: revenue-like report should defer booked MRR to Revenue Command Center
- output/dashboard/dashboard.html: older dashboard surface may overlap with Operator OS Dashboard
- output/dashboard/dashboard.md: older dashboard surface may overlap with Operator OS Dashboard
- output/dashboard/revenue-visibility.md: revenue-like report should defer booked MRR to Revenue Command Center
- output/metrics/revenue-summary.md: revenue-like report should defer booked MRR to Revenue Command Center
- output/pipeline-prioritization/top-10-revenue-opportunities.md: revenue-like report should defer booked MRR to Revenue Command Center
- Excluded non-commercial active client has local monthlyFee $2,000: Demo Retainer SaaS.

## Audit Rules
- Audit-only local report generation.
- Do not modify existing business data.
- Human approval is required before outreach, follow-up, proposal, SOW, discovery call, client delivery, client report, renewal, expansion, invoice, payment, or external action.
- No APIs, scraping, browsing, CRM, outreach automation, email sending, LinkedIn automation, payments, credentials, external databases, or sending workflows were used.
