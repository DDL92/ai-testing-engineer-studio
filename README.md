# AI Testing Engineer Studio

AI Testing Engineer Studio is a lean MVP for selling QA Automation and AI Testing services fast. It combines a reusable Playwright + TypeScript starter framework, AI testing templates, client delivery documents, Upwork assets, Codex prompts, and launch content.

## Studio Status

- Version: 1.0.0
- Feature Complete
- Revenue Mode Ready
- Release Locked
- Local-only and human-approved

## Quick Start

```bash
npm install
npm run studio:health
npm run revenue:morning
npm run dashboard:generate
npm run mobile:summary
```

## Daily Workflow

1. Review Studio health.
2. Review the Revenue Mode morning brief.
3. Confirm the actionable lead and evidence package.
4. Complete any external action manually.
5. Record only real outcomes.

## Revenue Mode Workflow

```text
Lead Discovery
-> Qualification
-> Evidence
-> Lead Rotation
-> Actionable Lead
-> Manual Commercial Action
-> Outcome Recording
```

## Core Commands

```bash
npm run studio:health
npm run revenue:morning
npm run revenue:today
npm run revenue:summary
npm run dashboard:generate
npm run mobile:summary
npm run archive:summary
npm run release:validate
```

## Testing Status

Studio v1 release validation requires TypeScript compilation and the complete Playwright regression suite to pass. See `docs/release/validation-report.md` for the latest recorded result.

## Why This Repo Exists

This repo is both a public portfolio asset and a delivery kit for QA Automation and AI Testing services. It shows how I structure client-ready Playwright work, package AI testing audits, and deliver practical QA artifacts without overbuilding.

## MVP Scope

This repo supports three services:

- Playwright QA Automation Audit: $300-$500
- Playwright Starter Framework: $800-$1,500
- AI Testing Audit: $500-$1,000

The goal is not to build a SaaS. The goal is to close the first paid audit, deliver a professional result, and convert the client into a framework project or monthly retainer.

## Portfolio Use

- Recruiters should review the Playwright framework structure, TypeScript setup, and README clarity.
- Clients should review the service offers, client delivery templates, and sample automation workflow.
- SaaS teams should review the UI smoke, API health, and AI response quality test examples.

## Install

```bash
npm install
npx playwright install
cp .env.example .env
```

Update `.env` with the client app URLs and test credentials.

## .env Usage

`.env` is local only and must not be committed. Use `.env.example` to document safe variable names for public sharing, onboarding, and client setup.

## AI Lead Discovery Studio

AI Lead Discovery Studio is the local-first commercial lead-discovery foundation for qualified, intent-based lead packs across travel, catering, wedding, real estate, website, and QA verticals. Current MVP commands use fictional sample data only and generate review artifacts for human approval.

Run:

```bash
npm run leads:intake
npm run leads:report
npm run leads:pack
npm run leads:clients
npm run leads:sources
npm run leads:targeted-plan
npm run leads:source-queries
npm run leads:behavior-queries
npm run leads:dynamic-queries
npm run leads:queries
npm run leads:tavily-health
npm run leads:test-provider
npm run leads:search
npm run leads:health
npm run leads:enrich
npm run leads:quality
npm run leads:verification-review
npm run leads:verify
npm run leads:pilot
npm run leads:pilot-pack
npm run leads:offer-pack
npm run leads:offer-value
npm run leads:meeting-prep
npm run leads:outcomes
npm run leads:export
npm run leads:dashboard
npm run leads:performance
npm run leads:behavior-performance
npm run leads:query-learning
npm run leads:morning
npm run leads:daily
```

Outputs:

- `output/lead-discovery/normalized-leads.json`
- `output/lead-discovery/intake-report.md`
- `output/lead-discovery/lead-discovery-report.md`
- `output/lead-discovery/qualified-leads.csv`
- `output/lead-discovery/daily/`
- `output/lead-discovery/clients/`
- `output/lead-discovery/source-plan.md`
- `output/lead-discovery/source-summary.json`
- `output/lead-discovery/targeted-discovery/`
- `output/lead-discovery/behavior-queries/`
- `output/lead-discovery/dynamic-queries/`
- `output/lead-discovery/query-learning/`
- `output/lead-discovery/discovery-queries/`
- `output/lead-discovery/search-candidates/`
- `output/lead-discovery/diagnostics/`
- `output/lead-discovery/enriched-leads/`
- `output/lead-discovery/delivery-candidates/`
- `output/lead-discovery/verification/`
- `output/lead-discovery/pilots/flora-and-fauna-foods/`
- `output/pilot-pack/`
- `output/client-offer/`
- `output/commercial/`
- `output/lead-discovery/outcomes/`
- `output/lead-discovery/exports/flora-and-fauna-foods/`
- `output/lead-discovery/dashboard/`
- `output/lead-discovery/source-performance/`
- `output/lead-discovery/search-quality/behavior-query-performance.md`

Client configs live in `data/lead-discovery/clients/`. Each active fictional/sample client receives a separate local lead pack under `output/lead-discovery/clients/{clientId}/`.

`npm run leads:queries` generates client-driven discovery query plans for active client configs, with Flora and Fauna Foods prioritized first. It prefers client-specific buyer-intent templates in `data/lead-discovery/query-templates/` before older generated query combinations. Discovery queries are planning outputs only: they are not executed and do not create lead records.

Public Social Source Expansion: social and community query templates live in `data/lead-discovery/query-templates/*-social-buyer-intent-queries.json`, and source rules live in `data/lead-discovery/social-sources/public-social-sources.json`. Allowed sources are indexed public Reddit threads, indexed public Facebook posts/groups, indexed public Instagram and TikTok pages, public forums, public event request boards, public RFP boards, and public community recommendation threads. Private groups, login scraping, profile harvesting, contact extraction, aggressive crawling, auto-DMs, and automated outreach are disallowed. See `docs/lead-discovery/public-social-source-policy.md`.

Social template priority: Flora and Fauna Foods social buyer-intent templates run first, LZT Costa Rica templates stay inactive unless an active LZT client config exists, and Costa Retreats runs after Flora and active LZT. Query plans preserve `sourceId`, `sourceCategory`, `queryTemplateType`, `queryTemplateId`, and negative query terms so downstream search, quality, and performance reports can distinguish standard versus social sources.

Provider Router: Tavily is the primary lead-search provider for AI Lead Discovery Studio. Provider registry config lives in `data/lead-discovery/providers/providers.json`; Tavily is enabled by default and `bing_rss` is disabled by default. Bing RSS is optional fallback only and requires explicit fallback enablement in both provider config and `data/lead-discovery/providers/tavily-guardrails.json`.

Tavily Health Check: `npm run leads:tavily-health` validates that `TAVILY_API_KEY` is configured locally, the provider registry loads, Tavily is enabled, the router selects Tavily, and fallback status is known. It writes `output/lead-discovery/diagnostics/tavily-health.md` and `.json` without logging secrets or exposing API keys.

