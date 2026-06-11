# Client Acquisition System

The Sprint 1 system is semi-automated. It finds public opportunities, scores them, writes local JSON files, and creates proposal drafts for human approval.

## Channel Priority

1. LinkedIn first for relationship-based outreach.
2. Cold email second when a public business email is available.
3. Instagram third as an authority and trust funnel.
4. Upwork only for high-score jobs because proposals may require paid connects.

## Safety Rules

- No auto-sending messages.
- No LinkedIn login automation.
- No Upwork automation that spends connects.
- No paid API dependency.
- Human review is required before outreach.

## Daily Flow

1. `lead:auto` reads configured public sources.
2. Opportunities are deduplicated and scored.
3. Hot and warm leads get draft messages in `sales-marketing-engine/operator/approval-queue`.
4. Daniel reviews drafts, personalizes context, and sends manually.
5. Approved outreach status is updated locally.
