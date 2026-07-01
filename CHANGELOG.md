# Changelog

This changelog summarizes the AI Lead Discovery Studio build history through Sprint 46. It is intentionally concise: use it to understand what exists, why it was added, and which commands or artifacts matter during validation mode.

## Discovery Engine

### Early Discovery MVP

- Main feature: local-first lead intake, reports, client packs, source planning, and targeted discovery plans.
- Commands added: `leads:intake`, `leads:report`, `leads:pack`, `leads:clients`, `leads:sources`, `leads:targeted-plan`, `leads:queries`.
- Outputs generated: `output/lead-discovery/` lead reports, client packs, source plans, and query plans.
- Why: create a repeatable local workflow for turning public buyer-intent signals into reviewable lead packs.
- Status: active foundation.

### Source-Specific Query Planning

- Main feature: client-specific source queries and public social/discussion source expansion.
- Commands added: `leads:source-queries`.
- Outputs generated: `output/lead-discovery/source-queries/`.
- Why: reduce broad generic search and focus on sources more likely to contain real buyer intent.
- Status: active, now complemented by conversation-first discovery.

### Intent Rewrite Engine

- Main feature: rewrite generic service keywords into buyer-language phrases.
- Commands added: `leads:rewrite-queries`.
- Outputs generated: `output/lead-discovery/query-rewrites/rewritten-queries.json`.
- Why: improve search quality by replacing generic service terms with pain, urgency, recommendation, and purchase-intent language.
- Status: active planning layer.

### Behavior And Dynamic Query Engines

- Main feature: buyer behavior, pain, urgency, and commercial signal query generation.
- Commands added: `leads:behavior-queries`, `leads:dynamic-queries`, `leads:behavior-performance`.
- Outputs generated: `output/lead-discovery/behavior-queries/` and dynamic query learning reports.
- Why: preserve useful buyer behavior signals through search, classification, dashboarding, and learning.
- Status: active but secondary to conversation-first during validation.

## Tavily / Budget / Provider Safety

### Sprint 14 - Tavily Usage Policy

- Main feature: Tavily usage policy for controlled commercial buyer-intent discovery.
- Commands affected: `leads:tavily-health`, `leads:test-provider`, `leads:search`.
- Outputs generated: policy docs and diagnostics under `output/lead-discovery/diagnostics/`.
- Why: protect free-tier credits and keep Tavily spend tied to deliverable leads for active clients.
- Status: active guardrail.

### Provider Router And Health Diagnostics

- Main feature: Tavily provider routing, fallback visibility, provider health reporting, and failure classification.
- Commands added: `leads:tavily-health`, `leads:health`.
- Outputs generated: `output/lead-discovery/diagnostics/tavily-health.*`, provider health reports, query failure reports.
- Why: make it clear whether Tavily ran, what failed, and what requires human action.
- Status: active.

### Budget Scheduler

- Main feature: monthly Tavily budget policy, scheduled run days, health states, search/extract caps, and offline-only recommendations.
- Commands added: `leads:tavily-budget`, `leads:tavily-allocation`.
- Outputs generated: `output/lead-discovery/tavily-budget/tavily-budget-plan.*`, `query-allocation.*`.
- Why: prevent burning the monthly free-tier budget too early.
- Status: active; max scheduled run remains 60 credits.

### Live Readiness Guard

- Main feature: local preflight for budget, schedule, repo health, regression health, provider readiness, and unsafe command boundaries.
- Commands added: `leads:live-readiness`, `leads:safe-commands`.
- Outputs generated: `output/lead-discovery/live-readiness/`, safe command reports.
- Why: force human approval and hard gates before live Tavily execution.
- Status: active; required before live runs.

## Lead Quality / Scoring / False Positive Protection

### Search Quality Mode

- Main feature: lead-like candidate classification before enrichment.
- Commands added: `leads:search-quality`.
- Outputs generated: `output/lead-discovery/search-quality/`.
- Why: stop directories, articles, definitions, landing pages, and vendor pages from entering delivery.
- Status: active after live search.