Controlled Provider Tests: `npm run leads:test-provider` runs at most three Flora-only Tavily test queries from `data/lead-discovery/providers/tavily-guardrails.json` and writes `output/lead-discovery/diagnostics/provider-test.md` and `.json`. This is a manual diagnostic command, not part of the normal morning spend path.

`npm run leads:search` reads generated discovery queries, applies Tavily cost guardrails, routes each allowed query through the provider router, and runs bounded Tavily public search for active clients. It stores search candidates only: public result URL, title, snippet, query used, template metadata, and source metadata. Blocked queries are written to `output/lead-discovery/search-candidates/blocked-queries.md` and `blocked-queries.json`.

Search Diagnostics Engine: `npm run leads:search` writes structured execution diagnostics for every allowed and blocked query to `output/lead-discovery/diagnostics/search-execution-diagnostics.json`. Diagnostics capture provider used, provider reason, fallback activation, query start/finish, duration, guardrail status, whether the query was sent, response size, result count, empty responses, timeouts, rate limits, parser failures, provider errors, and deterministic failure categories. It never logs API keys, secrets, contact details, or private data.

Provider Health Reports: `npm run leads:health` reads the latest search diagnostics and writes `provider-health.md`, `provider-health.csv`, `query-failures.md`, `query-failures.csv`, `search-execution-summary.md`, and `recommendations.md` under `output/lead-discovery/diagnostics/`. These reports answer whether Tavily ran, which provider actually ran, which queries were sent or blocked, whether responses were empty, whether parser/rate-limit/timeout/network failures occurred, and the next human-reviewed action needed to restore lead generation.

Failure Classification System: search failures are classified deterministically as `query_blocked`, `provider_empty`, `timeout`, `rate_limit`, `network_error`, `parser_error`, or `unknown`. Diagnostics are observability only: no scraping, login, browser automation, contact extraction, outreach, email, DMs, calls, forms, query deletion, or provider changes are performed automatically.

Tavily Search Quality Mode: `npm run leads:search-quality` classifies stored search candidates before enrichment and writes `output/lead-discovery/search-quality/search-quality-summary.md`, `search-quality.csv`, `query-quality.md`, `query-quality.csv`, and `search-candidate-preview.md`. A result matching query keywords is not automatically a lead. Only results that demonstrate buyer intent or request behavior, such as public discussions, recommendation requests, event requests, planning conversations, RFPs, or public requests for help/services, are promoted to enrichment.

Lead-Like Candidate Classification: search candidates receive `leadLikeClassification`, `leadLikeScore`, `leadLikeConfidence`, `leadLikeSignals`, and `leadLikeReasons`. Classifications include `lead_like`, `possibly_lead_like`, `generic_content`, `directory`, `article`, `definition`, `landing_page`, and `unknown`. Only `lead_like` and `possibly_lead_like` candidates continue to enrichment; all other search results remain stored and auditable but excluded from the lead pipeline.

Seed Source Registry: curated public source registries live in `data/lead-discovery/seed-sources/` for Flora, LZT, and Costa. Each source records client, vertical, source category, URL pattern, region, priority, login/automation safety, expected lead quality, and notes. LZT seed sources exist but remain disabled unless an active LZT client config is added.

Targeted Discovery Engine: `npm run leads:targeted-plan` generates `output/lead-discovery/targeted-discovery/targeted-plan.md`, `source-registry-summary.md`, and `client-source-summary.csv`. `npm run leads:source-queries` builds source-specific public search queries from active client configs, seed sources, buyer-intent templates, and negative terms. The search runner prioritizes source-specific queries first, then behavior queries, social templates, and standard templates. Broad web search is now a fallback pattern; the system prioritizes public indexed communities and request sources that are more likely to contain buyer intent.

Source Learning Foundation: source-specific search metadata flows through search, search quality, enrichment, delivery, dashboard, and source performance reports using `sourceId`, `sourceCategory`, `sourceQueryPriority`, `expectedLeadQuality`, and template type. Recommendations remain deterministic: increase, keep, reduce, disable, or needs_more_data. No ML, scraping, browser automation, login, contact extraction, or outreach is used.

Behavioral Buyer Intent Engine: buyer behavior signal libraries live in `data/lead-discovery/buyer-intent-signals/` for Flora, Costa, and LZT. `npm run leads:behavior-queries` turns those local signal libraries into Flora-first behavior query plans under `output/lead-discovery/behavior-queries/`, including per-client markdown and JSON artifacts. The search flow preserves `behaviorCategory`, `behaviorSignals`, `behaviorScore`, `behaviorConfidence`, and `behaviorReasons` through search candidates, enrichment, delivery, dashboard, and learning reports. LZT behavior signals remain inactive unless an active LZT client config exists.

Behavior Query Learning: `npm run leads:behavior-performance` reviews behavior query source results, search candidates, delivery candidates, verification queues, and non-sample outcomes. It writes `output/lead-discovery/search-quality/behavior-query-performance.md` and `.csv` with deterministic promote, increase, keep, reduce, disable, or needs_more_data recommendations. It does not train ML, delete queries, scrape pages, extract contacts, or perform outreach.

Intent Phrase Library: real buyer phrase libraries live in `data/lead-discovery/intent-library/` for Flora, Costa, and LZT. Categories are `pain`, `urgency`, `purchase`, `recommendation`, `planning`, and `commercial_value`. These libraries are local JSON only and are used to detect buying behavior in query, title, and snippet metadata.

Buyer Signal Extraction Engine: search candidates receive `buyerSignals`, `buyerSignalCount`, `buyerSignalCategories`, and `buyerSignalStrength` from deterministic phrase matching. Signal strength is weak, medium, or strong based on action-oriented phrases and commercial-value context. The fields flow through enrichment, delivery, dashboards, and query learning without page visits, scraping, AI calls, contact extraction, or outreach.

Dynamic Query Engine: `npm run leads:dynamic-queries` combines pain, urgency, commercial value, and recommendation phrases into Flora-first dynamic query plans under `output/lead-discovery/dynamic-queries/`. Dynamic queries are prioritized after source-specific queries and before older behavior/social templates so the daily run spends search budget on real buyer-signal combinations.

Search Learning Engine: `npm run leads:query-learning` writes `output/lead-discovery/query-learning/query-learning.md` and `.csv`. It scores each query using lead-like count, possible count, delivery count, verification count, estimated value, and performance score, then recommends `promote`, `keep`, `reduce`, or `disable`. Dynamic Query Prioritization promotes queries that produce lead-like or verification outcomes, reduces article/directory-heavy queries, and disables repeated zero-signal failures after human review.

`npm run leads:enrich` reads local search candidates and estimates lead signals with deterministic rules only. It estimates lead type, recency, location fit, budget signals, contactability, overall score, and lead tier without page visits, scraping, AI calls, or contact extraction.

