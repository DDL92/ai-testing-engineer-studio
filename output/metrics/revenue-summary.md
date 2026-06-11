# AI Studio OS Revenue Summary

## Snapshot

- Generated at: 2026-06-11T05:45:23.162Z
- Total leads: 50
- Active clients: 2
- Estimated MRR from active retainer clients: $2,000
- At-risk clients: 0

## Lead Pipeline

- new: 49
- reviewing: 0
- audit-ready: 0
- contacted: 0
- call-booked: 0
- proposal-sent: 0
- won: 0
- lost: 0
- paused: 1

Top 5 scored leads:

1. ABC Glofox - 10/10 - new - agency-partner-retainer
2. Bookee - 10/10 - new - agency-partner-retainer
3. Bsport - 10/10 - new - agency-partner-retainer
4. Fitli - 10/10 - new - agency-partner-retainer
5. Momence - 10/10 - new - agency-partner-retainer

## Client Revenue

Clients by service type:

- qa-audit: 0
- playwright-starter-pack: 1
- qa-automation-retainer: 1
- agency-partner-retainer: 0

Clients by status:

- active: 2
- paused: 0
- completed: 0
- at-risk: 0

Active clients:

- Demo Retainer SaaS: qa-automation-retainer, $2,000/month recorded fee
- Demo Starter Marketplace: playwright-starter-pack, $0/month recorded fee

## MRR Estimate

- Estimated MRR: $2,000
- Source: active clients with service type qa-automation-retainer or agency-partner-retainer.
- Rule: uses monthlyFee from data/clients.json only when present.

## One-Time Opportunity Estimate

- Estimated one-time lead opportunity range: $12,790-$23,000
- This is an estimate from current lead recommendedOffer values, not booked revenue.
- Standard ranges used: QA Audit $199-$500; Playwright Starter Pack $900-$1,500.

## Retainer Opportunity Estimate

- Estimated monthly retainer lead opportunity range: $39,000-$78,000/month
- This is an estimate from current lead recommendedOffer values, not booked MRR.
- Standard ranges used: QA Automation Retainer $1,500-$3,000/month; Agency Partner Retainer $1,500-$3,000/month.

Retainer opportunities:

- ABC Glofox: 10/10, agency-partner-retainer
- Bookee: 10/10, agency-partner-retainer
- Bsport: 10/10, agency-partner-retainer
- Fitli: 10/10, agency-partner-retainer
- Momence: 10/10, agency-partner-retainer

## Top Revenue Actions

1. Protect active retainer: Demo Retainer SaaS
   - Reason: Active MRR should get recurring proof of value and risk visibility.
   - Suggested command: npm run client:report -- --id demo-retainer-client
2. Move retainer opportunity forward: ABC Glofox
   - Reason: ABC Glofox has score 10/10 and agency-partner-retainer fit.
   - Suggested command: npm run lead:pack -- --id abc-glofox
3. Prepare proposal path: ABC Glofox
   - Reason: Top scored leads should move from review to audit or SOW only after manual approval.
   - Suggested command: npm run sow:generate -- --id abc-glofox
4. Review daily revenue plan
   - Reason: Daily planning keeps lead, audit, proposal, and retainer work sequenced.
   - Suggested command: npm run day:plan

## Risks

- Revenue estimates are based only on local JSON data and are not booked revenue unless represented by active client monthlyFee.
- Lead opportunity ranges require manual qualification, discovery, and approval before proposals are sent.
- At-risk clients should be reviewed before assuming retention.
- No bank, invoice, payment processor, CRM, API, or external source is connected.

## Recommended Next Commands

- npm run day:plan
- npm run lead:pack -- --id lead_id
- npm run audit:site -- --url https://example.com
- npm run sow:generate -- --id lead_id
- npm run client:report -- --id client_id

## Manual Review Note

- Review this summary before using it for business decisions.
- Do not treat lead opportunity ranges as booked revenue.
- Do not send outreach, proposals, or client updates without Daniel approval.
- Use only local data unless additional research is explicitly approved.