### Buyer Intent And Buyer Role Filtering

- Main feature: deterministic buyer intent, buyer role, and delivery eligibility classification.
- Commands affected: `leads:enrich`, `leads:quality`, `leads:verification-review`.
- Outputs generated: delivery candidate reports and verification queue reports.
- Why: distinguish real buyers from vendors, directories, staffing posts, job posts, and irrelevant content.
- Status: active quality gate.

### False Positive Learning

- Main feature: local learning reports for rejected, directory-heavy, staffing-heavy, or weak query groups.
- Commands added: `leads:false-positive-learning`, `leads:query-learning`, `leads:performance`.
- Outputs generated: query learning and false-positive learning reports.
- Why: tune future query selection based on actual review and delivery evidence.
- Status: advisory; no automatic outreach or deletion.

## Source Quality / Conversation Discovery

### Conversation Search Mode

- Main feature: conversation query generation from rewrite phrases for public forums and discussion sources.
- Commands added: `leads:conversation-queries`.
- Outputs generated: `output/lead-discovery/conversation-queries/`.
- Why: improve search quality by prioritizing public buyer discussions over broad web pages.
- Status: active.

### Source Quality v2

- Main feature: source/query/client/vertical quality scoring and budget recommendations from local artifacts.
- Commands added: `leads:source-quality-v2`.
- Outputs generated: `output/lead-discovery/source-quality-v2/source-quality-summary.*`, `budget-recommendations.*`.
- Why: shift future credits toward sources and query types with better local evidence.
- Status: active planning input for Tavily allocation.

### Sprint 45 - Conversation-First Discovery

- Main feature: conversation pattern libraries, conversation-first query generator, offline simulation, query mix rebalancing, and dashboard integration.
- Commands added: `leads:conversation-first`, `leads:conversation-first-simulate`.
- Outputs generated: `output/lead-discovery/conversation-first/conversation-first-queries.*`, `conversation-first-simulation.*`.
- Why: live Tavily produced many generic pages and zero delivery candidates; conversation-style queries performed better.
- Status: active validation priority.

## Public Source Monitor / Enrichment Prep

### Public Source Monitor

- Main feature: local registry of public source candidates and safe monitor planning.
- Commands added: `leads:source-monitor-plan`, `leads:source-monitor-simulate`.
- Outputs generated: `output/lead-discovery/source-monitor/`.
- Why: prepare bounded, no-login source monitoring without scraping or automated outreach.
- Status: active planning layer.

### Enrichment Readiness

- Main feature: local readiness scoring for future enrichment types such as geo, event, tourism, municipality, seasonality, venue proximity, project value, weather context, and business profile context.
- Commands added: `leads:enrichment-readiness`.
- Outputs generated: enrichment readiness reports under `output/lead-discovery/source-monitor/`.
- Why: prepare future public data enrichment without adding live integrations prematurely.
- Status: planning only.

### Tavily Extract Prep

- Main feature: extract queue and local extract simulation for future URL context enrichment.
- Commands added: `leads:extract-queue`, `leads:extract-simulate`.
- Outputs generated: `output/lead-discovery/extract/`.
- Why: spend future Extract credits only on filtered, high-value public URLs.
- Status: prepared; live extraction remains human-approved only.

## Review / Learning / Regression

### Offline Fixture Lab

- Main feature: deterministic local fixtures for Flora, Costa, and LZT classification validation.
- Commands added: `leads:simulate`.
- Outputs generated: `output/lead-discovery/simulation/`.
- Why: improve classifiers without provider calls or Tavily credits.
- Status: active local quality lab.

### Golden Regression Suite

- Main feature: permanent golden dataset for buyer role, lead-like classification, delivery eligibility, verification eligibility, intent strength, and commercial value.
- Commands added: `leads:regression`; included in `npm test`.
- Outputs generated: `output/lead-discovery/regression/` or `tmp/test-output/...` in test mode.
- Why: prevent lead-quality regressions during code changes.
- Status: active CI/local gate.

### Human Review Workflow

