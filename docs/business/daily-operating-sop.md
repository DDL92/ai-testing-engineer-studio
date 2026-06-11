# Daily Operating SOP

## Automated Run

The scheduled job runs `npm run lead:auto`. It checks enabled public sources, scores opportunities, generates proposal drafts, and writes the daily summary.

## Daniel Reviews

1. Open `sales-marketing-engine/operator/generated/daily-lead-summary.md`.
2. Review proposal drafts in `sales-marketing-engine/operator/approval-queue`.
3. Verify each company and website manually.
4. Personalize the message with real context.
5. Send manually only after review.
6. Update local lead status after outreach.

## Quality Bar

Do not claim bugs were found unless a QA audit was actually run. Do not imply prior partnership or experience with the company.
