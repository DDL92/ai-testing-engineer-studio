# Tavily Reset Plan

Use this only after Tavily credits reset.

## Commands To Run After Credits Reset

1. `npm run leads:tavily-health`
2. `npm run leads:test-provider`
3. `npm run leads:search`
4. `npm run leads:health`
5. `npm run leads:search-quality`
6. `npm run leads:enrich`
7. `npm run leads:quality`
8. `npm run leads:verification-review`
9. `npm run leads:verify`
10. `npm run leads:pilot-pack`
11. `npm run leads:dashboard`

## Expected Outputs

- `output/lead-discovery/diagnostics/tavily-health.md`
- `output/lead-discovery/diagnostics/provider-test.md`
- `output/lead-discovery/search-candidates/`
- `output/lead-discovery/search-quality/`
- `output/lead-discovery/enriched-leads/`
- `output/lead-discovery/delivery-candidates/`
- `output/lead-discovery/verification/`
- `output/pilot-pack/`
- `output/lead-discovery/dashboard/`

## Validation Checklist

- Tavily health reports configured and enabled.
- Search diagnostics show bounded query execution.
- No secrets are printed.
- Blocked queries remain blocked.
- Search quality promotes only lead-like or possibly lead-like candidates.
- Delivery candidates exclude vendors, directories, stale posts, staffing, and job posts.
- Verification candidates require Daniel manual review.

## Stop Conditions

- Credits are exhausted again.
- Provider returns rate limits or repeated empty responses.
- Search results are mostly directories, vendors, articles, or stale content.
- Delivery candidates are zero for repeated live runs.
- Manual review finds repeated false positives.

## If Search Returns Poor Results

- Stop live search.
- Review query quality and source performance reports.
- Reduce or disable poor sources.
- Tighten buyer-intent phrases and negative terms.
- Run offline regression and review simulation before trying live search again.