`npm run leads:quality` reads local enriched candidates and generates delivery candidates with deterministic quality rules. It performs buyer intent filtering, competitor/vendor exclusion, directory exclusion, deduplication, recency filtering, source quality scoring, and delivery queue assignment for Qualified Cold, Warm Intent, and Interest Verification review queues.

Buyer Intent Filter purpose: prevent delivering competitors and directories to clients. For Flora and Fauna Foods, the goal is to deliver buyers who need catering, food service, bar service, or event rentals, not caterers, catering companies, vendor profiles, or vendor directories. Costa Retreats keeps its normal flow while excluding travel agencies, tour operators, and resort directories. All classification is deterministic and local.

Client/query attribution is preserved through queries, search candidates, enriched leads, delivery candidates, verification reports, and performance reports using `clientId`, `clientName`, `vertical`, `sourceName`, `query`, and `queryTemplateId`. LZT query templates remain inactive unless an active LZT client config is added.

Contact Method Recommendation Engine: the lead discovery workflow infers the safest likely communication method from existing metadata only, such as source URL, source name, source category, title, snippet, and query. It does not scrape pages, extract emails or phone numbers, send messages, submit forms, call APIs, or visit sources. Contact recommendations are labels for Daniel review, such as `platform_message`, `source_reply`, `website_form`, `manual_review_required`, or `not_available`.

Verification Readiness Engine: enrichment and delivery candidates include buyer evidence, recency evidence, contact method evidence, recommended contact method, verification readiness, and readiness reasons. Its purpose is to explain why a candidate is or is not ready for manual verification. A ready candidate needs at least two buyer evidence items, at least one recency evidence item, and a safe inferred contact method that is not `not_available` or `manual_review_required`.

Result Relevance Gate: `npm run leads:quality` evaluates each result before it can become an active delivery candidate. The result title, snippet, URL, source name, and source category must indicate buyer intent from the result itself. Query text can support scoring and attribution, but it is never primary buyer evidence. Results are excluded when `domainBlocked === true`, `resultRelevance !== "relevant"`, or `buyerEvidenceCount === 0`. Relevance outcomes are written to `output/lead-discovery/delivery-candidates/relevance-summary.md`.

Domain Blocklist System: global and client-specific domain blocklists live under `data/lead-discovery/blocklists/`. The global list blocks dictionaries, encyclopedias, thesauruses, grammar/reference pages, entertainment pages, and other generic non-buyer sources. Flora also blocks wedding/vendor directories, marketplaces, and charity-rating directories such as The Knot, Zola, WeddingWire, Eventective, Charity Navigator, GuideStar, and GreatNonprofits. Blocklist matches fail closed and remain auditable in delivery, verification, and dashboard artifacts.

Buyer Evidence Hardening: buyer evidence is generated from result metadata only, primarily title and snippet. A query such as `planning corporate event` cannot create buyer evidence by itself. Definition pages, Wikipedia-style references, dictionary pages, grammar pages, entertainment pages, vendor marketplaces, directories, career/job pages, and generic vendor pages receive zero buyer evidence even when the query contains buyer-intent language.

Evidence-Based Verification Promotion: `npm run leads:verification-review` reads local delivery candidates and promotes candidates to `verification_review` or `verification_ready` when buyer evidence, intent evidence, and recency evidence cross the review threshold. It writes `output/lead-discovery/verification/review-queue.md`, `review-queue.csv`, `review-queue.json`, `verification-learning.md`, and `verification-learning.csv`. The statuses are review states only; Daniel approval is still required before any delivery or contact. The command does not scrape, visit pages, extract contacts, send messages, call, DM, or submit forms.

`npm run leads:verify` reads delivery candidates and prepares the Flora interest verification queue, soft intro message CSV, sales context, manual approval checklist, and verification failure reports. Flora verification candidates must be real buyers, not excluded, strong intent or strong buyer-intent signals, NY/NJ/PA/NYC/New York/New Jersey/Pennsylvania/Tri-State location fit, medium/high source quality, and score `>= 8.2`. Vendor, directory, caterer profile, catering company, and marketplace signals remain excluded. It does not send messages or contact anyone.

`npm run leads:pilot` generates a client-facing Flora pilot package with a pilot summary, candidate preview, offer proposal, verification process, and executive report. It packages existing local outputs only and does not contact anyone.

`npm run leads:pilot-pack` generates the Flora Pilot Delivery Pack v2 under `output/pilot-pack/`, including executive summary, reviewed lead table, sales intelligence, recommended actions, delivery package metadata, commercial metrics, and pilot delivery health. The pack reports `NO_DELIVERY` when no approved reviewed leads exist.

`npm run leads:offer-pack` generates the Flora client-facing commercial offer under `output/client-offer/`, including the AI Lead Discovery pitch, lead definitions, exclusions, pricing, deliverables, and commercial terms. `npm run leads:offer-value` generates an assumption-only value estimate with potential bookings and revenue ranges. These commands are local preparation only and do not use providers, scraping, outreach, or paid services.

`npm run leads:meeting-prep` generates the Flora Commercial Meeting Prep Pack under `output/commercial/`. It includes a 60 second pitch, 20-30 minute meeting agenda, pilot explanation, objection responses, closing questions, follow-up drafts, and value story. Follow-ups are drafts only: no emails, DMs, calls, forms, or outreach automation are sent. `npm run leads:dashboard` reports Commercial Meeting Readiness with pitch, agenda, objections, closing, follow-up, estimated duration, and readiness score.

`npm run leads:outcomes` summarizes local outcome records after client feedback. `npm run leads:export` prepares Flora delivery CSVs and review sheets. `npm run leads:dashboard` creates a client dashboard summary with behavior query count, top buyer behaviors, top pain and urgency signals, buyer signals discovered, signal strength distribution, top/worst signal combinations, promoted/disabled dynamic queries, promoted/disabled behavior queries, verification review count, verification confidence distribution, promotion reasons, conversion funnel, estimated commercial value, provider selected, Tavily configured, fallback enabled, provider health, query success/failure rate, provider failures, provider result count, empty responses, rate limits, blocked queries, and average search duration.

`npm run leads:performance` tracks source and query performance across search candidates, enriched leads, delivery candidates, verification outputs, and real outcomes when available. Sample outcomes are marked with `isSample: true` and do not influence performance scores or recommendations. Recommendations are deduplicated by `clientId + sourceName + query`; conflicting recommendation signals choose the safest action in this order: disable, reduce, keep, increase, needs_more_data. It writes `source-performance-summary.md`, `source-performance.csv`, `query-performance.md`, `query-performance.csv`, and `recommendations.md` under `output/lead-discovery/source-performance/`.

`npm run leads:morning` is the main 7:30am operating command. It runs targeted planning, source queries, behavior queries, dynamic queries, discovery queries, Tavily health validation, safe public search, search diagnostics, search quality, enrichment, quality filtering, evidence-based verification review, verification prep, pilot packaging, export, dashboard generation, source/query performance tracking, behavior query learning, and dynamic query learning. Daniel must review outputs before delivery or contact. Outcomes should be recorded after client feedback.

