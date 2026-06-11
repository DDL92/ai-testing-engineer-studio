# Automation Roadmap: PushPress

## Phase 1: Audit Pack Delivery

- Review local lead data, research pack, audit report, and screenshot evidence.
- Deliver a concise QA risk summary with confirmed evidence only.
- Identify 1-3 safe smoke-test candidates for a follow-up Playwright scope.

## Phase 2: Playwright Starter Scope

- Create a small Playwright + TypeScript smoke suite for approved public or staging-safe flows.
- Use clean page objects and stable locators.
- Capture trace, screenshots, and HTML report on failure.
- Keep coverage narrow enough to deliver quickly and maintain confidence.

## Phase 3: CI/CD Readiness

- Run smoke checks in CI after local stability is proven.
- Document required environment variables with placeholders only.
- Avoid real client credentials in code, logs, reports, and screenshots.
- Track flaky behavior separately from confirmed product issues.

## Phase 4: Retainer Expansion

- Start with a paid audit pack and manual findings review.
- Convert confirmed opportunities into a small Playwright Starter Pack.
- Pitch monthly QA automation support only after recurring release risk is confirmed.
- Use regression coverage as the clearest retainer expansion angle.

## Suggested Next Local Commands

- npm run lead:research -- --id pushpress
- npm run audit:site -- --url https://www.pushpress.com
- npm run audit:pack -- --id pushpress
- npm run sow:generate -- --id pushpress

## Human Approval Required

- Daniel must review and approve this document before it is sent, quoted, copied into a proposal, or used in client communication.
- Do not send outreach from this command.
- Do not add claims from scraping, APIs, private credentials, or unreviewed screenshots.
- Use this as a local draft until manually approved.
