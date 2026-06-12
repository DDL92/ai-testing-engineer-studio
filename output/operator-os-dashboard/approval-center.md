# Approval Center

Generated: 2026-06-12T16:42:27.968Z

1. PushPress
   - Category: outreach review
   - Reason: Review follow-up context for PushPress before any manual action.
   - Command: npm run contact:review -- --id pushpress
   - Approval Required: Daniel must approve whether to follow up manually. Nothing is sent automatically.
2. ABC Glofox
   - Category: revenue review
   - Reason: Medium probability; Generate research pack for ABC Glofox.
   - Command: npm run lead:research -- --id abc-glofox
   - Approval Required: Human approval only. Review scope, evidence, message, pricing, and next step before external action.
3. Bookee
   - Category: revenue review
   - Reason: Medium probability; Generate research pack for Bookee.
   - Command: npm run lead:research -- --id bookee
   - Approval Required: Human approval only. Review scope, evidence, message, pricing, and next step before external action.
4. TeamUp
   - Category: audit review
   - Reason: Medium probability; Generate audit pack for TeamUp.
   - Command: npm run audit:pack -- --id teamup
   - Approval Required: Human approval only. Review scope, evidence, message, pricing, and next step before external action.
5. Wodify
   - Category: audit review
   - Reason: Medium probability; Generate audit pack for Wodify.
   - Command: npm run audit:pack -- --id wodify
   - Approval Required: Human approval only. Review scope, evidence, message, pricing, and next step before external action.
6. Bsport
   - Category: revenue review
   - Reason: Medium probability; Generate research pack for Bsport.
   - Command: npm run lead:research -- --id bsport
   - Approval Required: Human approval only. Review scope, evidence, message, pricing, and next step before external action.
7. Fitli
   - Category: revenue review
   - Reason: Medium probability; Generate research pack for Fitli.
   - Command: npm run lead:research -- --id fitli
   - Approval Required: Human approval only. Review scope, evidence, message, pricing, and next step before external action.
8. Momence
   - Category: revenue review
   - Reason: Medium probability; Generate research pack for Momence.
   - Command: npm run lead:research -- --id momence
   - Approval Required: Human approval only. Review scope, evidence, message, pricing, and next step before external action.
9. Booked revenue verification
   - Category: revenue review
   - Reason: Revenue Command Center reports $0 booked MRR after demo/sample exclusions.
   - Command: npm run revenue:daily
   - Approval Required: Daniel must verify any real client before recording booked revenue.

## Rules
- Never auto-approve.
- Human approval only.
- Human approval is required before outreach, follow-up, proposal, SOW, discovery call, client delivery, client report, renewal, expansion, invoice, payment, or external action.
- Never auto-approve.
- No outreach is sent from this dashboard.
- No CRM is connected or updated.
- No APIs, scraping, browsing, external databases, credentials, payments, invoices, or sending workflows were used.
- Revenue values use Revenue Command Center as the source of truth.