Tavily Cost Guardrails:

- Flora and Fauna Foods is first priority.
- LZT Costa Rica is second priority when an active LZT client config is added.
- Costa Retreats is third priority.
- Future paying clients are allowed only when explicitly added to guardrails.
- No Tavily/search spend for QA audit discovery, website audit discovery, generic discovery, or non-commercial research.
- Buyer intent is required before a query can run.
- Current guardrails limit runs to 50 queries total, 25 queries per client, and 10 results per query.
- Provider guardrails limit controlled provider tests to three Flora queries and keep Bing RSS fallback disabled by default.
- Lead discovery spending should prioritize Flora, active paying clients, and high-intent buyer discovery.
- Blocked query reporting shows allowed/blocked counts, reasons, client distribution, source distribution, and template query distribution.
- Source/query performance tracking recommends whether to increase, keep, reduce, disable, or gather more data for each source/query.
- Behavior query performance tracking recommends whether to promote, increase, keep, reduce, disable, or gather more data for each behavior query.

Current AI Lead Discovery Studio stages:

- intake
- scoring
- routing
- query generation
- dynamic buyer-signal query generation
- safe public search
- search diagnostics and provider health reporting
- lead signal enrichment
- buyer intent filtering
- lead quality and delivery candidate generation
- interest verification preparation
- client-facing pilot package generation
- delivery export and dashboard reporting
- source/query performance tracking
- behavior query learning
- dynamic query learning

AI Lead Discovery Studio currently supports multi-client routing, daily lead packs, source planning, keyword libraries, behavior signal libraries, discovery query planning, safe public search candidates, deterministic enrichment, delivery candidate generation, interest verification preparation, client-facing pilot packages, exports, outcome reporting, dashboards, source learning, behavior query learning, and a manual review workflow.

Safe public search, enrichment, quality scoring, verification preparation, and pilot packaging use public search result metadata and local deterministic rules only. They do not log in, bypass access controls, scrape pages, crawl websites, extract contact information, use paid APIs, automate browser actions, use AI calls, send outbound email, send DMs, make calls, submit forms, or automate outreach. Human review is required before delivery or contact.

## Security Boundary

This repo separates public portfolio code from private operator runtime data. Keep real contacts, outreach history, client records, finance data, outcomes, generated private reports, and dashboard runtime data out of the public repository.

Review the boundary docs:

- [Repository boundary](docs/security/repository-boundary.md)
- [Private runtime data](docs/security/private-runtime-data.md)
- [Dashboard mobile security](docs/security/dashboard-mobile-security.md)

Run:

```bash
npm run security:audit
npm run security:private-data
npm run security:portfolio-plan
npm run security:dashboard-check
```

## Run Tests

```bash
npm test
npm run test:chromium
npm run test:ui
npm run test:api
npm run test:ai
npm run test:headed
npm run report
```

## QA Audit Runner

```bash
npm run audit -- --url https://example.com
npm run audit:sample
npm run audit:site -- --url https://example.com
npm run lead:discover:assistant
npm run lead:candidate-queue
npm run lead:intake:approved
npm run lead:intake:batch
npm run lead:discover -- --niche "gym management SaaS"
npm run lead:pack -- --company PushPress
npm run lead:research -- --company PushPress
npm run lead:channels -- --company PushPress
npm run lead:channel-plan
npm run pain:research -- --company PushPress
npm run pain:summary
npm run site:intelligence -- --company PushPress -- --url https://www.pushpress.com
npm run site:summary
npm run opportunity:generate -- --company PushPress
npm run opportunity:summary
npm run audit:generate -- --company PushPress
npm run audit:portfolio
npm run audit:unified -- --company PushPress
npm run audit:unified-summary
npm run audit:pdf -- --company PushPress
npm run audit:pdf-portfolio
npm run evidence:collect -- --company PushPress
npm run evidence:portfolio
npm run evidence:capture-plan
npm run evidence:roadmap
npm run evidence:playwright-plan
npm run evidence:playwright-readiness
npm run evidence:playwright-run -- --company PushPress
npm run evidence:playwright-summary
npm run evidence:lighthouse -- --company PushPress -- --url https://www.pushpress.com
npm run evidence:lighthouse-summary
npm run outreach:status
npm run followup:queue
npm run audit:pack -- --id pushpress
npm run outreach:pack -- --id pushpress
npm run outreach:operating-pack
npm run outreach:first-audit-path
npm run contact:review -- --id pushpress
npm run contact:update -- --id pushpress --status prepared --channel linkedin
npm run client:prep -- --id pushpress
npm run client:onboard -- --client pushpress
npm run client:weekly-report -- --client pushpress
npm run client:monthly-report -- --client pushpress
npm run client:renewal-check -- --client pushpress
npm run pipeline:opportunities
npm run pipeline:prioritize
npm run pipeline:next-actions
npm run commercial:summary
npm run dashboard:generate
npm run dashboard:build
npm run dashboard:preview
npm run revenue:visibility
npm run revenue:command-center
npm run revenue:forecast
npm run revenue:targets
npm run revenue:pipeline
npm run revenue:focus
npm run revenue:score
npm run lead:intelligence
npm run lead:ranking
npm run lead:opportunities
npm run lead:next-actions
npm run executive:summary -- --company PushPress
npm run executive:portfolio
npm run execute:first-client
npm run execute:decision-board
npm run execute:outreach-review
npm run outcome:add
npm run outcome:dashboard
npm run outcome:review
npm run message:review -- --company PushPress
npm run message:pack -- --company PushPress
npm run followup:queue
npm run followup:daily
npm run followup:priorities
npm run followup:review
npm run winloss:analysis
npm run winloss:patterns
npm run winloss:insights
npm run winloss:strategy
npm run studio:hardening
npm run studio:monday-checklist
npm run studio:command-audit
npm run studio:output-audit
npm run studio:snapshot
npm run studio:architecture
npm run studio:inventory
npm run studio:rebuild-guide
npm run studio:recovery-check
npm run studio:launch-status
npm run studio:cockpit
npm run studio:quick-actions
npm run studio:highlights
npm run finance:monthly
npm run finance:dashboard
npm run finance:forecast
npm run client-readiness:pack
npm run first-audit:sales-pack
npm run proposal:center
npm run sow:center
npm run outreach:execute-pack
npm run outreach:follow-up-plan
npm run outreach:review
npm run contact:decision
npm run first-audit:workflow
npm run first-audit:kickoff
npm run mobile:review
npm run mobile:summary
npm run mobile:queue
npm run dashboard:mobile
npm run revenue:daily
npm run revenue:next-actions
npm run revenue:validate
npm run first-client:path
npm run cockpit:daily
npm run cockpit:approve
npm run os:dashboard
npm run os:today
npm run os:audit
npm run os:health
npm run os:release-check
npm run os:v1-report
npm run studio:health
npm run studio:summary
npm run studio:release-check
npm run mac:daily
npm run mac:summary
npm run client:ops
npm run client:next-actions
npm run client:delivery -- --id demo-retainer-client
npm run client:evidence -- --id demo-retainer-client
npm run client:delivery-report -- --id demo-retainer-client
npm run client:update-draft -- --id demo-retainer-client
npm run renewal:tracker
npm run renewal:review -- --id demo-retainer-client
npm run sow:generate -- --company PushPress
npm run sow:portfolio
npm run day:plan
npm run day:summary
npm run week:review
npm run operator:daily
npm run success:weekly
npm run success:monthly
```

