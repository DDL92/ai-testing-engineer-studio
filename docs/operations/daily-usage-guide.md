# Daily Usage Guide

This system is designed to help Daniel run a local-first QA Automation business without using Codex every day. Codex improves the machine; the machine runs the daily work through local commands.

## Daily Workflow

Recommended daily commands:

```sh
npm run mac:daily
npm run cockpit
npm run outreach:queue
```

Manual flow:

1. Review cockpit.
2. Pick the top lead or top follow-up.
3. Generate a research pack.
4. Generate a lead pack.
5. Review the outbound plan.
6. Manually research the contact.
7. Manually send an approved message only after review.
8. Track follow-up manually.
9. Generate an audit if the lead is appropriate.
10. Generate a SOW if the lead is qualified.

## 30-Minute Version

Use this when time is limited.

1. Run `npm run mac:daily`.
2. Run `npm run cockpit`.
3. Run `npm run outreach:queue`.
4. Pick one top lead.
5. Run `npm run lead:research -- --id lead_id`.
6. Run `npm run lead:pack -- --id lead_id`.
7. Review the outbound plan and decide the next manual action.

Output goal:

- One reviewed lead.
- One clear next manual action.
- No automatic outreach.

## 60-Minute Version

Use this when Daniel has time for deeper revenue work.

1. Run `npm run mac:daily`.
2. Run `npm run cockpit`.
3. Run `npm run outreach:queue`.
4. Pick the top lead or follow-up.
5. Run `npm run lead:research -- --id lead_id`.
6. Run `npm run lead:pack -- --id lead_id`.
7. Manually research the contact and confirm fit.
8. If appropriate, run `npm run audit:site -- --url https://example.com`.
9. If qualified and audit evidence exists, run `npm run sow:generate -- --company CompanyName`.
10. Update lead status, follow-up date, or notes manually in local data.

Output goal:

- One lead moved forward.
- One audit or proposal path clarified.
- Follow-up tracked manually.
- No automatic outreach.

## Safety Rules

- Do not auto-send outreach.
- Do not scrape or enrich private contact data.
- Do not use credentials.
- Do not submit forms.
- Do not test payment flows.
- Daniel approves every outreach message, proposal, report, and client communication.
- Generated outputs are drafts until reviewed.
