# Disaster Recovery Guide

Generated: 2026-06-13T20:49:55.325Z

## GitHub Recovery
- Clone the repository from GitHub.
- Run npm install.
- Restore any intentionally backed-up local data and output folders.
- Run npm run studio:recovery-check.

## Machine Migration
- Copy repo folder or clone from GitHub.
- Preserve data/ and output/ if generated local history matters.
- Regenerate dashboard with npm run dashboard:generate.
- Validate with npm run typecheck and npm test.

## Backup Strategy
- Commit source, docs, dashboard assets, and safe local JSON templates.
- Back up data/ and output/ when local operating history matters.
- Do not back up secrets, credentials, .env files, private client credentials, or sensitive screenshots.

## Critical Files
- package.json
- tsconfig.json
- README.md
- docs/operations/command-reference.md
- src
- data
- output
- dashboard/index.html
- dashboard/app.js
- dashboard/styles.css
- dashboard/manifest.json
- dashboard/dashboard.json
- data/finance/finance.json
- data/outcomes/outcomes.json
- output/executive/pushpress-executive-summary.md
- output/client-audit-reports/pushpress-qa-audit-report.pdf
- output/proposals/pushpress-proposal.pdf
- output/messages/pushpress-message-pack.md
- output/hardening/monday-launch-checklist.md

## Validation Checklist
- [ ] npm install
- [ ] npm run studio:recovery-check
- [ ] npm run dashboard:generate
- [ ] npm run typecheck
- [ ] npm test

## Safety Rules
- Read-only documentation and recovery planning only.
- Do not send outreach.
- Do not send emails.
- Do not create meetings.
- Do not create invoices.
- Do not create payments.
- Do not modify financial records.
- Do not modify outcome records.
