# Manual Contact Enrichment

Contact enrichment is fully manual and safe. The system does not use enrichment APIs, scrape personal data, or automate LinkedIn.

## Enrich A Lead

```bash
npm run lead:enrich -- --id <leadId> --contact-name "Name" --role "Founder" --email "name@example.com" --linkedin "https://linkedin.com/in/example" --note "Found on public company website"
```

Supported fields:

- contact name
- role
- email
- LinkedIn URL
- company name
- website
- notes

## Rules

- Use only public, appropriate sources.
- Validate the company fit before outreach.
- Do not add private or scraped personal data.
- Keep notes factual and short.

## Daily Review

Prioritize hot and warm leads missing contact details, especially leads with completed audits or clear Playwright/QA fit.
