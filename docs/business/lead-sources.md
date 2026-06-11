# Lead Sources

Lead sources live in `data/leads/sources.json`. Each source is configurable and can be disabled with `"enabled": false`.

## How Sources Work

`npm run lead:auto` reads enabled sources, fetches public RSS or public pages, extracts simple text opportunities, deduplicates by company/URL/source, scores each opportunity, and writes local outputs.

No outreach is sent automatically. Proposal drafts go to `sales-marketing-engine/operator/approval-queue` for human review.

## Current Public Sources

- Remote OK QA Jobs RSS: public QA job feed.
- We Work Remotely Programming RSS: public programming job feed filtered by scoring signals.
- Hacker News Who Is Hiring: disabled by default because Daniel should choose the current monthly thread URL.

## Add A Public Source

Add an object to `data/leads/sources.json`:

```json
{
  "id": "unique-source-id",
  "name": "Readable Source Name",
  "type": "rss",
  "url": "https://example.com/feed.rss",
  "enabled": true,
  "notes": "Why this source is useful and when to disable it."
}
```

Supported types are `rss`, `public_page`, `manual_json`, and `manual_text`.

## Disable A Source

Change:

```json
"enabled": true
```

to:

```json
"enabled": false
```

## Limitations

- Sprint 2 extraction is intentionally simple and deterministic.
- Public pages may change format.
- RSS feeds can be noisy.
- Contact details often require manual research.
- Scores are prioritization hints, not proof that a company is ready to buy.

## Safety Rules

- Use public, no-login sources only.
- Do not automate LinkedIn login or Upwork proposals.
- Do not scrape aggressively.
- Do not use paid APIs in this sprint.
- Do not send messages without Daniel approving them.
