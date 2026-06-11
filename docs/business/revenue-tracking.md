# Revenue Tracking

Revenue tracking is local JSON only. No paid APIs or external CRM is required.

## Offer Ladder

- Free Mini QA Audit: $0 one-time
- Detailed QA Audit: $199 one-time
- Playwright Starter Pack: $900 one-time
- QA Automation Setup: $1,500 one-time
- Monthly QA Maintenance: $1,000/month recurring
- Custom: manually provided

## Mark A Lead Won

```bash
npm run lead:convert -- --id <leadId> --offer monthly_qa_maintenance --amount 1000 --note "Client agreed to monthly QA maintenance"
```

This updates the lead to `won`, writes `conversions.json`, updates `clients.json`, and adds projected MRR or one-time revenue.

## Revenue Summary

```bash
npm run revenue:summary
```

Review `sales-marketing-engine/operator/generated/revenue-summary.md` for MRR, one-time revenue this month, goal progress, pipeline value, and top revenue opportunities.
