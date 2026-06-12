# Architecture Summary

Generated: 2026-06-12T16:43:20.573Z

| Layer | Purpose | Inputs | Outputs |
| --- | --- | --- | --- |
| Lead Layer | Capture, score, research, and prepare commercial leads for manual review. | data/leads.json<br>data/contact-reviews.json<br>manual candidate queue | lead packs<br>research packs<br>contact reviews<br>commercial opportunity lists |
| Revenue Layer | Separate booked MRR from speculative opportunities and prioritize revenue actions. | commercial leads<br>data/clients.json<br>Revenue Command Center rules | booked MRR<br>MRR forecast<br>audit opportunities<br>retainer opportunities<br>daily revenue actions |
| Client Layer | Prepare onboarding, delivery, reporting, renewal, and retainer workflows after manual approval. | client records<br>approved lead context<br>delivery evidence | client prep<br>delivery plans<br>client reports<br>renewal and expansion reports |
| Operations Layer | Turn local reports into daily operating priorities without sending or external integrations. | pipeline reports<br>revenue reports<br>client reports<br>approval queues | daily operator<br>Action Cockpit<br>Mac daily summary<br>approval checklist |
| Reporting Layer | Generate evidence-first Markdown reports for audits, clients, revenue, and system health. | local JSON data<br>generated artifacts<br>Playwright evidence when explicitly run | audit reports<br>client reports<br>stabilization reports<br>v1 candidate reports |
| Dashboard Layer | Provide local command-center views for manual operating decisions. | Revenue Command Center<br>Action Cockpit<br>operator reports<br>mobile reports | Operator OS Dashboard<br>Mobile Command Center<br>legacy dashboard surfaces |

## Human Approval Reminder
- Human approval is required before outreach, follow-up, proposal, SOW, discovery call, audit delivery, client report, renewal, invoice, payment, or external action.
- This release package is local-only and deterministic from repository files and local JSON data.
- No APIs, scraping, browsing, CRM, outreach automation, sending, payments, credentials, or external databases were used.
- Revenue readiness uses booked revenue from commercial local client records only; opportunities are not booked revenue.
