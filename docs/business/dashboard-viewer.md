# Dashboard Viewer

The dashboard viewer is a local-only browser UI for reviewing daily summaries, pipeline status, revenue progress, lead reviews, approval drafts, weekly dashboard output, and QA audit reports.

## Run

```bash
npm run dashboard
```

Then open:

```text
http://localhost:4173
```

## Files It Reads

- `sales-marketing-engine/operator/generated/`
- `sales-marketing-engine/operator/approval-queue/`
- `data/leads/`
- `reports/latest/`
- `reports/leads/`

## What It Does Not Do

- It does not send messages.
- It does not scrape websites.
- It does not call paid APIs.
- It does not use Supabase or OpenAI.
- It does not expose a deployed dashboard.

## Daily Review

Use the Command Center, Revenue, Pipeline, Approval Queue, and Lead Reviews pages to decide what to enrich, audit, send manually, close, or convert.

## Weekly Review

Use the Weekly page every Monday to review bottlenecks, conversion metrics, lost reasons, and the next 10 highest-value actions.

## Safety Limitations

This is local-only and has no authentication. Run it on Daniel's machine, not on a public server.

## Future Options

- Supabase for durable CRM storage.
- OpenAI for copy improvement after human review.
- n8n notifications.
- Deployed dashboard.
- Authentication.
