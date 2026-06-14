# Autonomous Runner Plan

Generated: 2026-06-14T01:52:21.274Z

Schedule: Monday-Friday at 07:00 America/Costa_Rica
Next Scheduled Run: 2026-06-15T13:00:00.000Z (07:00 America/Costa_Rica)

## Execution Order
1. npm run web:lead-discovery - Refresh public Tavily lead discovery.
2. npm run web:pain-mining - Refresh public Tavily pain signals.
3. npm run web:lead-normalize - Normalize raw web lead titles into company records.
4. npm run web:lead-classify - Classify normalized leads by SaaS category.
5. npm run web:lead-qualify - Score normalized leads for qualification.
6. npm run web:qualified-ranking - Generate final qualified web lead ranking.
7. npm run revenue:focus - Refresh the first-revenue focus report.
8. npm run day:plan - Refresh the daily revenue operating plan.
9. npm run dashboard:generate - Regenerate the read-only dashboard data.
10. npm run mobile:summary - Regenerate the mobile command center summary.

## Safety Rules
- No outreach is sent.
- No emails or LinkedIn messages are sent.
- No CRM records, meetings, invoices, payments, revenue, or client activity are created.
- Only existing local Studio commands are executed.
- Human approval is required before any external business action.
