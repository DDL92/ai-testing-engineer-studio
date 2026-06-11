# Lead Discovery Automation Assistant

Generated: 2026-06-11T21:26:59.178Z

## Current Lead Inventory
- Current total leads: 51
- Tier A leads: 25
- Tier B leads: 18
- Tier C leads: 8
- Current top ICPs: Gym Management SaaS (8), Property Management SaaS (5), Scheduling SaaS (5), Fitness SaaS (4), Hospitality SaaS (4), Wellness Booking SaaS (3)

Local context read:
- First 50 progress: available (output/discovery/first-50-progress.md). Summary: # First 50 Progress Generated at: 2026-06-11T16:18:59.101Z ## Summary - Total Leads: 50
- Daily command center: available (output/operator/daily-command-center.md). Summary: # AI Studio Daily Command Center Generated At: 2026-06-11T17:39:58.031Z ## Revenue Snapshot - Estimated MRR: $2,000
- Dashboard: available (output/dashboard/dashboard.md). Summary: # AI Studio OS Dashboard ## Executive Summary - Status: local-ready - Generated At: 2026-06-11T16:59:21.537Z

## Best ICPs
- Fitness SaaS: scheduling, memberships, mobile apps, billing-adjacent flows, and frequent operational releases.
- Wellness SaaS: appointment booking, intake, packages, memberships, reminders, and mobile flow risk.
- Booking platforms: availability, booking, cancellation, confirmation, calendar, and payment-adjacent paths.
- Hospitality SaaS: reservation, guest portal, booking engine, staff workflow, and integration-heavy workflows.
- Property management SaaS: tenant portals, maintenance requests, inspections, owner dashboards, and mobile flows.
- Scheduling SaaS: calendar sync, availability, timezone handling, reminders, cancellation, and integration risk.
- SaaS agencies: recurring launch support, multiple client apps, regression risk, and QA partner retainer potential.
- HealthTech SaaS: scheduling, portals, intake, role-based workflows, and careful compliance-aware scope boundaries.
- E-commerce platforms: checkout-adjacent, cart, subscription, product, mobile, and release regression workflows.

## Recommended Search Sources
- Google: Find category lists, product pages, comparison pages, and industry pages. Safety: Search manually. Do not scrape results or automate browsing.
- LinkedIn manual search: Find company pages and role/context signals through manual review. Safety: Do not automate LinkedIn, auto-DM, export people, or enrich contacts.
- G2: Find SaaS categories and vendor names for manual review. Safety: Use visible category pages manually only.
- Capterra: Find vertical software categories such as booking, property, gym, scheduling, and health software. Safety: Do not scrape vendor lists or automate collection.
- Product Hunt: Find launched SaaS products and product categories. Safety: Validate fit manually before adding anything.
- SaaS directories: Find niche SaaS categories and vendor candidates. Safety: Manual review only. No exports or bulk collection.
- industry blogs: Find category roundups and workflow-specific software lists. Safety: Treat blog claims as leads for review, not evidence.
- agency directories: Find agencies that may need QA partner support. Safety: Do not mass-message or automate contact discovery.
- public company pages: Confirm product workflows, pricing pages, demos, docs, and integration claims. Safety: Use public pages only and do not log in or submit forms.

## Search Queries
### Fitness SaaS

- `"best gym management software"`
- `site:g2.com gym management software`
- `site:capterra.com gym management software`
- `"fitness studio management software"`
- `"martial arts school management software"`
- `"CrossFit gym management software"`

### Wellness SaaS

- `"booking software for wellness studios"`
- `"spa management software SaaS"`
- `"salon booking software platform"`
- `"wellness studio scheduling software"`
- `site:g2.com wellness scheduling software`
- `site:capterra.com spa management software`

### Booking platforms

- `"online booking platform SaaS"`
- `"reservation management software SaaS"`
- `"appointment booking platform integrations"`
- `"class booking software for studios"`
- `"booking engine SaaS demo"`
- `"customer portal booking software"`

### Hospitality SaaS

- `"hotel booking engine software"`
- `"hospitality management SaaS"`
- `"restaurant reservation software platform"`
- `"guest experience platform SaaS"`
- `site:g2.com hospitality management software`
- `site:capterra.com hotel management software`

### Property management SaaS

- `"property management SaaS booking engine"`
- `"tenant portal software SaaS"`
- `"rental property management software"`
- `"maintenance request software tenants"`
- `site:g2.com property management software`
- `site:capterra.com property management software`

### Scheduling SaaS

- `"scheduling software with calendar integrations"`
- `"appointment scheduling SaaS Stripe"`
- `"team scheduling software SaaS"`
- `"calendar booking platform for businesses"`
- `site:producthunt.com scheduling software`

### SaaS agencies

- `"SaaS development agency QA automation"`
- `"product studio web app development agency"`
- `"software agency maintenance retainer"`
- `"Shopify Plus agency QA testing"`
- `"web app development agency launch support"`

### HealthTech SaaS

- `"patient scheduling software SaaS"`
- `"healthtech appointment booking software"`
- `"clinic management software SaaS"`
- `"patient portal software company"`
- `site:g2.com patient scheduling software`

### E-commerce platforms

- `"subscription ecommerce platform SaaS"`
- `"headless commerce platform SaaS"`
- `"checkout optimization platform SaaS"`
- `"Shopify app order management software"`
- `site:producthunt.com ecommerce platform`

## Lead Qualification Rules
- Prefer public products with visible user workflows Daniel can explain without private data.
- Prioritize SaaS or service businesses with booking, scheduling, onboarding, dashboard, checkout-adjacent, portal, mobile, or integration workflows.
- Look for QA pain signals such as frequent releases, complex onboarding, integrations, mobile apps, payments-adjacent flows, or multiple user roles.
- Skip companies with no working website, no visible product/service, unclear business model, or only static content.
- Do not treat a directory listing, blog mention, or AI-generated snippet as proof. Confirm on public company pages.
- Only add leads after Daniel manually approves the company and the reason it fits.

## Manual Approval Workflow
1. Run `npm run lead:discover:assistant` to refresh search guidance and checklist files.
2. Use the search playbook manually in public search sources.
3. Review public company pages manually and note why the workflow may need QA support.
4. Add approved candidates to `output/lead-discovery-automation/candidate-queue.md` as manual entries.
5. Confirm the approval checklist before creating a local lead.
6. Run the suggested `npm run lead:add` command only after Daniel approves.
7. Generate follow-on assets with `npm run lead:research`, `npm run lead:pack`, or `npm run audit:site` only when appropriate.

## Do Not Automate
- No scraping.
- No APIs.
- No browser automation.
- No CRM integrations.
- No email automation.
- No LinkedIn automation.
- No contact enrichment.
- No auto-DMs.
- No payments, invoices, or checkout actions.
- No credentials, private client data, or production client systems.
- No adding leads without Daniel approval.

## Suggested Commands
- `npm run lead:discover:assistant`
- `npm run lead:candidate-queue`
- `npm run lead:add -- --company "Company Name" --website "https://example.com" --industry "Industry" --source "Manual research" --notes "Reason this lead fits."`
- `npm run lead:research -- --id lead_id`
- `npm run lead:pack -- --id lead_id`
- `npm run audit:site -- --url https://example.com`
- `npm run pipeline:opportunities`
- `npm run operator:daily`
