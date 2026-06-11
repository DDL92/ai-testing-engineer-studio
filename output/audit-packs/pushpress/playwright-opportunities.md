# Playwright Opportunities: PushPress

## Best First Playwright Scenarios

- Homepage smoke test: load the approved URL, verify title or main landmark, and capture evidence on failure.
- Navigation smoke test: verify critical links or navigation landmarks are visible before clicking deeper flows.
- Mobile viewport smoke test: verify critical public flows at one approved mobile viewport.
- Regression smoke suite: cover the smallest repeatable set of high-value checks before each release.
- Payment-adjacent smoke test: validate visible payment flow entry points without using real payment data.

## Audit-Derived Opportunities

- Automation opportunity: homepage smoke coverage: Recommended next step: create a minimal Playwright Starter Pack only after Daniel approves the audit scope.
- Automation opportunity: navigation and link visibility: Recommended manual review: identify critical navigation links before adding non-destructive Playwright checks.
- Smoke tests: validate homepage load, title, visible content, and screenshot evidence.
- CI/CD validation: run approved smoke tests in CI once the first stable Playwright checks exist.

## Research-Derived Opportunities

- Suggested opportunity: Playwright smoke suite for critical happy paths.
- Suggested opportunity: regression suite for repeatable release confidence.
- Suggested opportunity: cross-browser coverage for approved high-value flows.
- Suggested opportunity: mobile viewport coverage for important conversion flows.

## Implementation Standards

- Use Playwright + TypeScript with Page Object Model separation.
- Use Arrange-Act-Assert in test files.
- Prefer getByRole, getByLabel, getByPlaceholder, and data-testid before locator.
- Avoid hard waits and brittle nth() selectors.
- Run locally first, then add CI only after stable smoke coverage exists.

## Human Approval Required

- Daniel must review and approve this document before it is sent, quoted, copied into a proposal, or used in client communication.
- Do not send outreach from this command.
- Do not add claims from scraping, APIs, private credentials, or unreviewed screenshots.
- Use this as a local draft until manually approved.
