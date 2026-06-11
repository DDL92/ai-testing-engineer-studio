# Lead Research Pack

## Lead Summary

- Company: PropertyMe
- Website: https://www.propertyme.com.au
- Industry: Property Management SaaS
- Score: 6/10
- Recommended offer: qa-audit
- Source: Capterra/manual research

## Why This May Be A Good Fit

- Local lead score is 6/10 with recommended offer qa-audit.
- A website is available for manual review.
- Local notes: Cloud property management software with trust accounting, inspections, maintenance, mobile app, and client access. Potential QA opportunity around tenant/client workflows, payments, maintenance requests, mobile responsiveness, and regression testing.
- Local pain point notes: payment flow risk, regression testing opportunity, mobile flow review.
- A bounded QA Audit is the safest first paid step because fit should be confirmed before larger scope.

## Potential QA Risk Areas

- Potential area for manual review: onboarding flow risk.
- Potential area for manual review: login/authentication risk.
- Potential area for manual review: regression risk around core product workflows.
- Potential area for manual review: payment flow risk.
- Potential area for manual review: regression testing opportunity.
- Potential area for manual review: mobile flow review.

## Potential Audit Angles

- Smoke test audit for the most important public or approved user flow.
- Regression readiness audit focused on repeatable release checks.
- Navigation audit for core pages and conversion paths.
- Onboarding audit for signup, activation, and first-use steps.

## Potential Automation Opportunities

- Suggested opportunity: Playwright smoke suite for critical happy paths.
- Suggested opportunity: regression suite for repeatable release confidence.
- Suggested opportunity: cross-browser coverage for approved high-value flows.
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

## Suggested Proposal Angle

- Position the proposal as a low-risk QA Audit to identify practical next steps before larger automation work.
- Focus on evidence, prioritized findings, and an automation roadmap rather than broad implementation claims.

## Recommended Offer

- Recommended offer: qa-audit
- Reasoning should be reviewed manually. Local scoring reasons: +1.5 Has a website to review; +1.25 Strong QA-fit industry: saas; +3 Relevant QA pain points: payment, regression, mobile

## Revenue Potential

- Potential price range: $199-$500
- Potential engagement path: QA Audit -> Playwright Starter Pack -> QA Automation Retainer
- Start with a small paid audit. Do not assume larger automation scope until evidence and discovery support it.

## Suggested Next Commands

- npm run lead:pack -- --id propertyme
- npm run audit:site -- --url https://www.propertyme.com.au
- npm run sow:generate -- --id propertyme
- npm run cockpit
- npm run outreach:queue

## Assumptions & Limitations

- Generated from local lead data only.
- No website inspection was performed.
- No external research, APIs, browsing, scraping, enrichment, or credentialed access was used.
- Potential risks and opportunities are suggestions for manual review, not claims about the company.
- Recommendations require Daniel review before outreach, audit delivery, proposal, or client communication.

