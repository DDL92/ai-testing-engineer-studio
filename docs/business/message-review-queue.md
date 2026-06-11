# Message Review Queue

The Message Review Queue is the local control layer for approval queue drafts. It tracks review status without editing original drafts and without sending messages.

## Scan Drafts

```bash
npm run message:queue
```

This scans `sales-marketing-engine/operator/approval-queue/`, adds new Markdown drafts to `data/leads/message-review-queue.json`, and writes `sales-marketing-engine/operator/generated/message-review-queue.md`.

## Review A Message

Approve:

```bash
npm run message:review -- --file <draft-file> --status approved --note "Ready to send"
```

Mark needs edit:

```bash
npm run message:review -- --file <draft-file> --status needs_edit --note "Shorten CTA"
```

Reject or archive:

```bash
npm run message:review -- --file <draft-file> --status rejected --note "Too generic"
npm run message:review -- --file <draft-file> --status archived --note "No longer relevant"
```

## Mark Manually Sent

```bash
npm run message:sent -- --file <draft-file> --channel linkedin --note "Sent manually on LinkedIn"
```

This marks local queue metadata as sent. If the lead ID is known and the lead is active, it updates local outreach tracking, sets `lastContactedAt`, schedules `nextFollowUpAt`, and appends an outreach-history record. It does not send anything externally.

## Daily Review

Daniel should review:

- Pending review messages
- Approved but not sent messages
- Needs edit messages
- Quality warnings
- Whether the draft makes unsupported audit, private app, or revenue claims
- Whether the next action supports the $3,000-$5,000/month pipeline

## Safety

- No automatic sending
- No LinkedIn or Upwork automation
- No login scraping
- Original draft files are preserved
- State changes are CLI-based and local
