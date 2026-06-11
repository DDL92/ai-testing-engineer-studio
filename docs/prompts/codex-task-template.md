# Codex Task Template

## Goal

State the exact result Codex should produce.

## Business Reason

Explain why this work matters for the AI Testing Engineer Studio business, revenue, delivery quality, or operating efficiency.

## Scope

Define the boundaries of the task. Keep the scope small enough to review in one pass.

## Allowed Files

List exact files or folders Codex may create or edit.

```md
- docs/example.md
- apps/example-module/src/**
```

## Do Not Touch

List files, folders, or systems that must remain unchanged.

```md
- .env
- package-lock.json
- data/client/**
- apps/unrelated/**
```

## Implementation Requirements

Describe the required behavior, architecture, naming, data shape, documentation expectations, and quality bar.

## Commands To Run

List the validation commands Codex should run after making changes.

```sh
git status --short
npm run typecheck
```

## Acceptance Criteria

Define what must be true before the task is complete.

- The requested files exist.
- The implementation follows the allowed scope.
- Validation commands pass or any failures are clearly explained.
- No credentials, tokens, or private client data are introduced.

## Safety Constraints

List business and technical constraints.

- Do not install packages unless explicitly approved.
- Do not send outreach, proposals, emails, DMs, or client messages.
- Do not use real client credentials.
- Do not modify production client systems.
- Require human approval before external communication or production-impacting actions.

## Expected Output Summary

Ask Codex to summarize:

- Files changed
- Key decisions made
- Commands run
- Validation results
- Issues or assumptions
- Recommended next action

## Example Future Task: Lead Tracker Sprint

Goal:
Create the first local Lead Tracker documentation and data model for manually tracking prospects.

Business Reason:
Daniel needs a simple local system to identify, score, and review potential QA Automation leads without using a paid CRM or automating outreach.

Scope:
Documentation and sample data shape only. Do not implement runtime code in this sprint.

Allowed Files:

```md
- docs/business/lead-tracker.md
- data/leads/manual-leads.example.json
```

Do Not Touch:

```md
- apps/**
- package.json
- package-lock.json
- .env
- data/leads/*.json except data/leads/manual-leads.example.json
```

Implementation Requirements:

- Define lead fields such as company, website, source, problem signal, QA relevance, score, status, next action, and notes.
- Define a simple scoring model from 0 to 100.
- Include statuses such as new, reviewed, qualified, rejected, contacted, call booked, proposal sent, won, and lost.
- Make clear that outreach remains manual and requires human approval.
- Use fake example data only.

Commands To Run:

```sh
git status --short
find docs -maxdepth 3 -type f | sort
find data -maxdepth 3 -type f | sort
```

Acceptance Criteria:

- Lead Tracker documentation explains how Daniel should review and score leads.
- Example data contains no real client information.
- No runtime logic is changed.
- No outreach is sent or automated.

Safety Constraints:

- Do not install packages.
- Do not add CRM integrations.
- Do not add scraping.
- Do not automate message sending.
- Human approval is required before any contact with a lead.

Expected Output Summary:

- Files created
- Lead fields and scoring decisions documented
- Commands run
- Any assumptions or follow-up recommendations
