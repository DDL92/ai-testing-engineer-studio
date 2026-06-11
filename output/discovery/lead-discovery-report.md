# Lead Discovery Assistant

Date: 2026-06-11

## Recommended ICPs
1. SaaS
   - Why it fits: SaaS products usually have onboarding, dashboards, account flows, integrations, and frequent releases.
   - Audit angle: Onboarding and regression readiness audit.
   - Retainer potential: High when the product ships frequently or needs ongoing smoke/regression coverage.
   - Difficulty level: medium
2. E-commerce
   - Why it fits: E-commerce teams depend on checkout, cart, product, and mobile purchase flows working consistently.
   - Audit angle: Checkout and mobile purchase flow audit.
   - Retainer potential: Medium to high when releases, campaigns, or platform changes happen often.
   - Difficulty level: medium
3. Booking Platforms
   - Why it fits: Booking products have availability, reservation, confirmation, calendar, and notification workflows.
   - Audit angle: Booking flow and availability audit.
   - Retainer potential: High when booking reliability directly affects revenue or operations.
   - Difficulty level: medium
4. Marketplaces
   - Why it fits: Marketplaces have multiple user roles, listings, search, account flows, and transaction paths.
   - Audit angle: Buyer/seller workflow and search/filter audit.
   - Retainer potential: High when both sides of the marketplace require ongoing release confidence.
   - Difficulty level: high
5. Fintech
   - Why it fits: Fintech products often have login, account, transaction, dashboard, and API workflows with high trust requirements.
   - Audit angle: Authentication and transaction workflow audit with careful scope boundaries.
   - Retainer potential: High when safe staging access and bounded workflows are available.
   - Difficulty level: high
6. Agencies
   - Why it fits: Agencies may need recurring QA support across launches, maintenance retainers, and client projects.
   - Audit angle: Agency QA support audit for launch and maintenance workflows.
   - Retainer potential: High when the agency has multiple active client builds and no dedicated QA automation support.
   - Difficulty level: medium
7. HealthTech
   - Why it fits: HealthTech products can have scheduling, intake, portals, roles, and workflow reliability needs.
   - Audit angle: Workflow reliability and role-based access audit with cautious claims.
   - Retainer potential: Medium to high when access is safe, explicit, and carefully scoped.
   - Difficulty level: high

## High Probability Targets
- B2B SaaS: Often has onboarding, dashboards, and repeat release cycles.
- Scheduling SaaS: Booking and availability flows are natural QA audit targets.
- Reservation software: Reservation paths create clear smoke test opportunities.
- Gym management software: Membership, scheduling, and payment-adjacent flows may need QA review.
- Property management software: Tenant, owner, payment-adjacent, and maintenance workflows can be complex.
- Travel booking systems: Search, availability, booking, and confirmation workflows are high value.
- E-commerce stores: Checkout, cart, mobile, and product flows are easy to scope for audits.
- Shopify stores: Theme, app, checkout-adjacent, and mobile changes can create regression risk.
- Digital agencies: May need partner QA support for client launches.
- Shopify agencies: Often manage multiple storefronts with recurring QA needs.
- Product studios: Launch and maintenance work can support partner-retainer positioning.
- AI workflow products: Onboarding, integration, and release confidence may be important.
- Fintech dashboards: Authentication and workflow reliability can justify careful QA review.
- HealthTech scheduling tools: Scheduling and role-based workflows often need cautious manual qualification.

## Where To Look
- LinkedIn company search: Find companies by category, industry, hiring signal, and founder/product leader activity. Safety: Review manually. Do not automate LinkedIn or send auto-DMs.
- Crunchbase manual review: Find funded startups and product categories worth manual review. Safety: Use manual browsing only. Do not scrape or export lists.
- Product Hunt: Find recently launched SaaS, AI, workflow, booking, and marketplace products. Safety: Use as a discovery source only. Validate fit manually.
- G2: Find SaaS categories and vendor lists for manual company review. Safety: Do not scrape profiles or automate collection.
- Capterra: Find vertical software categories like gym, property, scheduling, and healthcare tools. Safety: Use categories and manual review only.
- Clutch: Find agencies, software studios, Shopify agencies, and product teams. Safety: Do not mass-message agencies.
- Agency directories: Find agencies that may need QA partner support. Safety: Review services and fit manually.
- Startup directories: Find early product companies with active releases. Safety: Do not bulk extract records.
- Local business software providers: Find local or vertical software companies with real web-product workflows. Safety: Avoid brochure sites without product complexity.

## Search Queries
- `site:linkedin.com/company SaaS booking software`
- `site:linkedin.com/company "B2B SaaS" "workflow automation"`
- `site:linkedin.com/company "property management software"`
- `site:linkedin.com/company "gym management software"`
- `site:linkedin.com/company "travel booking platform"`
- `site:linkedin.com/company "healthtech SaaS"`
- `site:linkedin.com/company "Shopify agency"`
- `"property management software"`
- `"gym management software"`
- `"travel booking platform"`
- `"healthtech SaaS"`
- `"booking software" "free trial"`
- `"reservation software" "demo"`
- `"scheduling software" "integrations"`
- `"marketplace platform" "startup"`
- `"B2B SaaS" "customer portal"`
- `"SaaS onboarding" "free trial"`
- `"workflow automation software" "demo"`
- `"field service management software"`
- `"appointment booking software"`
- `"rental management software"`
- `"event booking platform"`
- `"subscription ecommerce platform"`
- `"Shopify Plus agency"`
- `"digital product studio" "web app"`
- `"software agency" "maintenance retainer"`
- `"AI workflow software" "signup"`
- `"fintech dashboard" "SaaS"`
- `"patient scheduling software"`
- `"client portal software" "SaaS"`

## Lead Research Workflow
Find company category or directory result manually.
↓
Review website manually for product workflows, signup, checkout, booking, dashboards, or agency services.
↓
Add lead with npm run lead:add only if the company appears relevant.
↓
Generate research pack with npm run lead:research.
↓
Generate lead pack with npm run lead:pack.
↓
Generate audit only when the URL is appropriate and public.
↓
Generate SOW only after manual qualification.

## Daily Discovery Plan
- Spend 10 minutes reviewing ICP category and search query options.
- Spend 10 minutes manually reviewing company websites or directory listings.
- Spend 10 minutes adding 3-5 quality leads or updating the first-50 queue.
- Stop when quality drops. Do not chase volume.

## Weekly Discovery Goal
- Add or qualify 15-25 quality leads per week.
- Prioritize leads with visible product workflows, clear QA risk, and realistic audit or retainer fit.
- Keep the first 50 list current before expanding into larger volume.

## Suggested Next Commands
- `npm run lead:add -- --company "Company Name" --website "https://example.com" --industry "SaaS" --source "Manual Research" --notes "Why this is a fit"`
- `npm run lead:research -- --id lead_id`
- `npm run lead:pack -- --id lead_id`
- `npm run audit:site -- --url https://example.com`
- `npm run sow:generate -- --id lead_id`
- `npm run outreach:queue`
- `npm run cockpit`

## Safety Rules
- No scraping.
- No automated outreach.
- No mass messaging.
- No auto-DMs.
- No browser automation.
- No APIs, credentials, CRM integrations, or lead databases created from the internet.
- Manual review is required before adding leads, preparing outreach, sending messages, generating proposals, or client communication.
