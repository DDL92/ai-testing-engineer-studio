# Ideal Customer Profiles

This outbound system targets companies where QA evidence, Playwright smoke tests, and recurring QA automation can reduce visible release risk. Outreach remains manual and must be approved before sending.

## 1. SaaS

Why it is a fit:
SaaS products usually have recurring releases, user accounts, dashboards, onboarding, billing, and integrations that benefit from stable smoke coverage.

Common QA pain points:
- Signup and onboarding regressions
- Login/session bugs
- Dashboard data not loading
- API integration failures
- CI/CD releases without enough confidence

Typical offer:
Playwright Starter Pack or QA Automation Retainer.

Retainer potential:
High when the product ships weekly, has a small team, or lacks dedicated QA.

Red flags:
- No active product
- No visible web app
- Very early idea-stage company with no users
- Existing mature QA team with no stated pain

## 2. E-commerce

Why it is a fit:
E-commerce sites depend on product discovery, cart, checkout, payment handoff, and mobile flows.

Common QA pain points:
- Cart regressions
- Checkout blockers
- Payment handoff issues
- Mobile layout problems
- Promotion or inventory display bugs

Typical offer:
QA Audit followed by Playwright Starter Pack.

Retainer potential:
Medium to high if the store runs frequent campaigns, product updates, or seasonal launches.

Red flags:
- No meaningful transaction volume
- Only a static catalog
- Payment testing requested without safe scope
- Demand for production checkout testing without approval

## 3. Marketplaces

Why it is a fit:
Marketplaces have multi-sided workflows with buyer, seller, listing, search, booking, payment, and messaging behavior.

Common QA pain points:
- Search/filter regressions
- Listing creation issues
- Buyer/seller onboarding gaps
- Notification or messaging bugs
- Role-based workflow breaks

Typical offer:
QA Audit, then Playwright Starter Pack for public and approved staging flows.

Retainer potential:
High when the platform has recurring feature releases and multi-role workflows.

Red flags:
- Requires testing private user data
- No staging environment for role-based checks
- Unclear ownership of bugs or product workflows

## 4. Booking Platforms

Why it is a fit:
Booking products rely on availability, scheduling, confirmation, cancellation, and notification flows.

Common QA pain points:
- Broken availability states
- Booking confirmation failures
- Calendar/timezone issues
- Signup/onboarding friction
- Email or notification gaps

Typical offer:
QA Audit or Playwright Starter Pack.

Retainer potential:
High if bookings are core revenue and releases are frequent.

Red flags:
- No safe test environment
- Requires real transactions
- No clear booking workflow owner

## 5. Fintech

Why it is a fit:
Fintech products often have dashboards, account workflows, API dependencies, onboarding, and high trust requirements.

Common QA pain points:
- Login/session issues
- Dashboard data display bugs
- API failures
- Onboarding friction
- Regression risk around sensitive flows

Typical offer:
QA Audit first, then scoped Playwright Starter Pack.

Retainer potential:
High, but only with clear boundaries and safe non-production access.

Red flags:
- Requests production credential usage
- Asks for security/compliance claims outside scope
- No staging or sandbox environment
- Payment or financial transaction testing without explicit safe scope

## 6. HealthTech

Why it is a fit:
HealthTech products often have onboarding, account portals, scheduling, forms, dashboards, and high user trust expectations.

Common QA pain points:
- Form validation bugs
- Patient/provider portal issues
- Scheduling regressions
- Mobile usability gaps
- Release risk around sensitive workflows

Typical offer:
QA Audit with cautious scope, then Playwright Starter Pack for approved non-sensitive flows.

Retainer potential:
Medium to high if there is a stable staging environment and recurring release cadence.

Red flags:
- Protected health information exposure
- Production credential usage
- Compliance promises requested
- No safe data policy

## 7. Agencies Needing QA Support

Why it is a fit:
Agencies ship client projects repeatedly and often need flexible QA support without hiring full-time QA.

Common QA pain points:
- Client launch regressions
- No reusable smoke test framework
- Flaky handoff between dev and QA
- Multiple client sites needing recurring checks
- Limited time for QA before launch

Typical offer:
Agency Partner Retainer or Playwright Starter Pack.

Retainer potential:
Very high when the agency has recurring launches or maintenance clients.

Red flags:
- Wants unlimited QA for a low fixed price
- No project owner
- Last-minute emergency-only work
- Expects auto-contact with their clients
