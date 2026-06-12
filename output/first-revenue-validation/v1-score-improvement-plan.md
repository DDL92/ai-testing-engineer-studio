# v1 Score Improvement Plan

Generated: 2026-06-12T17:23:54.582Z

## Current Score
94/100 reported by Sprint 49 and current release package.

## Target Score
100/100 for v1.0 stable readiness.

## What Improves Score Technically
- Label legacy dashboard and cockpit commands as deprecated while keeping working replacements documented.
- Group large command families under source-of-truth command categories.
- Document Revenue Command Center as the booked MRR source for every revenue-like report.
- Keep generated v1 and first-revenue reports from creating self-referential release warnings.

## What Improves Score Commercially
- Validate one real first-audit path with PushPress before building more infrastructure.
- Record first audit sale only when Daniel manually confirms a real commercial engagement.
- Convert audit evidence into retainer discussion only after discovery/audit evidence supports it.

## Remaining Blockers
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
- Booked MRR is still $0.
- First outreach path still requires Daniel approval before any send.

## Recommended v1.0 Stable Criteria
- Release score reaches 100/100 after warnings are labeled, grouped, or resolved.
- No critical issues.
- Revenue reports consistently defer booked MRR to Revenue Command Center.
- PushPress first-client path has manual contact decision, approved message, and tracked follow-up plan.
- No invented revenue, contacts, findings, claims, or external actions.

## Manual Approval Reminder
- Human approval is required before outreach, follow-up, proposal, SOW, discovery call, audit delivery, retainer discussion, invoice, payment, or external action.
- This pack is local-only and uses existing Studio data and generated reports.
- No APIs, scraping, browsing, CRM, outreach automation, sending, payments, credentials, or external databases were used.
- Do not invent contacts, audit findings, private company facts, revenue, client outcomes, or unsupported claims.
- Opportunities are not booked revenue until a real commercial local client record exists.
