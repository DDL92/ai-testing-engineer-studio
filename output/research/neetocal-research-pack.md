# Lead Research Pack

## Lead Summary

- Company: NeetoCal
- Website: https://www.neeto.com/neetocal
- Industry: Scheduling SaaS
- Score: 6/10
- Recommended offer: playwright-starter-pack
- Source: Product Hunt/manual research

## Why This May Be A Good Fit

- Local lead score is 6/10 with recommended offer playwright-starter-pack.
- A website is available for manual review.
- Local notes: Scheduling software with availability, calendar integrations, Stripe payments, cancellations, and appointment workflows. Potential QA opportunity around booking, payment, cancellation, calendar sync, and regression coverage.
- Local pain point notes: payment flow risk, regression testing opportunity.

## Potential QA Risk Areas

- Potential area for manual review: onboarding flow risk.
- Potential area for manual review: login/authentication risk.
- Potential area for manual review: regression risk around core product workflows.
- Potential area for manual review: reservation flow risk.
- Potential area for manual review: availability and scheduling risk.
- Potential area for manual review: payment flow risk.
- Potential area for manual review: regression testing opportunity.

## Potential Audit Angles

- Smoke test audit for the most important public or approved user flow.
- Regression readiness audit focused on repeatable release checks.
- Navigation audit for core pages and conversion paths.
- Onboarding audit for signup, activation, and first-use steps.
- Booking flow audit for availability, reservation, and confirmation paths.

## Potential Automation Opportunities

- Suggested opportunity: Playwright smoke suite for critical happy paths.
- Suggested opportunity: regression suite for repeatable release confidence.
- Suggested opportunity: cross-browser coverage for approved high-value flows.
- Suggested opportunity: API validation for approved integration or data workflow checks.
- Suggested opportunity: mobile viewport coverage for important conversion flows.

## Discovery Call Questions

- Do you currently have automated tests for your most important user flows?
- How do you validate releases before they go live?
- What are your highest-risk user flows right now?
- How often do you deploy or release product changes?
- Where do regressions usually create the most support or engineering cost?
- Do you have CI/CD in place, and are tests part of that workflow?
- Which flows would give the team the most confidence if they were checked automatically?
- Which checkout or payment paths can be safely reviewed without testing real transactions?
- Which booking or availability scenarios are most important to verify before release?

## Suggested Proposal Angle

- Position the proposal as a first automation foundation for critical flows.
- Keep scope limited to a small Playwright smoke suite, failure evidence, and README/run instructions.

## Recommended Offer

- Recommended offer: playwright-starter-pack
- Reasoning should be reviewed manually. Local scoring reasons: +1.5 Has a website to review; +2.5 Strong QA-fit industry: saas, booking; +2 Relevant QA pain points: payment, regression

## Revenue Potential

- Potential price range: $900-$1,500
- Potential engagement path: QA Audit -> Playwright Starter Pack -> QA Automation Retainer
- One-time starter work may become retainer work only after value and maintenance needs are confirmed.

## Suggested Next Commands

- npm run lead:pack -- --id neetocal
- npm run audit:site -- --url https://www.neeto.com/neetocal
- npm run sow:generate -- --id neetocal
- npm run cockpit
- npm run outreach:queue

## Assumptions & Limitations

- Generated from local lead data only.
- No website inspection was performed.
- No external research, APIs, browsing, scraping, enrichment, or credentialed access was used.
- Potential risks and opportunities are suggestions for manual review, not claims about the company.
- Recommendations require Daniel review before outreach, audit delivery, proposal, or client communication.

