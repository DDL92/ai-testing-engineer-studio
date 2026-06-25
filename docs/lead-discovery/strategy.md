# AI Lead Discovery Studio Strategy

AI Lead Discovery Studio is the commercial lead-intelligence module inside AI Studio Operating System. It turns public, human-reviewable buying signals into structured lead packs with source context, score, urgency, risk flags, and sales notes.

It is now the main commercial priority because it is closer to recurring demand than one-off internal QA tooling. A repeatable lead-discovery product can support multiple buyers and verticals while reusing the same local-first data model, scoring rules, and report workflow.

## What We Sell

We sell qualified intent-based leads, not scraped contact dumps.

Each lead should include:

- Public source context.
- Intent summary.
- Relevant service request or likely buyer need.
- Location and date signals where available.
- Score and score breakdown.
- Urgency and risk flags.
- Sales angle and suggested first message for human review.

The buyer receives a shortlist of leads they can review, qualify, and contact manually through their own approved process.

## What We Do Not Do

AI Lead Discovery Studio does not:

- Auto-contact prospects.
- Send emails, DMs, form submissions, or connection requests.
- Spam public posts or communities.
- Use aggressive scraping.
- Scrape behind logins.
- Buy lead databases.
- Infer private personal data.
- Claim a lead is ready without human review.

## Initial Low-Cost Operating Model

Sprint 1 uses local files only:

- JSON for lead records.
- Markdown for review reports.
- CSV for lightweight buyer handoff.
- TypeScript for repeatable scoring/report generation.
- Fictional sample data for validation.

Initial source collection remains manual or fixture-based. Future collection should use bounded public sources, explicit source attribution, deduplication, and human approval gates before any lead is delivered or contacted.
