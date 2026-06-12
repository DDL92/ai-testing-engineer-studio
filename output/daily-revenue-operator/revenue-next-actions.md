# Revenue Next Actions

Generated: 2026-06-12T16:59:44.078Z

Priority order: fastest revenue, highest probability, then highest MRR potential.

1. Review follow-up path: PushPress
   - Reason: lead score 8/10; offer boost 18; top 5 outreach lead; research pack exists; lead pack exists; audit pack exists; outreach pack exists; contact review exists; SOW exists; client workflow exists; follow-up signal exists
   - Expected Outcome: Create or review the next local revenue asset without external action.
   - Approval Required: Daniel approval required before external action. No guarantee of conversion or revenue.
   - Command: npm run contact:review -- --id pushpress
2. Move retainer opportunity: ABC Glofox
   - Reason: ABC Glofox has revenue priority 78/100.
   - Expected Outcome: Move one high-fit retainer opportunity to the next local review asset.
   - Approval Required: Daniel approval required before external action. No guarantee of conversion or revenue.
   - Command: npm run lead:research -- --id abc-glofox
3. Advance audit path: Bookee
   - Reason: Audit range is $199-$500 and can support a manually approved next step.
   - Expected Outcome: Prepare a small first-audit path that can be manually reviewed.
   - Approval Required: Daniel approval required before external action. No guarantee of conversion or revenue.
   - Command: npm run lead:research -- --id bookee
4. Refresh commercial pipeline
   - Reason: Revenue action quality depends on the current local pipeline and dashboard files.
   - Expected Outcome: Create or review the next local revenue asset without external action.
   - Approval Required: Daniel approval required before external action. No guarantee of conversion or revenue.
   - Command: npm run pipeline:prioritize
5. Advance PushPress
   - Reason: High probability; $1,500-$3,000/month; Review follow-up context for PushPress before any manual action.
   - Expected Outcome: Prepare the next local asset or review step that could move revenue forward after manual approval.
   - Approval Required: Daniel approval required before outreach, proposal, follow-up, or client-facing use.
   - Command: npm run contact:review -- --id pushpress
6. Advance ABC Glofox
   - Reason: Medium probability; $1,500-$3,000/month; Generate research pack for ABC Glofox.
   - Expected Outcome: Prepare the next local asset or review step that could move revenue forward after manual approval.
   - Approval Required: Daniel approval required before outreach, proposal, follow-up, or client-facing use.
   - Command: npm run lead:research -- --id abc-glofox
7. Advance Bookee
   - Reason: Medium probability; $1,500-$3,000/month; Generate research pack for Bookee.
   - Expected Outcome: Prepare the next local asset or review step that could move revenue forward after manual approval.
   - Approval Required: Daniel approval required before outreach, proposal, follow-up, or client-facing use.
   - Command: npm run lead:research -- --id bookee
8. Advance TeamUp
   - Reason: Medium probability; $1,500-$3,000/month; Generate audit pack for TeamUp.
   - Expected Outcome: Prepare the next local asset or review step that could move revenue forward after manual approval.
   - Approval Required: Daniel approval required before outreach, proposal, follow-up, or client-facing use.
   - Command: npm run audit:pack -- --id teamup

## Approval Rules
- Human approval is required before outreach, follow-up, proposal, SOW, discovery call, client delivery, client report, renewal, expansion, invoice, payment, or external action.
- Revenue Command Center is the source of truth for booked MRR.
- Booked MRR must not include demo, sample, sandbox, test, or example client records.
- No revenue, clients, projections, outcomes, probability, urgency, approvals, or guarantees are invented.
- No APIs, scraping, browsing, CRM, outreach automation, email sending, LinkedIn automation, payment systems, credentials, or external databases were used.
