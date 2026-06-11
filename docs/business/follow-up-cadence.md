# Follow-Up Cadence

Nothing is sent automatically. Follow-up drafts are generated for human review only.

## Default Cadence

- Day 2
- Day 5
- Day 9
- Day 14 final soft follow-up

## Mark Outreach As Sent

```bash
npm run lead:sent -- --id <leadId> --channel linkedin --note "Sent first DM"
```

This records the outreach event in `data/leads/outreach-history.json`, updates `lastContactedAt`, and schedules `nextFollowUpAt`.

## Generate Due Follow-Ups

```bash
npm run lead:followups:due
```

Drafts are written to `sales-marketing-engine/operator/approval-queue` and must be reviewed before sending.