Reports are written to `reports/latest` and remain local.
Local audit pack sales drafts are written to `output/audit-packs/{lead_id}` and require human approval before client use.
Manual outreach packs are written to `output/outreach-packs/{lead_id}`. They are review-only drafts and do not send messages, automate LinkedIn, call APIs, scrape, or update a CRM.
Real outreach operating packs are written to `output/outreach-operating` with Commercial Mode enabled by default. They exclude demo/sample leads, do not invent contacts or company facts, and do not send messages, scrape, browse, call APIs, automate LinkedIn/email, connect CRMs, use credentials, or access external systems.
Contact review records are stored in `data/contact-reviews.json` and rendered to `output/contact-reviews/{lead_id}`. They track manually reviewed contact and follow-up status only.
First client workflow assets are written to `output/client-workflows/{lead_id}` for discovery prep, audit sale planning, onboarding, delivery, and retainer conversion. They do not send messages, create invoices, request stored credentials, or connect payment/CRM tools.
Pipeline opportunity reports are written to `output/pipeline` and summarize local lead, artifact, contact review, follow-up, proposal, and client workflow readiness without external systems.
Pipeline prioritization reports are written to `output/pipeline-prioritization` for prioritized opportunities, top 10 revenue paths, top 5 manual actions, and stalled opportunities. They use deterministic local scoring only and do not scrape, browse, call APIs, automate outreach, connect CRMs, use credentials, or treat opportunity value as booked revenue.
Commercial Mode reports are written to `output/commercial-mode` for demo/sample isolation and commercial-only opportunity summaries. Revenue-facing reports use the shared Commercial Mode rules so demo/sample leads remain available for testing without distorting commercial reporting.
The PWA dashboard writes `output/dashboard/dashboard.json`, `output/dashboard/dashboard-summary.md`, `output/dashboard/dashboard-health.md`, and the static read-only app under `dashboard/`. `npm run dashboard:generate` refreshes local dashboard data, `npm run dashboard:build` verifies the static dashboard package, `npm run dashboard:preview` serves `dashboard/index.html` locally, and `npm run dashboard:mobile` exposes it on the local network for same-WiFi phone review. It reads local Studio outputs only and does not send outreach, send proposals, create invoices, create payments, modify data, call APIs, or use credentials.
The Revenue Command Center writes `output/revenue-command-center` reports for booked MRR, speculative MRR forecasts, audit opportunities, retainer opportunities, renewal/expansion visibility, property-progress scenarios, and top manual revenue actions. It uses local Studio data only and does not treat opportunities as booked revenue.
The Revenue Activation Engine writes `output/revenue` reports for first-audit targets, ranked revenue pipeline, 30-minute revenue focus, scoring, first-client planning, and first-retainer planning. `npm run revenue:targets`, `npm run revenue:pipeline`, `npm run revenue:focus`, and `npm run revenue:score` use local Studio evidence only and do not send outreach, send proposals, create invoices, invent meetings, invent replies, invent revenue, or infer client interest.
The Lead Intelligence Engine writes `output/leads` reports for lead ranking, high-probability opportunities, best offers, revenue priorities, and next actions. `npm run lead:intelligence`, `npm run lead:ranking`, `npm run lead:opportunities`, and `npm run lead:next-actions` use local Studio outputs only to answer which lead Daniel should focus on next. They do not generate outreach, emails, LinkedIn messages, meetings, revenue claims, outcomes, or client interest.
The Executive Business Layer writes `output/executive` reports that translate QA evidence into business language for founders, executives, product leaders, and operations leaders. `npm run executive:summary -- --company PushPress` creates a company executive summary, and `npm run executive:portfolio` creates portfolio-level business risk, priorities, roadmap, readiness, and executive ranking reports. It does not invent revenue, customers, bugs, outages, incidents, vulnerabilities, lost sales, churn, complaints, or quotes.
The First Revenue Execution Pack writes `output/execution` reports for GO/NO GO review, first-client readiness, first-revenue checklist, outreach review, decision board, and a manual execution plan. `npm run execute:first-client`, `npm run execute:decision-board`, and `npm run execute:outreach-review` support Daniel's manual decision only and never send outreach, emails, invoices, payments, meetings, or revenue claims.
The Outcome Tracking and Message Review Pack writes `output/outcomes` and `output/messages` reports for manually recorded outcomes, response rates, win-loss learning, safe PushPress message drafts, and message priorities. `npm run outcome:add` records only explicit Daniel-entered outcomes, `npm run outcome:dashboard` and `npm run outcome:review` summarize local outcome data, and `npm run message:review -- --company PushPress` plus `npm run message:pack -- --company PushPress` generate concise manual-review drafts. These commands never send messages, send emails, create meetings, send proposals, create invoices, create payments, invent replies, invent revenue, or infer client interest.
The Follow-Up Operating System writes `output/followups` reports for queue categories, daily follow-up plan, priorities, review, and cadence. `npm run followup:queue`, `npm run followup:daily`, `npm run followup:priorities`, and `npm run followup:review` use Revenue Activation, Outcome Tracking, Message Review, Executive Layer, and Execution Pack outputs to tell Daniel who to review manually, when, and why. It never sends messages, sends emails, creates meetings, creates invoices, creates payments, claims revenue, integrates a CRM, or invents outcomes.
The Win/Loss Intelligence Engine writes `output/winloss` reports for win/loss analysis, pattern analysis, opportunity insights, strategy recommendations, reply patterns, and offer performance. `npm run winloss:analysis`, `npm run winloss:patterns`, `npm run winloss:insights`, and `npm run winloss:strategy` learn only from manually recorded Outcome Tracking data. If there is not enough outcome history, reports say so instead of inventing patterns, replies, revenue, clients, or recommendations.
The Studio Hardening layer writes `output/hardening` reports for Monday launch readiness, command wiring, output availability, stale reports, dashboard readiness, and PushPress first-client readiness. `npm run studio:hardening`, `npm run studio:monday-checklist`, `npm run studio:command-audit`, and `npm run studio:output-audit` are local audits only and do not send outreach, emails, proposals, invoices, payments, replies, or revenue claims.
The Studio Snapshot and Disaster Recovery layer writes `output/studio-snapshot` reports for the full system snapshot, architecture summary, command inventory, data inventory, output inventory, system map, operator guides, rebuild guide, disaster recovery guide, and recovery check. `npm run studio:snapshot`, `npm run studio:architecture`, `npm run studio:inventory`, `npm run studio:rebuild-guide`, and `npm run studio:recovery-check` make Studio portable and recoverable without modifying finance records, outcome records, or taking external actions.
The Operator UX layer writes `output/operator` launch status, cockpit, quick actions, system highlights, and today-at-a-glance reports. `npm run studio:launch-status`, `npm run studio:cockpit`, `npm run studio:quick-actions`, and `npm run studio:highlights` are usability summaries only and do not add business logic, revenue systems, outreach automation, or external actions.
The Finance Tracking layer reads `data/finance/finance.json` as the source of truth for booked money and writes `output/finance` reports for monthly finance, MRR tracking, finance dashboard, forecasts, revenue opportunities, savings planning, and property progress. It is local-only, uses approved offer ranges only, and does not process payments, generate invoices, create payment links, connect banks, call APIs, or treat lead candidates as booked revenue.
The Real Client Readiness Pack writes `output/real-client-readiness` reports for Top 5 commercial lead readiness, manual contact planning, outreach safety checks, first audit sales positioning, and SOW readiness. It does not invent contacts or findings and does not send outreach.
The Proposal Command Center writes `output/proposal-center` reports for proposal-ready leads, SOW readiness, proposal priority, pricing recommendations, and approval checks. It is local-only and does not send proposals, invent findings, or treat opportunities as booked revenue.
The Real Outreach Execution Pack writes `output/outreach-execution` reports for final message drafts, manual contact research, follow-up timing, first audit CTA, and approval checks. It does not send messages, invent contacts, invent findings, browse, scrape, automate outreach, or connect external systems.
The First Audit Sale Workflow writes `output/first-audit-workflow` reports for positive-reply handling, discovery call prep, audit scope confirmation, kickoff, delivery, retainer upgrade path, and approval checks. It does not process payments, generate invoices, invent findings, or guarantee outcomes.
The Mobile Command Center writes `output/mobile` reports for mobile review, summary, action queue, priorities, and health. `npm run mobile:review`, `npm run mobile:summary`, and `npm run mobile:queue` consume the Daily Revenue Loop, dashboard data, opportunity engine, audit engine, proposal engine, evidence outputs, and outreach tracking. They are read-only, review-focused, approval-focused, and do not send outreach, send proposals, create invoices, create payments, modify lead data, or modify proposal data.
The Daily Revenue Operator writes `output/daily-revenue-operator` reports for the daily revenue snapshot, next actions, priority list, risks, 30-minute focus, consistency audit, and approval checklist. Revenue Command Center is the source of truth for booked MRR; demo/sample/sandbox/test/example client records are excluded from booked revenue.
The Action Cockpit v1 writes `output/action-cockpit` reports for one daily operating view: Top 3 actions, Top 5 opportunities, Revenue Command Center snapshot, client watchlist, manual follow-up watchlist, approval queue, local report health, and the next recommended command. It is local Markdown only and never auto-approves, sends outreach, connects CRMs, calls APIs, or uses external services.
The Operator OS Dashboard writes `output/operator-os-dashboard` reports for the primary AI Studio OS homepage: executive summary, today view, opportunity center, revenue center, approval center, follow-up center, system status, and exact next command. It uses Revenue Command Center and Action Cockpit as sources of truth and remains local-only.
The Studio OS Stabilization reports write `output/os-stabilization` audits for command consistency, report availability, revenue consistency, workflow completeness, documentation coverage, system health, and v1.0 candidate readiness. They are audit-only and do not modify business data.
The AI Studio OS v1.0 Candidate reports write `output/v1-candidate` for release checks, the official v1 report, architecture summary, command inventory, workflow inventory, revenue readiness, first-client readiness, known warnings, and post-v1 roadmap. They are local-only, do not invent revenue, do not send outreach, do not connect external systems, and require human approval before any external action.
The Studio Consolidation reports write `output/studio` for Sprint 71 health, summary, release check, command status, system readiness, and daily operation readiness. `npm run studio:health`, `npm run studio:summary`, and `npm run studio:release-check` verify local modules, commands, dashboard assets, mobile PWA readiness, revenue readiness, and daily operating cadence without sending outreach, creating invoices, processing payments, inventing clients, or inventing revenue.
The First Revenue Validation Pack writes `output/first-revenue-validation` for first revenue validation, first-client path, PushPress action plan, Top 5 commercial action plan, release cleanup plan, v1 score improvement plan, and approval checklist. It keeps booked revenue separate from opportunities, does not invent contacts or findings, does not send outreach, and requires Daniel approval before any external action.
The First Outreach Execution Review writes `output/outreach-review` for PushPress and Top 5 pre-send review, deterministic contact decision, send readiness, research gaps, and approval checklist. It does not send outreach, invent contacts, invent findings, browse, scrape, call APIs, connect CRMs, or use external systems.
Client operations reports are written to `output/client-ops` for daily priorities, next actions, readiness groups, reporting needs, and manual approval rules.
Client delivery automation reports are written to `output/client-delivery` for onboarding, weekly reports, monthly reports, renewal review, client health, and retention. `npm run client:onboard -- --client pushpress`, `npm run client:weekly-report -- --client pushpress`, `npm run client:monthly-report -- --client pushpress`, and `npm run client:renewal-check -- --client pushpress` consume local audit reports, proposal outputs, evidence, Playwright evidence, Lighthouse evidence, and Daily Revenue Loop outputs. They do not send reports, send emails, create invoices, create contracts, create payment links, invent client feedback, invent client satisfaction, or invent delivered work.
Polished client reporting artifacts are written to `output/client-reporting/{client_id}` for executive summaries, weekly reports, monthly reports, value delivered summaries, renewal signals, and draft client updates. They are evidence-first, local-only, and require Daniel review before sending.
Proposal and SOW packages are written to `output/proposals`. `npm run sow:generate -- --company PushPress` creates a reviewable Markdown proposal and PDF using local Client Audit Report, Unified Audit, Opportunity, and Evidence outputs. `npm run sow:portfolio` writes proposal summary, priorities, and retainer candidates. These are not contracts, invoices, payment requests, sending tools, email tools, or outreach tools, and they do not invent findings, bugs, vulnerabilities, incidents, outages, customer quotes, or metrics.
The Daily Revenue Loop writes `output/daily-revenue` reports for today's plan, today's summary, weekly review, highest-priority actions, follow-up priorities, proposal priorities, audit priorities, and revenue opportunities. `npm run day:plan`, `npm run day:summary`, and `npm run week:review` read local outreach, contact, opportunity, audit, proposal, evidence, and tracking outputs only. They do not send outreach, send proposals, create invoices, create payment links, create calendar events, invent replies, invent meetings, invent opportunities, invent revenue, or infer client interest.
Renewal and expansion reports are written to `output/renewals` for client health, renewal risk, expansion opportunities, renewal actions, and the renewal pipeline. They use local client data and generated artifacts only.
The daily operator and success rhythm reports are written to `output/operator` as one local command center plus weekly and monthly reviews. They summarize pipeline, follow-ups, client health, renewals, expansion watchlists, and suggested human-approved commands.
Mac Daily Automation reports are written to `output/mac-daily` for one-command local refreshes of dashboard, operator, pipeline prioritization, client operations, renewals, and Commercial Mode summaries. `npm run mac:summary` reads existing local outputs only and refreshes the consolidated daily summary, system health, and action cockpit without rerunning the full report sequence.
Lead discovery automation reports are written to `output/lead-discovery-automation` for manual search guidance, a 50-query search playbook, a blank candidate queue template, and an approval checklist. They do not scrape, browse, call APIs, invent companies, automate outreach, connect CRMs, use credentials, or add leads without Daniel approval.
Lead intake reports are written to `output/lead-intake` for approved candidates, rejected candidates, intake summaries, and copy/paste-ready `lead:add` command batches. They do not execute commands, modify `data/leads.json`, scrape, browse, call APIs, automate outreach, use CRMs, use credentials, or create leads without Daniel approval.
Lead Discovery Engine v1 uses the local seed catalog in `data/leads/discovery-seeds.json` to score niche-specific company candidates and writes review-only results to `data/leads/discovered-leads.json` and `output/leads`. It does not browse, scrape, call APIs, automate LinkedIn, send messages, or promote candidates without human approval.
Lead research and outreach tracking use local records in `data/contacts/contacts.json` and `data/outreach/outreach.json`. `npm run lead:research -- --company PushPress`, `npm run outreach:status`, and `npm run followup:queue` write Markdown reports to `output/contact-research` and `output/outreach-tracking` without scraping, APIs, CRM, credentials, external databases, message sending, or automated follow-ups. Sprint 66 Daily Revenue Loop consumes these outputs for local planning only.
Multi-channel lead research uses local records in `data/channels/channels.json`, existing local lead data, and existing approved contact records. `npm run lead:channels -- --company PushPress` writes company channel research to `output/channel-research/{company_id}.md`, and `npm run lead:channel-plan` writes `output/channel-research/channel-plan.md`. Blank channel URLs mean the exact public path is not recorded yet and must be manually verified. These commands do not browse, scrape, automate LinkedIn, send forms/messages/emails, call APIs, connect CRMs, use credentials, or use external databases.
Customer Pain Intelligence uses `data/pain-intelligence/pain-research.json` to turn existing local lead notes into potential QA risks, automation opportunities, audit angles, and outreach intelligence. `npm run pain:research -- --company PushPress` writes `output/pain-research/{company_id}-pain-research.md`, and `npm run pain:summary` writes customer complaint signals, QA risk maps, solution recommendations, outreach angles, and a summary under `output/pain-research`. It is not a security scanner, does not invent customer complaints, quotes, vulnerabilities, incidents, or findings, and does not scrape, call APIs, use credentials, use external databases, or send outreach.
Website QA Intelligence uses `data/site-intelligence/site-intelligence.json` to turn existing local website URLs, lead notes, channel research, and pain intelligence into potential QA findings, UX opportunities, automation opportunities, and audit recommendations. `npm run site:intelligence -- --company PushPress -- --url https://www.pushpress.com` writes `output/site-intelligence/{company_id}-site-intelligence.md`, and `npm run site:summary` writes `qa-findings.md`, `ux-opportunities.md`, `automation-opportunities.md`, `audit-recommendations.md`, and `site-summary.md`. It does not browse, scrape, run browser automation, use screenshots, log in, use credentials, run security tests, claim vulnerabilities, or send outreach.
The Unified QA Opportunity Engine uses `data/opportunities/opportunities.json` plus local contact, outreach, channel, pain, and site intelligence records to choose the best contact, channel, audit angle, automation opportunity, first offer, and retainer path. `npm run opportunity:generate -- --company PushPress` writes `output/opportunities/{company_id}-opportunity.md`, and `npm run opportunity:summary` writes best opportunities, commercial priorities, outreach priorities, audit priorities, and an opportunity summary under `output/opportunities`. It uses approved pricing only and does not invent contacts, complaints, bugs, vulnerabilities, incidents, customer feedback, metrics, or send outreach.
The QA Audit Pack Engine uses `data/audit-packs/audit-packs.json` and Opportunity Engine outputs to create structured audit deliverables. `npm run audit:generate -- --company PushPress` writes `output/audit-packs/{company_id}-audit-pack.md`, and `npm run audit:portfolio` writes `audit-portfolio.md`, `audit-priorities.md`, `audit-delivery-roadmap.md`, and `retainer-opportunities.md`. It is not a proposal, invoice, contract, payment instruction, or consulting report generator; all outputs remain evidence-based, opportunity-based, and human-approved.
The Unified Audit Generator uses `data/unified-audits/unified-audits.json` plus existing Opportunity Engine, Audit Pack, Evidence Engine, Playwright Evidence, and Lighthouse Evidence outputs to create one professional audit report per company. `npm run audit:unified -- --company PushPress` writes `output/unified-audits/{company_id}-unified-audit.md`, and `npm run audit:unified-summary` writes `audit-summary.md`, `audit-priorities.md`, `audit-comparison.md`, and `audit-readiness.md`. It is not a proposal, contract, invoice, payment request, or outreach tool; it does not invent bugs, vulnerabilities, incidents, outages, complaints, customer quotes, findings, or metrics.
The Client Audit Report Generator uses `data/client-audit-reports/reports.json` plus Unified Audit reports and evidence outputs to generate client-ready Markdown, HTML, and PDF reports. `npm run audit:pdf -- --company PushPress` writes `output/client-audit-reports/{company_id}-qa-audit-report.md`, `.html`, and `.pdf`, and `npm run audit:pdf-portfolio` writes `portfolio-summary.md` and `report-readiness.md`. It uses ReportLab for PDF generation and remains a report generator only: no proposals, contracts, invoices, payment requests, outreach, sending, invented findings, vulnerabilities, incidents, outages, complaints, customer quotes, or invented metrics.
The Evidence Collection Engine uses `data/evidence/evidence.json` plus existing Studio outputs from contact research, channel research, pain research, site intelligence, opportunities, and audit packs. `npm run evidence:collect -- --company PushPress` writes `output/evidence/{company_id}-evidence.md`, and `npm run evidence:portfolio` writes evidence portfolio, gaps, readiness, and priorities reports. It does not run browser automation, Playwright, Lighthouse, scans, APIs, scraping, screenshots, or credentials, and it does not invent evidence.
The Evidence Capture Framework uses `data/evidence-capture/capture-framework.json` and `data/evidence-capture/capture-roadmap.json` to document future evidence source contracts, storage architecture, readiness scoring, and capture priorities. `npm run evidence:capture-plan` writes the capture plan, future evidence sources, and storage architecture reports under `output/evidence-capture`, and `npm run evidence:roadmap` writes the evidence roadmap and priority roadmap. It is architecture-only and does not collect evidence, run Playwright, run Lighthouse, capture screenshots, scan, browse, call APIs, use credentials, or create external data.
The Playwright Evidence Framework uses `data/playwright-evidence/playwright-targets.json` and `data/playwright-evidence/playwright-readiness.json` to plan controlled future Playwright evidence collection. `npm run evidence:playwright-plan` writes the evidence plan, target priorities, and storage plan under `output/playwright-evidence`, and `npm run evidence:playwright-readiness` writes readiness and safety reports. It documents future execution only and does not run Playwright, crawl, capture screenshots, create traces, scrape, use credentials, call APIs, or collect evidence.
The Playwright Evidence Runner performs controlled public-page passive observations only. `npm run evidence:playwright-run -- --company PushPress` writes company evidence to `output/playwright-runner/{company_id}-playwright-evidence.md` and local JSON records under `data/evidence/playwright/reports` and `data/evidence/playwright/observations`; optional screenshots are stored under `data/evidence/playwright/screenshots` when capture succeeds. `npm run evidence:playwright-summary` writes summary, findings, observations, and readiness reports under `output/playwright-runner`. It limits observation to public marketing pages, max 5 pages per company, max 1 navigation depth, and never submits forms, logs in, creates accounts, triggers payments/bookings, scrapes, crawls aggressively, uses credentials, sends outreach, or uses authenticated APIs.
The Lighthouse Evidence Engine runs objective homepage-only Lighthouse collection for public URLs. `npm run evidence:lighthouse -- --company PushPress -- --url https://www.pushpress.com` writes Markdown to `output/lighthouse/{company_id}-lighthouse.md`, structured evidence to `data/evidence/lighthouse/reports`, and raw Lighthouse JSON/HTML to `data/evidence/lighthouse/raw`. `npm run evidence:lighthouse-summary` writes `lighthouse-summary.md`, `lighthouse-priorities.md`, and `lighthouse-comparison.md` under `output/lighthouse`. It captures only Performance, Accessibility, Best Practices, and SEO scores; it does not authenticate, create accounts, submit forms/payments, crawl aggressively, use credentials, perform vulnerability scanning, or run penetration testing.

