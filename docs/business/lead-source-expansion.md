# Lead Source Expansion

Lead source quality matters because Daniel needs a small number of high-fit QA Automation opportunities, not a large noisy list. The source system is local-only and uses public or manually curated inputs.

## Safe Source Fields

`data/leads/sources.json` supports these optional fields:

- `category`
- `priority`
- `maxResults`
- `includeKeywords`
- `excludeKeywords`
- `allowedDomains`
- `manualReviewRequired`
- `notes`

## How To Add A Safe Public Source

1. Choose a public, non-login URL or a local manual file.
2. Set `enabled` to `false` first.
3. Add include/exclude keywords.
4. Set `manualReviewRequired` to `true` if the source is not a simple RSS feed.
5. Run `npm run sources:report`.
6. Enable only if the source creates useful hot/warm QA Automation leads.

## Not Allowed

- Login-required scraping
- LinkedIn login automation
- Upwork paid proposal automation
- Aggressive crawling
- Private app access without explicit scope

## Upwork And LinkedIn

Upwork is manual and high-selectivity only because proposals may require paid connects. LinkedIn is manual review only because login automation and automated sending are not allowed.

## Business Goal

Better source quality improves the path to $3,000-$5,000/month by focusing outreach on companies more likely to need Playwright, TypeScript, regression, release, or QA automation support.
