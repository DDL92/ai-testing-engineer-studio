# Private Runtime Data

Private runtime data is local operator state that should not be committed or published.

## Keep Local Only

- `runtime/private-data/` for live contacts, clients, leads, finance, outreach, outcomes, and dashboard state.
- `runtime/private-output/` for generated reports that contain real companies, clients, screenshots, or notes.
- `runtime/private-logs/` for local logs.
- `runtime/private-dashboard-data/` for dashboard JSON copied from private sources.

## Commit Only Sanitized Samples

Committed samples must use fake/demo companies, fake contacts, generic URLs, placeholder revenue, and no client credentials.

Safe sample files live in `samples/`.

## Existing Tracked Files

This sprint does not delete existing files. Run:

```bash
npm run security:private-data
```

Then review `output/security/private-data-inventory.md`. If a tracked file contains real private data, move the local copy into `runtime/` and remove the repository index entry with the generated `git rm --cached` command.
