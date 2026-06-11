# Action Cockpit

The action cockpit is the daily command surface for deciding what to do next with each lead. It is local-only, human-reviewed, and does not send outreach.

## Generate

```bash
npm run actions:cockpit
```

Outputs:

- `sales-marketing-engine/operator/generated/action-cockpit.md`
- `data/leads/action-cockpit.json`

## Decision Model

The cockpit reuses the lead review next-action engine and normalizes commercial actions into these operator categories:

- `enrich_contact`
- `run_audit`
- `generate_proposal`
- `send_first_message`
- `follow_up_due`
- `wait_for_reply`
- `close_or_ignore`
- `convert`
- `review_lead`
- `no_action_needed`

Each action includes lead identity, priority, score, category, expected revenue impact, reason, suggested command, related artifacts, blocked reason, and timestamp.

## Daily Workflow

1. Run `npm run lead:auto`.
2. Run `npm run actions:cockpit`.
3. Clear blocked enrichment items first.
4. Move high-value audit, proposal, follow-up, and conversion actions.
5. Record manual outcomes with `lead:sent`, `lead:convert`, or `lead:close`.

For send, follow-up, proposal, conversion, and close actions, the cockpit may show an optional optimizer command such as:

```bash
npm run lead:optimize -- --id <leadId> --type linkedin_dm
```

Optimization is optional and writes another review-only draft to the approval queue.

For drafts connected to manual send actions, the cockpit also shows Message Review Queue commands. Depending on status, it may recommend scanning drafts, approving a pending draft, marking an approved draft as manually sent, or re-optimizing a needs-edit draft.

The cockpit also includes a small Source Quality Recommendations section after lead/revenue actions. This keeps lead actions first while still showing whether Daniel should review best sources, disable noisy sources, improve keywords, or add similar sources.

## Safety Rules

- No automatic outreach.
- No scraping behind login.
- No paid APIs.
- Every suggested command is reviewed and run manually.
- Message optimization never sends outreach.
- Drafts and reports remain local unless intentionally shared by the operator.