- Main feature: local review decisions, review history, review state, and review simulation.
- Commands added: `leads:review`, `leads:review-simulate`.
- Outputs generated: `output/lead-discovery/review-state/`, `output/lead-discovery/review/`.
- Why: keep final approval human-controlled and turn decisions into local learning signals.
- Status: active; required before delivery.

## Operator / Dashboard / Maintenance

### Client Dashboard

- Main feature: one dashboard for search quality, simulation, regression, review, loop health, budget, source monitor, extract readiness, Source Quality v2, and conversation-first status.
- Commands added: `leads:dashboard`.
- Outputs generated: `output/lead-discovery/dashboard/client-dashboard.md`, `.csv`.
- Why: make the lead discovery system operable from one local status view.
- Status: active.

### Daily Operator And Loop Health

- Main feature: operator brief, loop health, safe next action, and pause/maintenance visibility.
- Commands added: `leads:operator`, `leads:loop-health`, `leads:loop-simulate`, `leads:loop-reset`.
- Outputs generated: operator and loop-health reports.
- Why: keep daily operation bounded and avoid repeated unsafe live runs.
- Status: active.

### System Audit And Repo Check

- Main feature: local repo hygiene checks, generated-file warnings, secret risk checks, command inventory, and safety documentation checks.
- Commands added: `system:audit`, `repo:check`.
- Outputs generated: `output/system-audit/`, `output/operator/repo-check.*`.
- Why: catch unsafe state before commits and during validation.
- Status: active.

## Commercial / Offer / Delivery

### Pilot And Offer Packs

- Main feature: Flora pilot pack, pilot delivery pack, offer pack, offer value, meeting prep, and call tracker.
- Commands added: `leads:pilot`, `leads:pilot-pack`, `leads:offer-pack`, `leads:offer-value`, `leads:meeting-prep`, `leads:call-tracker`.
- Outputs generated: pilot, offer, meeting, and call-tracker reports.
- Why: turn reviewed lead evidence into sellable client conversations and pilot delivery assets.
- Status: active; Flora validation is the priority.

### Delivery Router

- Main feature: route qualified opportunities into delivery-ready packs and next actions.
- Commands added: `leads:delivery-router`, `leads:export`.
- Outputs generated: delivery routing and export artifacts.
- Why: connect discovery to client delivery without losing evidence, review status, or commercial context.
- Status: active.

### Outcomes And Revenue Learning

- Main feature: outcome recording, commercial outcome learning, and calibration summaries.
- Commands added: `leads:outcomes`, `learning:record`, `learning:summary`, `learning:leads`, `learning:offers`, `learning:channels`, `learning:industries`, `learning:pricing`, `learning:recommendations`.
- Outputs generated: outcome and revenue-learning reports.
- Why: tune future work against real buyer outcomes instead of assumptions.
- Status: active but depends on real validation data.

## Repo Hygiene / CI / Guardrails

### Playwright And TypeScript Regression Gate

- Main feature: TypeScript typecheck plus Playwright regression coverage.
- Commands used: `npm run typecheck`, `npm test -- --reporter=line`.
- Outputs generated: Playwright test output and reports when enabled.
- Why: protect the broader studio while lead discovery evolves.
- Status: active.

### Generated Files Policy

- Main feature: explicit source/generated/runtime boundaries.
- Commands affected: `repo:check`, `system:audit`.
- Outputs generated: generated-file warnings and repo-check reports.
- Why: keep credentials, runtime state, generated evidence, and private data out of git.
- Status: active.

### Sprint 46 - Documentation Snapshot And Validation Mode

- Main feature: project changelog, architecture snapshot, north-star metrics, command map, and validation-mode guide.
- Commands added: none.
- Outputs generated: `CHANGELOG.md`, `docs/architecture/studio-architecture-snapshot.md`, `docs/metrics/north-star-metrics.md`, `docs/commands/lead-discovery-command-map.md`, `docs/status/validation-mode-guide.md`.
- Why: move from build mode to validation mode with clearer operating context.
- Status: complete documentation layer.

