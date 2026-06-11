# QA Audit Runner

Playwright-based audit CLI for quick client-ready website checks.

## Run

```bash
npm run audit -- --url https://example.com
npm run audit:sample
```

If browsers are not installed yet:

```bash
npx playwright install
```

## Outputs

- `reports/latest/audit-result.json`
- `reports/latest/client-report.md`
- `reports/latest/technical-report.md`
- `reports/latest/screenshots/homepage.png`

## Scope

This is a deterministic Sprint 1 audit runner. It does not use OpenAI, Supabase, paid APIs, or automated outreach.
