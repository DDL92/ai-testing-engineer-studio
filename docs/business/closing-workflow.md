# Closing Workflow

Closing keeps the pipeline clean. Nothing is sent automatically.

## Mark Lost Or Ignored

```bash
npm run lead:close -- --id <leadId> --result lost --reason no_budget --note "Asked to follow up next quarter"
```

Supported results:

- lost
- ignored
- not_fit

Supported reasons include `no_budget`, `no_response`, `not_fit`, `wrong_timing`, `already_has_qa`, `too_small`, `too_enterprise`, `bad_contact_info`, `low_quality_lead`, and `other`.

Closed leads are excluded from follow-up due lists.

## Weekly Review

Review lost reason breakdown in `revenue-summary.md` and `pipeline-summary.md`. If many leads close for the same reason, tighten source selection or scoring.
