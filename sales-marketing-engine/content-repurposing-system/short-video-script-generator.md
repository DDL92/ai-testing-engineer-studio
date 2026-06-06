# Short Video Script Generator

## Prompt

Create a short video script under 45 seconds.

Inputs:

- Topic:
- Audience:
- Service CTA:

Format:

- Hook.
- Problem.
- Insight.
- CTA.

## 10 Script Templates

1. If your team wants Playwright automation, do not start with 50 tests. Start with the flows that can break a release.
2. A QA automation audit is useful because it tells you what not to automate yet.
3. Your first smoke suite should cover login, dashboard, core action, and API health.
4. AI testing is regression testing for prompts, format, grounding, and safety behavior.
5. Prompt injection testing should be defensive, not performative.
6. RAG testing needs citation accuracy, not just answer quality.
7. Flaky tests often start with weak locators.
8. A starter framework should be simple enough for the team to extend.
9. Manual QA findings should become regression tests.
10. Retainers work best when tied to release cadence.

## Example: Playwright Audit

Hook: Your team probably does not need a huge automation framework first.  
Problem: You need to know which flows are worth automating.  
Insight: A Playwright audit identifies the top risks, smoke scenarios, and first tests.  
CTA: Send your top three flows if you want an audit outline.

## Example: AI Testing

Hook: AI features can regress without throwing errors.  
Problem: The response still works, but quality, grounding, or format breaks.  
Insight: Use prompt regression checks and a quality rubric.  
CTA: Ask for the AI Testing Audit outline.

## Example: Prompt Injection

Hook: Prompt injection testing should be defensive.  
Problem: Many teams test random attacks instead of product risks.  
Insight: Check role boundaries, hidden instruction protection, and data access behavior.  
CTA: Send your AI workflow if you want a safe test matrix.

## Example: Regression Testing

Hook: Every serious production bug should become a regression test.  
Problem: If it stays only in a ticket, it can come back.  
Insight: Convert the bug into preconditions, action, and assertion.  
CTA: Ask for a bug-to-test review.

## Example: CI-Ready Smoke Tests

Hook: CI should not run every test first.  
Problem: Big suites get slow and noisy.  
Insight: Start with a small reliable smoke suite.  
CTA: Ask for a Playwright Starter Framework scope.