## Lead Operator

```bash
npm run lead:daily
npm run lead:auto
npm run lead:update -- --id sample-lead --status contacted --note "Sent LinkedIn DM"
npm run lead:audit -- --id sample-lead
npm run lead:enrich -- --id sample-lead --email "sample@example.com"
npm run lead:sent -- --id sample-lead --channel linkedin --note "Sent first DM"
npm run lead:followups:due
npm run lead:pipeline
npm run lead:review -- --id sample-lead
npm run lead:convert -- --id sample-lead --offer monthly_qa_maintenance --amount 1000 --note "Closed after audit call"
npm run lead:close -- --id sample-lead-close --result lost --reason other --note "Close test"
npm run revenue:summary
npm run actions:cockpit
npm run lead:optimize -- --id sample-lead --type linkedin_dm
npm run message:optimize -- --file sales-marketing-engine/operator/approval-queue/lead-sample-lead-proposal.md --type follow_up
npm run message:queue
npm run message:review -- --company PushPress
npm run message:pack -- --company PushPress
npm run message:sent -- --file lead-sample-lead-optimized-linkedin_dm.md --channel linkedin --note "Sent manually"
npm run sources:report
npm run business:weekly
npm run dashboard:generate
npm run dashboard:build
npm run dashboard:preview
npm run dashboard:check
npm run validate:business
```

