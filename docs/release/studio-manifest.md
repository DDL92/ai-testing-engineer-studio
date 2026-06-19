# AI Testing Engineer Studio v1 Manifest

Generated: 2026-06-19T01:58:13.280Z

## Architecture Summary
Local TypeScript modules consume local JSON and generated evidence, then produce review-only Markdown, HTML, JSON, PDF, dashboard, and mobile artifacts.

## Major Systems
- Lead Discovery and Qualification
- Revenue Intelligence and Lead Rotation
- Evidence Engine and Evidence Pro
- Client Conversion, Delivery Router, Automation Delivery, and Delivery Assets
- Retainer Operations and Outcome Learning
- Studio Health, Commercial Consistency, Archive Manager, Dashboard, and Mobile Command Center

## Sources Of Truth
- Commercial lead: Revenue Intelligence -> Lead Rotation -> Actionable Lead
- Booked money: `data/finance/finance.json`
- Outcomes: local outcome records entered from real events only
- Clients: local client records

## Revenue Workflow
Discovery -> Qualification -> Evidence -> Rotation -> Revenue Mode -> Manual Action -> Outcome Recording

## Delivery Workflow
Lead -> Client Conversion -> Package -> Delivery Plan -> Evidence -> Assets -> Human Review

## Learning Workflow
Recorded Outcomes -> Revenue Learning -> Bounded Calibration -> Future Recommendations

## Stability Boundary
- Studio v1 remains local-only and human-approved.
- Release Manager generates documentation and validation evidence only.
- No business workflow, command, data source, database, integration, or commercial rule is modified.
- No outreach, messages, meetings, invoices, payments, revenue, or outcomes are created.
