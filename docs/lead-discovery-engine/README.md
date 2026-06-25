# Lead Discovery Engine v1

Lead Discovery Engine v1 is a local-first discovery workflow for a solo QA Automation business.

It helps Daniel identify and prioritize companies that may need:

- QA Audit
- Playwright Starter Pack
- QA Automation Retainer
- Agency Partner Retainer

## Commands

```sh
npm run lead:discover -- --niche "gym management SaaS"
npm run lead:pack -- --company PushPress
npm run leads:rewrite-queries
npm run leads:conversation-queries
```

## Intent Rewrite Engine

The intent rewrite engine replaces generic service keywords with phrases that look like real buyer conversations:

- pain: `my caterer cancelled`, `el terreno no drena`
- urgency: `need caterer ASAP`, `event next week`
- recommendations: `who knows a caterer`, `looking for villa recommendations`
- purchase intent: `need food vendor recommendations`, `necesito PTAR`

Rewrite libraries live in `data/lead-discovery/query-rewrites/` and the generated query batch is written to `output/lead-discovery/query-rewrites/rewritten-queries.json`.

## Conversation Search Mode

Conversation search mode takes rewrite phrases and biases them toward public indexed discussion sources such as Reddit, public Facebook group pages, Tripadvisor forums, WeddingWire forums, WeddingBee boards, and What to Expect community pages.

It generates local query plans only:

- no login
- no browser automation
- no scraping behind authentication
- no contact extraction
- no outreach

The generated batch is written to `output/lead-discovery/conversation-queries/conversation-queries.json`.

## Rewrite Learning Rules

Query learning promotes rewrites that produce lead-like candidates, buyer-service roles, delivery candidates, or verification review candidates.

It reduces rewrites that produce directories, vendors, article/reference pages, staffing recruitment, or empty responses. It disables repeatedly empty or low-quality queries. Learning output is advisory only; no query is deleted automatically.

## Conversation Discovery Workflow

Recommended local sequence:

```sh
npm run leads:source-queries
npm run leads:rewrite-queries
npm run leads:conversation-queries
npm run leads:search
npm run leads:search-quality
npm run leads:enrich
npm run leads:quality
npm run leads:verification-review
npm run leads:dashboard
```

`npm run leads:morning` and `npm run leads:daily` include the rewrite and conversation query steps before public search.

## Offline Fixture Lab

The Offline Fixture Lab improves lead discovery without spending Tavily credits. Fixtures live in `data/lead-discovery/fixtures/`:

- `flora-fixtures.json`
- `lzt-fixtures.json`
- `costa-fixtures.json`

The lab uses realistic positive and negative examples to validate local classifiers before running paid or external search again.

## Lead Simulation Engine

Run the simulation manually:

```sh
npm run leads:simulate
```

The command is local only. It does not call Tavily, execute search, open a browser, scrape pages, extract contacts, or send outreach.

Simulation output is written to `output/lead-discovery/simulation/`:

- `simulation-summary.md`
- `simulation-dashboard.md`
- `simulation-candidates.json`
- `simulation-delivery.md`
- `simulation-verification.md`
- `simulation-failures.md`

## Fixture Training Workflow

1. Add a positive or negative fixture with the expected outcome.
2. Run `npm run leads:simulate`.
3. Review false positives and false negatives in `simulation-failures.md`.
4. Tighten local classifier signals.
5. Re-run until precision and recall are acceptable.

The morning workflow does not run fixture simulation automatically.

## Precision Metrics

Precision measures how many promoted simulation candidates were truly positive:

```text
true positives / (true positives + false positives)
```

For Flora, the target is precision above 90% with zero false positives.

## Recall Metrics

Recall measures how many positive fixtures were correctly promoted:

```text
true positives / (true positives + false negatives)
```

Use recall to catch overly strict rules that reject real buyer conversations.

## Golden Dataset Regression

The golden dataset is the permanent local quality gate for lead discovery logic. It lives in `data/lead-discovery/golden-dataset/`:

- `flora-golden.json`
- `lzt-golden.json`
- `costa-golden.json`

Run it directly:

```sh
npm run leads:regression
```

The suite validates buyer role, lead-like classification, delivery eligibility, verification eligibility, intent strength, and commercial value buckets. It writes:

- `output/lead-discovery/regression/regression-summary.md`
- `output/lead-discovery/regression/regression-results.json`
- `output/lead-discovery/regression/regression-failures.md`
- `output/lead-discovery/regression/regression-dashboard.md`

`npm test` runs `npm run leads:regression` before Playwright. This keeps CI local and deterministic while failing fast if lead quality regresses. No provider calls, Tavily usage, browser automation, scraping, contact extraction, or outreach are performed.

## Human Review Workflow

Human review records Daniel's commercial decision after candidates are generated. It is manual and local:

```sh
npm run leads:review -- --candidateId candidate-id --clientId flora_and_fauna_foods_001 --decision approve --reviewReason "real buyer" --notes "Strong event need."
```

Batch decisions can also be applied from a local JSON file:

