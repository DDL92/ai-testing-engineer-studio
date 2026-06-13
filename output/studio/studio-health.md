# Studio Health

Generated: 2026-06-13T13:53:07.811Z

Overall status: Healthy

## Module Health
| Module | Status | Available | Missing | Notes |
| --- | --- | ---: | ---: | --- |
| Lead Research | Healthy | 3 | 0 | Required local source and output paths are available. |
| Contact Research | Healthy | 3 | 0 | Required local source and output paths are available. |
| Outreach Tracking | Healthy | 3 | 0 | Required local source and output paths are available. |
| Opportunity Engine | Healthy | 3 | 0 | Required local source and output paths are available. |
| Audit Engine | Healthy | 3 | 0 | Required local source and output paths are available. |
| Evidence Engine | Healthy | 3 | 0 | Required local source and output paths are available. |
| Proposal Engine | Healthy | 3 | 0 | Required local source and output paths are available. |
| Daily Revenue Loop | Healthy | 3 | 0 | Required local source and output paths are available. |
| Client Delivery | Healthy | 4 | 0 | Required local source and output paths are available. |
| Finance Tracking | Healthy | 3 | 0 | Required local source and output paths are available. |
| Dashboard | Healthy | 4 | 0 | Required local source and output paths are available. |
| Mobile Command Center | Healthy | 3 | 0 | Required local source and output paths are available. |

## Dashboard Validation
| Check | Status | Evidence | Missing | Notes |
| --- | --- | --- | --- | --- |
| Dashboard JSON exists | Healthy | output/dashboard/dashboard.json<br>dashboard/dashboard.json | None | Required local assets are available. |
| Dashboard outputs exist | Healthy | output/dashboard/dashboard-summary.md<br>output/dashboard/dashboard-health.md | None | Required local assets are available. |
| PWA assets exist | Healthy | dashboard/index.html<br>dashboard/styles.css<br>dashboard/app.js | None | Required local assets are available. |
| Manifest exists | Healthy | dashboard/manifest.json | None | Required local assets are available. |
| Mobile dashboard enabled | Healthy | dashboard/manifest.json<br>dashboard/icon.svg | None | Required local assets are available. |

## Mobile Validation
| Check | Status | Evidence | Missing | Notes |
| --- | --- | --- | --- | --- |
| PWA files | Healthy | dashboard/index.html<br>dashboard/styles.css<br>dashboard/app.js<br>dashboard/manifest.json | None | Required local assets are available. |
| Dashboard mobile server | Healthy | dashboard:mobile -> node --import tsx src/dashboard/generateDashboard.ts --mobile | None | Mobile server command exists. |
| Local network access | Healthy | src/dashboard/generateDashboard.ts | None | Required local assets are available. |
| Manifest | Healthy | dashboard/manifest.json | None | Required local assets are available. |
| Icons | Healthy | dashboard/icon.svg | None | Required local assets are available. |
| Responsive layout | Healthy | dashboard/styles.css | None | Required local assets are available. |

## Safety Rules
- Local-only consolidation reports.
- Review-only outputs.
- Human approval is required before outreach, emails, proposals, invoices, payments, client communication, or external action.
- Do not invent revenue, clients, results, findings, replies, meetings, or delivery status.
- No APIs, scraping, browsing, CRM integrations, sending workflows, payment systems, credentials, banks, or external databases are used.
