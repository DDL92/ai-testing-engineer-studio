# Contact Discovery

Local-first contact preparation for the current Revenue Intelligence actionable lead.

## Commands

```bash
npm run contact:discover -- --company Setmore
npm run contact:pack -- --company Setmore
npm run contact:top-lead
```

The workflow uses the repository's bounded public Tavily search integration, rejects authenticated LinkedIn URLs, never guesses email addresses, and never sends outreach. Search-result snippets are capped below the automatic selection threshold.

Discovery states distinguish verified contacts (`READY`), retained candidates needing confirmation (`NEEDS_MANUAL_REVIEW`), successful searches without supported names (`NO_CANDIDATES_FOUND`), and provider/configuration failures (`SEARCH_UNAVAILABLE`).

Generated local data and reports:

- `data/contacts/contact-candidates.json`
- `output/contacts/<company-slug>-contact-pack.md`
- `output/contacts/contact-readiness.md`
- `output/contacts/<company-slug>-contact-discovery-diagnostics.md`
