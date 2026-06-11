# Loop Based Operator System

## Core Architecture

The AI Studio OS should operate through small local loops:

```text
Input
-> Execution
-> Validation
-> Report
-> Recommended Next Action
-> Human Approval
```

Each loop should accept a clear input, run a repeatable local process, produce evidence or a decision artifact, recommend the next action, and stop before any risky external step.

Human approval is required before outreach, proposals, client communication, paid tool usage, production-impacting work, or any action involving real credentials or private client systems.

## First Revenue Loop

The first revenue loop is:

```text
Lead -> Audit -> Proposal -> Retainer -> Monthly Report -> Renewal
```

This loop keeps the business focused on selling and delivering productized QA Automation services before building broader dashboards or complex automation.

## Future Loops

### day:plan

Purpose:
Create a focused daily operating plan for lead review, audit work, proposals, follow-ups, delivery, and admin.

Input:
Local notes, current pipeline status, active client work, and business priorities.

Output:
A short daily plan with prioritized actions, time blocks, and recommended next steps.

Human approval point:
Daniel chooses which actions to execute.

Revenue relevance:
Keeps work aligned to lead generation, sales follow-up, paid delivery, and retention.

What should NOT be automated:
Do not automatically contact leads, change client commitments, or reschedule calls.

### lead:pack

Purpose:
Prepare a small batch of qualified lead opportunities for manual review.

Input:
Approved local lead sources, manually provided URLs, job posts, public company pages, or fake/demo data.

Output:
A lead pack with company context, QA pain signals, relevance score, suggested offer fit, and manual next action.

Human approval point:
Daniel reviews each lead before any outreach.

Revenue relevance:
Feeds the top of the Lead -> Audit -> Proposal -> Retainer loop.

What should NOT be automated:
Do not perform aggressive scraping, bypass site rules, enrich private contact data, or send automated messages.

### audit:site

Purpose:
Generate a QA Audit Pack with evidence from Playwright checks, Lighthouse snapshots, accessibility observations, and manual QA notes.

Input:
Approved target URL, test scope, browser/device profile, and audit checklist.

Output:
Evidence folder, screenshots, trace or video when relevant, Lighthouse result, QA findings, and recommended fixes.

Human approval point:
Daniel approves the target, scope, and final report before sending it externally.

Revenue relevance:
Creates paid discovery value and supports proposals for automation work or retainers.

What should NOT be automated:
Do not test production client systems without explicit approval. Do not use credentials unless provided securely for the approved scope.

### call:prep

Purpose:
Prepare for discovery calls with a concise brief.

Input:
Lead notes, website, audit findings, known pain points, offer fit, and meeting context.

Output:
Call agenda, qualification questions, risk notes, offer recommendation, and next-step options.

Human approval point:
Daniel reviews the brief before the call.

Revenue relevance:
Improves discovery quality and helps convert audits into proposals.

What should NOT be automated:
Do not join calls, make commitments, or send calendar messages automatically.

### sow:generate

Purpose:
Draft a proposal or statement of work for a reviewed opportunity.

Input:
Discovery notes, audit findings, selected offer, timeline, scope, assumptions, and pricing guidance.

Output:
Draft proposal or SOW with scope, deliverables, timeline, exclusions, pricing, and approval notes.

Human approval point:
Daniel reviews and edits before sending to a client.

Revenue relevance:
Turns qualified opportunities into paid work.

What should NOT be automated:
Do not send proposals automatically, create binding commitments, or change pricing without review.

### client:weekly-report

Purpose:
Create a lightweight weekly progress update for active clients.

Input:
Completed work, test results, blockers, evidence links, open risks, and next-week priorities.

Output:
Weekly client report in markdown or HTML.

Human approval point:
Daniel approves the report before sending.

Revenue relevance:
Improves client trust, retention, and upsell opportunities.

What should NOT be automated:
Do not send client updates automatically or expose private evidence without review.

### client:monthly-report

Purpose:
Produce a monthly retainer report showing delivered value, test coverage, defects found, risk reduction, and next recommendations.

Input:
Weekly reports, audit evidence, Playwright results, Lighthouse snapshots, issue summaries, and client goals.

Output:
Monthly retainer report with outcomes, evidence, trend summary, and renewal or next-month recommendation.

Human approval point:
Daniel approves the report and renewal recommendation before sending.

Revenue relevance:
Supports recurring revenue, retention, renewals, and scope expansion.

What should NOT be automated:
Do not send renewal messages, change retainer scope, or invoice clients automatically.

### finance:monthly

Purpose:
Summarize monthly revenue, expenses, pipeline value, and progress toward income targets.

Input:
Local revenue tracker, invoice notes, expense notes, proposal status, and closed-won work.

Output:
Monthly finance summary with revenue, expected revenue, gaps, and recommended focus.

Human approval point:
Daniel reviews before making business decisions.

Revenue relevance:
Keeps the business focused on the path from $3,000-$5,000/month toward $7,000-$10,000/month.

What should NOT be automated:
Do not connect bank accounts, file taxes, send invoices, or make purchases automatically.

### property:progress

Purpose:
Track progress on property-related goals without mixing them into client delivery workflows.

Input:
Manual notes, milestones, costs, documents, and next actions.

Output:
Progress summary, open tasks, risks, and next action recommendation.

Human approval point:
Daniel reviews all decisions and next actions.

Revenue relevance:
Indirect relevance through personal financial planning and long-term stability.

What should NOT be automated:
Do not sign documents, submit forms, send payments, or contact third parties automatically.

### content:from-audits

Purpose:
Convert anonymized QA lessons and audit patterns into content ideas.

Input:
Approved audit notes, generic issue patterns, public examples, and sanitized findings.

Output:
LinkedIn posts, short video outlines, carousel ideas, or article drafts.

Human approval point:
Daniel reviews every content piece before publishing.

Revenue relevance:
Supports authority building and inbound lead generation.

What should NOT be automated:
Do not publish content automatically, mention clients without permission, or expose confidential details.

### mac:daily

Purpose:
Run local daily operating commands on Daniel's Mac with minimal manual setup.

Input:
Approved npm scripts, local files, and daily schedule.

Output:
Generated local briefs, reports, lead packs, or reminders.

Human approval point:
Daniel decides what to run and approves any external action.

Revenue relevance:
Reduces operating friction and keeps business routines consistent.

What should NOT be automated:
Do not add background agents that send messages, access private services, install tools, or perform risky actions without approval.

## Design Principles

- Keep loops local-first.
- Keep outputs reviewable.
- Prefer markdown, HTML, JSON, and CSV before databases.
- Prefer npm scripts before dashboards.
- Prefer human approval before external impact.
- Build revenue loops before operational dashboards.
- Avoid paid services until there is a clear business reason and explicit approval.
