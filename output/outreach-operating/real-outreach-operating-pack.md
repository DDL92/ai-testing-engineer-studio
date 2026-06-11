# Real Outreach Operating Pack

Generated: 2026-06-11T21:56:26.065Z

## Summary
- Total leads: 51
- Excluded demo/sample leads: 8
- Eligible commercial leads: 43
- Top 5 selected: 5

Local context read:
- Top 10 revenue opportunities: available (output/pipeline-prioritization/top-10-revenue-opportunities.md). Summary: # Top 10 Revenue Opportunities Generated: 2026-06-11T21:47:42.781Z Pricing ranges used: - QA Audit: $199-$500
- Top 5 actions: available (output/pipeline-prioritization/top-5-actions.md). Summary: # Top 5 Actions Generated: 2026-06-11T21:47:42.781Z ## 1. Prepare client workflow for BookingFlow AI - Action title: Prepare client workflow for BookingFlow AI
- Opportunity tracker: available (output/pipeline/opportunity-tracker.md). Summary: # Opportunity Tracker Generated: 2026-06-11T21:28:29.240Z ## Summary - Total Leads: 51
- Client ops next actions: available (output/client-ops/next-actions.md). Summary: # Client Next Actions Generated: 2026-06-11T17:08:30.957Z ## 1. PushPress - Company: PushPress
- Daily command center: available (output/operator/daily-command-center.md). Summary: # AI Studio Daily Command Center Generated At: 2026-06-11T21:27:59.455Z ## Revenue Snapshot - Estimated MRR: $2,000
- Dashboard: available (output/dashboard/dashboard.md). Summary: # AI Studio OS Dashboard ## Executive Summary - Status: local-ready - Generated At: 2026-06-11T21:28:22.275Z

## Commercial Mode
- Commercial Mode is enabled by default for this outreach pack.
- Demo/sample leads are excluded unless Daniel explicitly allows them in a future workflow.
- Excluded conditions: sample IDs, .example websites, sample sources, Demo/Sandbox/Test company names, not-fit offers, paused status, or lost status.

## Top 5 Real Outreach Leads
| Rank | Company | Score | Recommended Offer | Next Action | Suggested Command |
| ---: | --- | ---: | --- | --- | --- |
| 1 | PushPress | 100 | qa-automation-retainer | Review contact context and manual outreach readiness for PushPress. | `npm run contact:review -- --id pushpress` |
| 2 | TeamUp | 92 | qa-automation-retainer | Generate audit pack for TeamUp. | `npm run audit:pack -- --id teamup` |
| 3 | Wodify | 92 | qa-automation-retainer | Generate audit pack for Wodify. | `npm run audit:pack -- --id wodify` |
| 4 | ABC Glofox | 90 | agency-partner-retainer | Generate research pack for ABC Glofox. | `npm run lead:research -- --id abc-glofox` |
| 5 | Bookee | 90 | agency-partner-retainer | Generate research pack for Bookee. | `npm run lead:research -- --id bookee` |

## Contact Research Workflow
- Open public sources manually only.
- Search LinkedIn manually for the company and the allowed roles.
- Verify company match before recording a role or URL.
- Do not scrape, export, enrich, or mass collect contacts.
- Do not use private data or credentials.
- Record only Daniel-reviewed public context in local notes.

## Message Review Workflow
- Use local research, lead pack, audit pack, and outreach pack context only.
- Do not invent company facts, contacts, metrics, bugs, audit results, or urgency.
- Keep messages draft-only until Daniel approves them.
- Use `npm run outreach:pack -- --id lead_id` only when enough local context exists.
- Use `npm run contact:review -- --id lead_id` before any manual outreach decision.

## Follow-Up Workflow
- Follow up only after Daniel manually sends an initial message.
- Use local contact review status and notes as the source of truth.
- Do not automate reminders, email, LinkedIn, CRM updates, or calendar events.
- If a follow-up date exists, review context before changing status or drafting a follow-up.

## First Audit Offer Workflow
- Position the first paid step as a focused QA Audit priced at $199-$500.
- Offer path: QA Audit -> Playwright Starter Pack -> QA Automation Retainer.
- Only reference completed audit work when a local audit pack exists.
- Do not guarantee outcomes or claim findings that are not in local evidence.

## Safety Rules
- No APIs.
- No scraping.
- No browsing automation.
- No CRM integrations.
- No outreach automation.
- No email sending.
- No LinkedIn automation.
- No payment systems.
- No credentials.
- No external databases.
- Do not invent contacts, URLs, company facts, audit findings, or outcomes.
- Daniel must approve before any external action.

## Suggested Commands
- `npm run contact:review -- --id pushpress`
- `npm run audit:pack -- --id teamup`
- `npm run audit:pack -- --id wodify`
- `npm run lead:research -- --id abc-glofox`
- `npm run lead:research -- --id bookee`
- `npm run pipeline:prioritize`
- `npm run operator:daily`
- `npm run dashboard`
