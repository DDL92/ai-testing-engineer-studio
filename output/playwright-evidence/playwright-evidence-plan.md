# Playwright Evidence Plan

## Current State

- Opportunity, audit pack, evidence, and evidence-capture outputs exist locally.
- Playwright evidence collection is not implemented.
- No target company Playwright execution is approved by this plan.

## Future Evidence Types

- homepage-evidence
- navigation-evidence
- form-evidence
- cta-evidence
- mobile-evidence
- console-evidence
- network-evidence
- user-flow-evidence

## Allowed Future Flows

- Homepage
- Navigation
- Demo Request
- Contact Form
- Pricing
- Booking
- Scheduling
- Signup
- Onboarding

## Target Priorities

| Rank | Company | Readiness | Recommended First Flow | Research Gaps |
| --- | --- | --- | --- | --- |
| 1 | PushPress | Partially Ready | Demo Request | None |
| 2 | TeamUp | Partially Ready | Booking | None |
| 3 | Glofox / ABC Fitness | Partially Ready | Demo Request | None |
| 4 | Wodify | Not Ready | Scheduling | Missing Contact; Missing Product Contact; Missing Engineering Contact |

## Future Execution Design

Command documented only:

```sh
npm run evidence:playwright-run -- --company PushPress
```

Inputs:
- Company name from local target list.
- Human-approved public URL and flow scope.
- Safety checklist approval before execution.
- Storage destination under data/evidence/playwright/.

Outputs:
- Future standardized Playwright evidence records.
- Future supporting files only when explicitly approved.
- Future local Markdown summary for audit support.

Approval Requirements:
- Daniel approval before any execution.
- Approved public page scope only.
- No login, account creation, payment, or authenticated areas.

Storage Location:
- data/evidence/playwright/screenshots/
- data/evidence/playwright/traces/
- data/evidence/playwright/reports/
- data/evidence/playwright/flows/
- data/evidence/playwright/observations/

Expected Evidence Types:
- homepage-evidence
- navigation-evidence
- form-evidence
- cta-evidence
- mobile-evidence
- console-evidence
- network-evidence
- user-flow-evidence

## Readiness Categories

| Category | Value | Reason |
| --- | --- | --- |
| Framework Readiness | Partially Ready | Evidence Capture Framework and standard evidence contracts exist, but no runner is implemented. |
| Storage Readiness | Partially Ready | Future Playwright storage folders are prepared, but no evidence files should exist yet. |
| Evidence Readiness | Partially Ready | Existing evidence reports identify target readiness, but Playwright evidence has not been collected. |
| Audit Readiness | Partially Ready | Audit packs and evidence summaries exist, but Playwright evidence is not available yet. |
| Execution Readiness | Not Ready | No human-approved Playwright execution runner, target approval gate, or capture workflow exists yet. |

## Safety Notes

- No login automation
- No account creation
- No payment flows
- No authenticated areas
- No scraping
- No aggressive crawling
- No rate abuse
- No private data
- No credentials
- Human approval required
