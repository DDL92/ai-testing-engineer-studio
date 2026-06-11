# Outreach Operating System

This system supports manual, review-first outreach for QA Automation services. Nothing is sent automatically.

## Morning Review

1. Open `sales-marketing-engine/operator/generated/daily-lead-summary.md`.
2. Open `sales-marketing-engine/operator/generated/pipeline-summary.md`.
3. Review proposal and follow-up drafts in `sales-marketing-engine/operator/approval-queue`.
4. Enrich missing contact details manually when appropriate.
5. Send approved outreach manually.
6. Record sent outreach with `lead:sent`.

## Manual Commands

```bash
npm run lead:enrich -- --id <leadId> --email "founder@example.com"
npm run lead:audit -- --id <leadId>
npm run lead:sent -- --id <leadId> --channel linkedin --note "Sent first DM"
npm run lead:followups:due
npm run lead:pipeline
```

## Revenue Goal Support

The operating system keeps Daniel focused on the actions that move leads toward paid audits, starter packs, and monthly retainers. The target remains $3,000-$5,000/month through a mix of setup projects and recurring QA maintenance.
