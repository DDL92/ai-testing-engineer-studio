# Lead Discovery Engine v1 Architecture

## Purpose

Create a low-cost local discovery loop that turns a niche into scored company candidates and company-specific lead packs.

## Inputs

- `data/leads/discovery-seeds.json`
- `data/leads.json`
- `data/leads/discovered-leads.json`
- Local scoring rules in `src/leads/leadScorer.ts`
- Local lead pack rules in `src/leadPack/leadPackRules.ts`

## Processing

1. `lead:discover` accepts a niche.
2. The engine searches the local seed catalog for matching companies.
3. Candidates are scored with the existing QA Automation lead scorer.
4. Results are saved to `data/leads/discovered-leads.json`.
5. A Markdown discovery report is written to `output/leads`.
6. `lead:pack -- --company <name>` builds a company pack from either approved local leads or discovered candidates.

## Outputs

- Discovered candidate data for human review.
- Markdown discovery report.
- Company summary.
- Contact recommendations.
- Outreach drafts.
- QA opportunity analysis.
- Next actions.

## Boundaries

The engine does not browse the internet, scrape, call APIs, automate LinkedIn, send messages, enrich contacts, connect a CRM, or create booked revenue. It produces review-ready local artifacts only.