The local dashboard viewer can still be started with `npm run dashboard:dev` at `http://localhost:4173` and only reads local generated files. The Action Cockpit page ranks the next human-reviewed revenue actions from `data/leads/action-cockpit.json` and `sales-marketing-engine/operator/generated/action-cockpit.md`.

The lead operator stores local JSON data in `data/leads`, writes proposal drafts to `sales-marketing-engine/operator/approval-queue`, and writes daily, pipeline, revenue, weekly, and action cockpit reports to `sales-marketing-engine/operator/generated`. No outreach is sent automatically.

AI-assisted message optimization is optional and disabled by default. Without `AI_COPY_ENABLED=true` and a local `OPENAI_API_KEY`, `lead:optimize` and `message:optimize` use deterministic fallback copy and still write review-only drafts to the approval queue.

The Message Review Queue tracks pending, approved, needs-edit, rejected, sent, and archived local drafts in `data/leads/message-review-queue.json`. `message:sent` records a manual send in local outreach history when a lead ID is known; it does not send anything externally.

Source quality reporting scores public and manual lead sources in `data/leads/source-quality.json` and writes `sales-marketing-engine/operator/generated/source-quality-report.md`. Use it to keep high-fit QA Automation sources and disable noisy ones.

## Test Behavior Without Environment Variables

