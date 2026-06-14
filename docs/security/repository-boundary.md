# Repository Boundary

AI Testing Engineer Studio uses a public/private split.

## Public Portfolio Repository

The public repository may contain source code, templates, docs, sanitized samples, demo leads, generic package examples, and reviewed public screenshots.

It must not contain real contacts, outreach status, LinkedIn records, client records, finance records, outcomes, payment status, private client notes, generated private reports, `.env`, `.env.local`, API keys, or tokens.

## Private Operator Runtime

Use ignored local paths for business state:

```text
runtime/
  private-data/
  private-output/
  private-logs/
  private-dashboard-data/
```

Use `samples/` only for sanitized committed examples:

```text
samples/
  sample-leads.json
  sample-clients.json
  sample-outcomes.json
  sample-finance.json
```

## Review Before Publishing

Run:

```bash
npm run security:audit
```

Review `output/security/security-remediation-plan.md` before publishing or splitting a portfolio repository. If files are tracked but should remain local, use the generated `git rm --cached` instructions after manual review.
