# Dashboard Viewer

Local-only browser dashboard for reviewing AI Testing Engineer Studio business artifacts.

## Run

```bash
npm run dashboard
```

Open:

```text
http://localhost:4173
```

## Check

```bash
npm run dashboard:check
```

## Action Cockpit

Generate cockpit data before opening the dashboard:

```bash
npm run actions:cockpit
```

The `/actions` page reads `data/leads/action-cockpit.json` and `sales-marketing-engine/operator/generated/action-cockpit.md`, then shows the executive summary, top ranked actions, grouped actions, blocked leads, command snippets, and links to related reviews, drafts, audits, pipeline, and revenue.

## Message Optimizer

The `/message-optimizer` page shows whether AI copy is active or deterministic fallback is being used, recent optimized drafts, suggested optimizer commands, and safety reminders. It does not send messages or call APIs by itself.

## Message Review Queue

The `/message-queue` page reads `data/leads/message-review-queue.json` and shows review status counts, pending messages, approved-but-not-sent messages, needs-edit messages, sent messages, recent status changes, draft links, and copyable CLI commands. State changes remain CLI-based.

## Source Quality

The `/sources` page reads `data/leads/source-quality.json` and shows source quality counts, best/worst sources, metrics, recommendations, and commands. It does not fetch sources or mutate source config.

## What It Reads

- `sales-marketing-engine/operator/generated/`
- `sales-marketing-engine/operator/approval-queue/`
- `data/leads/`
- `reports/latest/`
- `reports/leads/`

## What It Does Not Do

- Does not send outreach.
- Does not use external APIs.
- Does not require a database.
- Does not provide authentication.
- Does not read arbitrary filesystem paths.

## Safety

The server uses an allow-list of local directories and prevents path traversal. Markdown is escaped before rendering, so scripts in local Markdown are not executed.
