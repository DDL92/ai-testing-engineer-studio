# Client Operations Center

Generated: 2026-06-12T16:42:46.392Z

## Commercial Mode

- Commercial Mode status: ON
- Commercial leads: 43
- Excluded demo leads: 8
- Commercial opportunities: 43
- Commercial next actions: 10

## Executive Summary

- Active clients: 2
- Active opportunities: 43
- Follow-ups needing manual review: 1
- Client-ready opportunities: 0
- Pipeline report detected: yes
- Top opportunities report detected: yes

## Today's Operating Priorities

1. PushPress
   - Stage: FOLLOW_UP
   - Score: 100
   - Action: Review contact follow-up context and decide whether to send manually.
   - Command: npm run contact:review -- --id pushpress
   - Approval: Human approval required before external action. This recommendation only points to local commands.
2. ABC Glofox
   - Stage: NEW_LEAD
   - Score: 65
   - Action: Generate research pack for ABC Glofox.
   - Command: npm run lead:research -- --id abc-glofox
   - Approval: Human approval required before external action. This recommendation only points to local commands.
3. Bookee
   - Stage: NEW_LEAD
   - Score: 65
   - Action: Generate research pack for Bookee.
   - Command: npm run lead:research -- --id bookee
   - Approval: Human approval required before external action. This recommendation only points to local commands.
4. Bsport
   - Stage: NEW_LEAD
   - Score: 65
   - Action: Generate research pack for Bsport.
   - Command: npm run lead:research -- --id bsport
   - Approval: Human approval required before external action. This recommendation only points to local commands.
5. Fitli
   - Stage: NEW_LEAD
   - Score: 65
   - Action: Generate research pack for Fitli.
   - Command: npm run lead:research -- --id fitli
   - Approval: Human approval required before external action. This recommendation only points to local commands.

## Pipeline Health

- Active opportunities: 43
- Follow-ups: 1
- Client-ready: 0
- New leads needing research: 38

## Opportunities Closest To Revenue

- PushPress: score 100, stage FOLLOW_UP, offer qa-automation-retainer; Monitor manually for follow-up on 2026-06-15.

## Follow-Ups

- PushPress: score 100, stage FOLLOW_UP, offer qa-automation-retainer; Monitor manually for follow-up on 2026-06-15.

## Client Prep Needed

- No opportunities currently need client prep.

## Delivery Prep Needed

- No opportunities currently need delivery prep.

## Reporting Needed

- Demo Retainer SaaS: run npm run client:report -- --id demo-retainer-client; last report 2026-06-08.
- Demo Starter Marketplace: run npm run client:report -- --id demo-starter-client; last report 2026-06-07.

## Risks / Blockers

- Follow-up dates require manual review before any message is sent.
- Do not treat local opportunity scores as guaranteed revenue.

## Recommended Commands

- npm run pipeline:opportunities
- npm run dashboard
- npm run contact:review -- --id pushpress
- npm run lead:research -- --id abc-glofox
- npm run lead:research -- --id bookee
- npm run lead:research -- --id bsport
- npm run lead:research -- --id fitli
- npm run client:report -- --id demo-retainer-client

## Manual Approval Rules

- Daniel approves every outreach, follow-up, proposal, call, client report, invoice, and delivery action.
- Do not send emails, LinkedIn messages, contact-form messages, proposals, reports, or invoices from this command.
- Do not scrape, browse, call APIs, use credentials, connect CRMs, connect payment systems, or use external databases.
- Treat all recommendations as local planning output until manually reviewed.
