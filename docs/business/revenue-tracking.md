# Revenue Tracking

Revenue tracking is local JSON only. No paid APIs or external CRM is required.

## Approved Offer Ladder

- QA Audit: $199-$500 one-time
- Playwright Starter Pack: $900-$1,500 one-time
- QA Automation Retainer: $1,500-$3,000/month recurring

## Finance Source Of Truth

```bash
npm run finance:monthly
npm run finance:dashboard
npm run finance:forecast
```

Finance reports read booked money from `data/finance/finance.json`. Revenue is counted only when a finance record has status `booked` or `received`.

## Output Files

- `output/finance/monthly-finance.md`
- `output/finance/finance-dashboard.md`
- `output/finance/finance-forecast.md`
- `output/finance/mrr-tracker.md`
- `output/finance/revenue-opportunities.md`
- `output/finance/savings-plan.md`
- `output/finance/property-progress.md`

## Safety Rules

- Do not claim revenue exists unless it is stored locally.
- Lead candidates and forecast scenarios are not booked revenue.
- Do not process payments, send invoices, create payment links, connect Stripe, connect PayPal, connect banks, move money, or use external finance systems.
