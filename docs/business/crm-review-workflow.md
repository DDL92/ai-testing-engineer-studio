# CRM Review Workflow

The CRM review layer helps Daniel inspect one lead at a time without opening JSON files.

## Review One Lead

```bash
npm run lead:review -- --id <leadId>
```

This prints a terminal summary and writes:

`sales-marketing-engine/operator/generated/lead-<leadId>-review.md`

## How To Read The Review

Start with the recommended next action. Then confirm:

- score and category
- missing contact details
- audit status
- proposal draft status
- outreach history
- red flags
- suggested command

## Decide The Next Action

- `enrich_contact`: add safe manual contact details.
- `run_audit`: run a public-page QA audit before outreach.
- `generate_proposal`: regenerate the audit-based proposal.
- `send_first_message`: manually send an approved proposal draft, then record it with `lead:sent`.
- `follow_up_due`: generate and review follow-up drafts.
- `ignore`: mark the lead ignored when fit is weak.

## Morning Routine

1. Run or open `lead:daily`.
2. Review the top 5 leads to review today.
3. Run `lead:review` for the highest-priority lead.
4. Execute only the suggested manual command after review.
5. Never send outreach without reading the draft first.

## Weekly Review

Use `lead:pipeline` to check status counts, blocked leads, audit-ready leads, and follow-ups due. Move stale or weak-fit leads to `ignored` so the pipeline stays clean.

## Revenue Goal

This workflow supports the $3,000-$5,000/month goal by keeping daily action focused on leads most likely to convert into paid QA audits, Playwright starter projects, or monthly QA maintenance.
