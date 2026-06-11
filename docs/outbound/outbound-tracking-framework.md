# Outbound Tracking Framework

Outbound should be tracked locally and manually. The purpose is to understand pipeline health without adding CRM integrations or automating outreach.

## Pipeline

```text
Lead
-> Qualified
-> Message Prepared
-> Audit Offered
-> Follow-Up Needed
-> Proposal Ready
-> Retainer Opportunity
-> Lost
-> Paused
```

## Stage Definitions

Lead:
Company has been identified but not reviewed deeply.

Researching:
Daniel is reviewing website, fit, contact, and potential pain points.

Qualified:
Lead has a clear QA pain signal, offer fit, and manual next action.

Message Prepared:
A draft exists for manual review. It has not been sent automatically.

Audit Offered:
A manually approved audit offer has been sent.

Follow-Up Needed:
A manual follow-up should be reviewed and approved before sending.

Audit Sold:
Lead purchased or approved a QA Audit.

Proposal Ready:
A proposal or SOW has been drafted and needs manual review.

Proposal:
A proposal or SOW has been sent manually after approval.

Retainer Opportunity:
Lead appears to have recurring QA Automation or agency partner potential.

Lost:
Lead is no longer active due to no fit, no budget, no response, timing, or rejection.

Paused:
Lead may be revisited later but should not receive active outreach now.

## Outbound Fields

Each lead may include optional outbound fields:

- `outreachChannel`: linkedin, email, website-contact-form, referral, upwork, or manual-other.
- `outreachStatus`: not-started, message-prepared, contacted, follow-up-needed, audit-offered, audit-sold, proposal-ready, proposal-sent, retainer-opportunity, won, lost, or paused.
- `nextFollowUpDate`: manually selected follow-up date.
- `lastContactedAt`: date the lead was manually contacted.
- `outreachNotes`: manual notes about context, approvals, or constraints.
- `qualificationSummary`: concise reason the lead is or is not worth outbound work.

## Manual Approval Rules

- Message drafts are not sent automatically.
- Follow-ups are not sent automatically.
- Audit offers and SOWs require Daniel approval before sending.
- Contact data must be manually reviewed and should not be scraped or enriched from private sources.
- Do not claim an audit was completed unless a reviewed audit output exists.
- Do not use credentials, production systems, or private client data without explicit approval.

## Lead Pack Connection

`npm run lead:pack -- --id lead_id` creates:

- `output/lead-packs/{lead_id}.md`
- `output/outbound/{lead_id}-outbound-plan.md`

The lead pack shows:

- Outbound status
- Contact information
- Qualification summary
- Outreach channel recommendation
- Manual outreach checklist
- Follow-up plan
- Updated recommended next action

The outbound plan is a manual operating aid. It does not send messages, connect APIs, or update any external system.

## KPI Definitions

Leads added:
Number of new companies manually added to the local lead tracker.

Messages prepared:
Number of outbound drafts prepared for manual review. This is not messages sent.

Audits proposed:
Number of manually approved QA Audit offers sent.

Audits sold:
Number of paid or approved QA Audits.

Proposals sent:
Number of manually approved SOW/proposal documents sent.

Retainers won:
Number of clients converted to recurring QA support.

MRR:
Monthly recurring revenue from active retainer clients using local recorded monthlyFee only.

## Weekly Review Questions

- How many qualified leads were added?
- How many message drafts were reviewed?
- How many audit offers were sent manually?
- Which leads moved closer to a proposal?
- Which clients or leads are at risk?
- What is current recorded MRR?
- What is the next highest-value manual action?
