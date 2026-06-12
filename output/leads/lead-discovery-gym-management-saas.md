# Lead Discovery Engine v1

Generated: 2026-06-12T18:02:36.312Z
Niche: gym management SaaS

## Current Boundary
- Local seed catalog only. No internet, APIs, scraping, browser automation, CRM, LinkedIn automation, or sending.
- Candidates are saved for human review; they are not automatically promoted into the active lead pipeline.
- Human approval is required before adding leads, creating outreach, running audits, sending messages, or proposing work.

## Discovered Companies
| Company | Score | Offer | Website | QA Opportunity | Next Action |
| --- | ---: | --- | --- | --- | --- |
| ABC Glofox | 10/10 | agency-partner-retainer | https://www.glofox.com | signup/onboarding coverage, checkout regression risk, payment flow risk | Human review ABC Glofox, then run npm run lead:pack -- --company "ABC Glofox". |
| Bookee | 10/10 | agency-partner-retainer | https://www.bookeeapp.com | signup/onboarding coverage, checkout regression risk, payment flow risk | Human review Bookee, then run npm run lead:pack -- --company "Bookee". |
| TeamUp | 8/10 | qa-automation-retainer | https://goteamup.com | signup/onboarding coverage, payment flow risk, regression testing opportunity | Human review TeamUp, then run npm run lead:pack -- --company "TeamUp". |
| PushPress | 7/10 | playwright-starter-pack | https://www.pushpress.com | signup/onboarding coverage, checkout regression risk, payment flow risk, mobile flow review | Human review PushPress, then run npm run lead:pack -- --company "PushPress". |
| Wodify | 7/10 | playwright-starter-pack | https://www.wodify.com | checkout regression risk, payment flow risk, regression testing opportunity, mobile flow review | Human review Wodify, then run npm run lead:pack -- --company "Wodify". |
| PropertyMe | 6/10 | qa-audit | https://www.propertyme.com.au | payment flow risk, regression testing opportunity, mobile flow review | Human review PropertyMe, then run npm run lead:pack -- --company "PropertyMe". |
| NeetoCal | 5/10 | qa-audit | https://www.neeto.com/neetocal | payment flow risk, regression testing opportunity, calendar integration risk | Human review NeetoCal, then run npm run lead:pack -- --company "NeetoCal". |

## Revenue Focus
- Prioritize companies with public product workflows, checkout/payment-adjacent risk, booking/onboarding complexity, mobile risk, or frequent releases.
- Use QA Audit as the first paid wedge, then convert evidence into a Playwright Starter Pack or QA Automation Retainer only when justified.
- Do not treat discovered candidates as booked revenue.

## Suggested Next Commands
- Review data/leads/discovered-leads.json manually.
- Promote approved candidates with npm run lead:add.
- Generate a company pack with npm run lead:pack -- --company "Company Name".
- Generate audit evidence only after Daniel approves a public URL and scope.

## Safety Rules
- Local-first deterministic discovery only.
- No paid APIs.
- No LinkedIn automation.
- No message sending.
- No scraping behind logins.
- No browser automation or external enrichment.
- No invented contacts, findings, metrics, or revenue.
- Human approval is required before promoting, contacting, auditing, proposing, or sending anything.