The sample tests are designed to skip until a real app or endpoint is configured. UI tests need `BASE_URL`, `TEST_USER_EMAIL`, and `TEST_USER_PASSWORD`. API tests need `API_BASE_URL`. AI tests need `AI_API_URL`. This keeps the public repo runnable without exposing client credentials or depending on external services.

## Sample Client Scenario

Example: SaaS login + dashboard + API health audit.

1. Configure `BASE_URL` for the SaaS app.
2. Add test credentials to local `.env`.
3. Adapt login and dashboard locators in the page objects.
4. Configure `API_BASE_URL` and `API_HEALTH_PATH`.
5. Run UI smoke and API health checks.
6. Deliver findings with the audit report and coverage matrix.

## Adapt To A Client

1. Set `BASE_URL`, `API_BASE_URL`, and optional `AI_API_URL` in `.env`.
2. Update page objects in `playwright-framework/pages`.
3. Replace generic login and dashboard assertions with client-specific stable locators.
4. Add API endpoints in `playwright-framework/tests/api`.
5. Add AI prompts and expected quality criteria in `playwright-framework/tests/ai`.
6. Deliver using the templates in `client-delivery-system`.

## Repo Areas

- `docs`: MVP plan, business model, service offers, automation strategy, launch checklist.
- `playwright-framework`: reusable Playwright framework with POM, fixtures, UI/API/AI examples.
- `ai-testing-kit`: prompt, injection, RAG, and response quality testing assets.
- `client-delivery-system`: intake, audit report, coverage matrix, delivery, retainer proposal.
- `codex-prompts`: prompts to accelerate delivery with Codex.
- `upwork-assets`: profile, project catalogs, proposal templates.
- `content-engine`: first posts, carousels, and 7-day content plan.

## Delivery Workflow

1. Qualify client with the intake form.
2. Run a short manual + automated audit.
3. Customize the framework for 1-3 critical flows.
4. Generate report and coverage matrix.
5. Send final delivery message.
6. Offer the starter framework or monthly retainer as the next step.
