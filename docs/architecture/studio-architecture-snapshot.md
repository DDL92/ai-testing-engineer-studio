# AI Lead Discovery Studio Architecture Snapshot

AI Lead Discovery Studio is a local-first, evidence-first lead discovery system. Its current architecture is optimized for low cost, human review, and controlled Tavily usage.

## Text Diagram

```text
Discovery
  -> Source Quality
  -> Search Budget
  -> Candidate Classification
  -> Buyer Role Filtering
  -> Enrichment Prep
  -> Human Review
  -> Delivery Pack
  -> Commercial Follow-up
  -> Outcome Learning
```

## High-Level Architecture

```text
Local config + pattern libraries
  -> query planning
  -> Tavily readiness + budget allocation
  -> human-approved live search
  -> search candidates
  -> lead-like classification
  -> buyer role filtering
  -> enrichment / extract prep
  -> delivery candidates
  -> human review
  -> pilot / offer / delivery packs
  -> call tracking + outcomes
  -> source quality and query learning
```

## Discovery Layer

The discovery layer creates query plans from client configs, source registries, buyer intent templates, rewrite libraries, behavior signals, and conversation-first pattern libraries.

Key commands:

- `leads:source-queries`
- `leads:rewrite-queries`
- `leads:conversation-queries`
- `leads:conversation-first`
- `leads:behavior-queries`
- `leads:dynamic-queries`
- `leads:queries`

Primary outputs live under `output/lead-discovery/` and are planning artifacts unless a live command is explicitly approved.

## Budget Layer

The budget layer controls whether Tavily should run and how many credits a scheduled run may spend.

Key commands:

- `leads:tavily-budget`
- `leads:tavily-allocation`
- `leads:live-readiness`
- `leads:safe-commands`

Current scheduled-run cap:

- Max 60 total credits per run.
- Max 50 search credits.
- Max 8 extract credits.
- 2 buffer credits.
- Basic search only; advanced search, crawl, and research remain disabled.

## Source Quality Layer

Source Quality v2 converts local evidence into budget and source recommendations. It looks at candidate volume, lead-like rate, delivery count, review outcomes, false positives, stale results, buyer-role quality, enrichment readiness, and estimated credit efficiency.

Key command:

- `leads:source-quality-v2`

The output informs `leads:tavily-allocation` but does not automatically run live search or outreach.

## Classification Layer

The classification layer turns raw search candidates into auditable lead-quality signals.

Main responsibilities:

- Detect lead-like vs generic content.
- Reject directories, vendor pages, articles, definitions, staffing posts, job posts, and landing pages.
- Classify buyer intent and buyer role.
- Preserve reasons, confidence, and scoring details.

Key commands:

- `leads:search-quality`
- `leads:enrich`
- `leads:quality`
- `leads:verification-review`

## Review Layer

The review layer keeps delivery and contact decisions human-controlled. It records Daniel's approve, reject, false-positive, or hold decisions locally.

Key commands:

- `leads:review`
- `leads:review-simulate`

Review output becomes evidence for Source Quality v2, false-positive learning, and future allocation decisions.

## Learning Layer

The learning layer is advisory. It summarizes what worked and what should be reduced, but it does not delete queries, send outreach, or change providers automatically.

Key commands:

- `leads:query-learning`
- `leads:false-positive-learning`
- `leads:performance`
- `leads:behavior-performance`
- `leads:source-quality-v2`

## Commercial Layer

The commercial layer turns reviewed opportunities into client-facing sales and delivery assets.

Key commands:

- `leads:pilot`
- `leads:pilot-pack`
- `leads:offer-pack`
- `leads:offer-value`
- `leads:meeting-prep`
- `leads:call-tracker`
- `leads:delivery-router`
- `leads:export`

The current validation priority is Flora pilot validation.

## Operator Layer

The operator layer provides daily visibility and safe next actions.

Key commands:

- `leads:operator`
- `leads:dashboard`
- `leads:loop-health`
- `leads:safe-commands`
- `repo:check`
- `system:audit`

The dashboard is the primary local status surface for budget, source quality, regression, review, extract readiness, source monitor, and conversation-first discovery.

## Maintenance Layer

The maintenance layer protects repo health, generated-file boundaries, and local-only validation discipline.

Key commands:

- `npm run typecheck`
- `npm test -- --reporter=line`
- `npm run repo:check`
- `npm run system:audit`

Generated and runtime artifacts should remain out of git unless intentionally tracked.

## Future Enrichment Layer

Future enrichment should remain bounded, public-only, no-login, and human-reviewed.

Potential enrichment types:

- Geo and location context.
- Event timing and venue proximity.
- Tourism demand and seasonality.
- Municipality and public notice context.
- Project type and estimated commercial value.
- Weather context.
- Business profile metadata.
- Future Tavily Extract URL context.

Do not add enrichment integrations unless they improve lead quality, reduce manual review time, or lower cost per approved opportunity.