```sh
npm run leads:review -- --file data/lead-discovery/review-decisions.json
```

The command writes:

- `output/lead-discovery/review-state/review-state.json`
- `output/lead-discovery/review-state/review-history.json`
- `output/lead-discovery/review-state/review-history.csv`
- `output/lead-discovery/review/review-summary.md`
- `output/lead-discovery/review/review-summary.csv`
- `output/lead-discovery/review/review-learning.md`
- `output/lead-discovery/review/review-learning.csv`

## Decision Types

Supported decisions:

- `approve`
- `reject`
- `hold`
- `needs_recency_check`
- `false_positive`

Approved reasons include `real buyer`, `high intent`, `good fit`, `recent post`, and `high commercial value`. Rejected reasons include `directory`, `vendor`, `staffing`, `article`, `stale`, `not buyer`, `duplicate`, and `low value`. Hold reasons include `needs more evidence`, `unclear intent`, and `ambiguous source`.

## Outcome Learning

Approved decisions create positive learning rows that promote similar future candidates with matching buyer, intent, source, and commercial-value signals.

False-positive decisions create negative learning rows that increase local penalties for staffing, directories, reference articles, vendor pages, and other non-buyer patterns.

## Review Metrics

Review reports track approved count, rejected count, hold count, false-positive count, approval rate, rejection rate, top approval reasons, top rejection reasons, and learning count. The client dashboard includes a `Review Health` section with the latest review metrics.

## Review Simulation Workflow

Run the review simulator manually:

```sh
npm run leads:review-simulate
```

The simulator reviews fixture and golden-dataset cases without persisting real review history. It writes:

- `output/lead-discovery/review/review-simulation.md`
- `output/lead-discovery/review/review-simulation.json`

The morning workflow does not run review decisions or review simulation automatically.

## Loop State And Budget Guardrails

Loop health is tracked locally in `runtime/lead-discovery/`:

- `loop-state.json`
- `cost-budget.json`

Manual commands:

```sh
npm run leads:loop-health
npm run leads:loop-reset
npm run leads:loop-simulate
```

Stop conditions pause the loop instead of terminating the app:

- `too_many_empty_runs`
- `too_many_provider_failures`
- `too_many_no_delivery_runs`
- `max_duration_reached`

Cost guardrails use estimated values only. `warning` reduces query batches, `critical` disables dynamic queries, and `paused` disables external search entirely until Daniel approves resuming.

Escalation reports are written to `output/lead-discovery/loop-health/`:

- `escalation-report.md`
- `escalation-report.json`
- `loop-health-summary.md`
- `loop-health-summary.json`

The client dashboard includes `Loop Health` with paused status, stop reason, provider health, estimated credits remaining, cost health, last successful run, last outcome, and the recommended next action.

## Daily Operator Brief

The Operator Cockpit gives Daniel one local daily brief:

```sh
npm run leads:operator
```

It writes:

- `output/operator/daily-operator-brief.md`
- `output/operator/daily-operator-brief.json`

The brief answers what happened, what is healthy, what is paused, what to do today, what not to run, and the next command to run. It reads existing local outputs only and does not execute provider search.

## Operator Health

The client dashboard includes `Operator Health` after `npm run leads:operator` runs. It shows system readiness, operator readiness, recommended next action, estimated review time, blocked command count, and safe command count.

## Next Best Action Engine

`src/leadDiscovery/recommendNextAction.ts` chooses the next local action from loop state, budget health, regression health, review health, and simulation metrics.

When `cost_budget_paused` is active, the recommended action is to wait for Tavily credits reset and use only safe local commands.

## Safe Commands

Safe local commands:

- `npm run leads:simulate`
- `npm run leads:regression`
- `npm run leads:review-simulate`
- `npm run leads:dashboard`
- `npm run leads:loop-health`

## Blocked Commands

When cost budget is paused, these commands are blocked until human approval:

- `npm run leads:search`
- `npm run leads:morning`
- `npm run leads:daily`
- `npm run leads:test-provider`

## Operator Workflow

1. Run `npm run leads:operator`.
2. Read `Do First`, `Do Next`, and `Blocked Commands`.
3. Run only safe commands while credits remain paused.
4. Refresh dashboard with `npm run leads:dashboard`.
5. Resume external search only after human budget approval.

## Outputs

- `data/leads/discovered-leads.json`
- `output/leads/lead-discovery-{niche}.md`
- `output/leads/{lead_id}-lead-pack.md`

## Safety Rules

- Local-first only.
- No paid APIs.
- No LinkedIn automation.
- No message sending.
- No scraping behind logins.
- No CRM automation.
- No invented contacts, findings, metrics, or revenue.
- Human approval is required before promoting a lead, contacting a company, running an audit, sending outreach, or proposing work.

## Revenue Focus

The engine favors companies with visible product workflows, booking, checkout, onboarding, payment-adjacent flows, mobile risk, integrations, or recurring release cycles. The commercial goal is to sell a focused QA Audit first, then convert validated evidence into a Playwright Starter Pack or QA Automation Retainer.
