# Known Warnings

Generated: 2026-06-12T16:43:20.573Z

- Demo/sample client fee records exist and are excluded from booked revenue: 2.
- Excluded non-commercial active client has local monthlyFee $2,000: Demo Retainer SaaS.
- Legacy cockpit overlap exists: `npm run cockpit` remains alongside `npm run cockpit:daily`.
- Legacy dashboard overlap exists: `npm run dashboard` remains alongside `npm run os:dashboard`.
- client command family overlap exists: 9 client:* commands need manual ownership review before any cleanup.
- lead command family overlap exists: 24 lead:* commands need manual ownership review before any cleanup.
- operator command family overlap exists: 9 operator:* commands need manual ownership review before any cleanup.
- output/dashboard/commercial-dashboard.md: older dashboard surface may overlap with Operator OS Dashboard
- output/dashboard/commercial-revenue-visibility.md: revenue-like report should defer booked MRR to Revenue Command Center
- output/dashboard/dashboard.html: older dashboard surface may overlap with Operator OS Dashboard
- output/dashboard/dashboard.md: older dashboard surface may overlap with Operator OS Dashboard
- output/dashboard/revenue-visibility.md: revenue-like report should defer booked MRR to Revenue Command Center
- output/metrics/revenue-summary.md: revenue-like report should defer booked MRR to Revenue Command Center
- output/pipeline-prioritization/top-10-revenue-opportunities.md: revenue-like report should defer booked MRR to Revenue Command Center

## Handling
- Do not remove overlapping commands during the v1.0 candidate package unless a replacement is already validated.
- Keep demo/sample client fee records excluded from booked revenue.
- Treat warnings as manual review items, not blockers unless they become revenue consistency issues.
