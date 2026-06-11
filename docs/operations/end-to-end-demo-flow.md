# End-To-End Demo Flow

This flow uses the existing `acme-saas-demo` lead and `https://example.com` for a safe public audit target.

## Commands

```sh
npm run lead:research -- --id acme-saas-demo
npm run lead:pack -- --id acme-saas-demo
npm run audit:site -- --url https://example.com
npm run sow:generate -- --id acme-saas-demo
npm run outreach:queue
npm run metrics:revenue
npm run mac:daily
npm run cockpit
```

## Expected Output Files

Research pack:
`output/research/acme-saas-demo-research-pack.md`

Lead pack:
`output/lead-packs/acme-saas-demo.md`

Outbound plan:
`output/outbound/acme-saas-demo-outbound-plan.md`

Audit report:
`output/audits/example-com/audit-report.md`

Audit screenshot evidence:
`output/audits/example-com/homepage.png`

SOW draft:
`output/sows/acme-saas-demo-sow.md`

Outreach queue:
`output/outreach/outreach-queue.md`

Revenue summary:
`output/metrics/revenue-summary.md`

Daily briefing:
`output/daily/daily-briefing.md`

Action cockpit:
`output/cockpit/action-cockpit.md`

## Review Flow

1. Read the research pack to confirm why the lead may be a fit.
2. Read the lead pack and outbound plan.
3. Confirm the message draft is accurate and does not invent facts.
4. Review the audit report and screenshot evidence.
5. Review the SOW draft for price, scope, assumptions, and out-of-scope items.
6. Use the outreach queue to decide the next manual action.
7. Use the cockpit for the current daily view.

## Safety Notes

- No message is sent by this flow.
- No CRM is updated.
- No external APIs are used.
- No credentials are used.
- The audit target should stay public and non-sensitive unless Daniel explicitly approves a different scope.
- Client-facing output requires manual review before use.
