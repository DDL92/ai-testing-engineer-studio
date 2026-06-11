# Lead Candidate Queue

Generated: 2026-06-11T21:27:08.042Z

This is a manual-entry queue. Do not invent companies. Fill rows only after Daniel manually reviews public search results and approves each candidate for local intake.

## Current Lead Inventory
- Current total leads: 51
- Tier A leads: 25
- Tier B leads: 18
- Tier C leads: 8
- Current top ICPs: Gym Management SaaS (8), Property Management SaaS (5), Scheduling SaaS (5), Fitness SaaS (4), Hospitality SaaS (4), Wellness Booking SaaS (3)

## Manual Candidate Table
| Candidate Company | Website | Industry | Source | Why It Might Fit | Risk / Unknown | Approve? Yes/No | Suggested Command |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  | `npm run lead:add -- --company "Company Name" --website "https://example.com" --industry "Industry" --source "Manual research" --notes "Reason this lead fits."` |

## Suggested Lead Add Command Template

```sh
npm run lead:add -- --company "Company Name" --website "https://example.com" --industry "Industry" --source "Manual research" --notes "Reason this lead fits."
```

## Queue Rules
- Use public-search guidance only.
- No scraping, APIs, browser automation, CRM, outreach automation, email automation, LinkedIn automation, payments, credentials, or external databases.
- Do not add private contact data.
- Do not add a candidate until Daniel approves it.
- Keep the reason specific to visible public product or service workflows.
