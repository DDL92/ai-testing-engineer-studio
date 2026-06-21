import type { SalesPackContext } from './salesTypes';

export function renderProposal(context: SalesPackContext): string {
  const { record, leadPack, fictional } = context;
  const timeline = estimatedTimeline(leadPack.recommendedPrimaryOffer);
  const fixture = fictional
    ? '> Fictional validation proposal. This is test-only and must not be presented or sent.\n\n'
    : '';

  return `# ${record.lead.companyName} — Website Project Proposal

${fixture}## Current situation

${currentSituation(context)}

## Proposed solution

A focused, responsive homepage based on the reviewed conceptual demo. The proposed direction uses original design treatment, a clear contact path, and editable content boundaries. Business facts, assets, and the final contact destination require confirmation.

## Project objectives

- Present the confirmed business identity and priorities clearly.
- Make the agreed visitor action easy to find on desktop and mobile.
- Replace conceptual placeholders with client-approved facts and authorized assets.
- Validate the agreed implementation before handoff.

## Included deliverables

- One approved homepage direction based on the conceptual demo.
- Responsive desktop and mobile implementation.
- Confirmed content and authorized asset placement.
- Agreed navigation and contact CTA.
- Technical validation and client review handoff.

## Excluded work

Complex e-commerce, custom booking backends, payment processing, customer accounts, advanced multilingual content, ongoing copywriting, professional photography, AI image/video generation costs, paid hosting, paid plugins, legal/privacy drafting, guaranteed SEO rankings, and social-media management.

## Commercial direction

- Primary offer: **${leadPack.recommendedPrimaryOffer}**
- Existing price range: **${leadPack.priceRange}**
- Optional care: **${leadPack.recurringMaintenanceAngle}**
- Estimated timeline: **${timeline}**, requiring confirmation after scope and materials review

## Client responsibilities

- Confirm business facts, priorities, and the approved contact destination.
- Supply authorized logo, imagery, copy, and required legal text.
- Review milestones and provide consolidated feedback.
- Confirm any third-party account or service requirements.

## Assumptions

- The conceptual demo is a discussion aid, not completed client work.
- Final scope remains within the existing primary offer unless a written change is agreed.
- Third-party service availability and fees are not guaranteed or included unless explicitly stated.
- Delivery timing begins only after scope, materials, and start conditions are confirmed.

## Next step

Review the conceptual demo and confirm whether a short scope discussion is appropriate.

Proposal validity: **[VALID UNTIL — CONFIRM BEFORE SENDING]**

> Manual review required. This proposal is a draft and is not approved or sent.
`;
}

export function renderSow(context: SalesPackContext): string {
  const { record, leadPack, fictional } = context;
  const timeline = estimatedTimeline(leadPack.recommendedPrimaryOffer);
  const fixture = fictional
    ? '> Fictional validation SOW. This is test-only and must not be signed or sent.\n\n'
    : '';

  return `# Statement of Work: ${record.lead.companyName}

${fixture}## 1. Project summary

Prepare one responsive website experience under the **${leadPack.recommendedPrimaryOffer}** direction, using the conceptual demo as a review reference rather than as verified final content.

## 2. Scope

- Confirm requirements and approved content.
- Refine one agreed visual direction.
- Implement the agreed responsive homepage scope.
- Configure the agreed navigation and contact CTA.
- Complete technical validation and handoff.

## 3. Deliverables

- Responsive homepage files or agreed implementation.
- Desktop and mobile reviewed layouts.
- Approved copy and authorized asset placement.
- Technical validation summary.
- Handoff notes for the agreed hosting or maintenance arrangement.

## 4. Technical validation

- Responsive desktop and mobile rendering.
- No fatal console errors caused by the delivered page.
- No broken local assets.
- Functioning navigation.
- Functioning agreed contact CTA.
- Agreed browser validation.
- Manual client review.

Third-party service availability is not guaranteed.

## 5. Client-provided materials

Verified business details, approved copy, logo files, authorized images or video, contact destination, legal text, account access when explicitly required, and one designated feedback contact.

## 6. Assumptions

- Supplied materials are accurate and authorized for use.
- Placeholder content is replaced or explicitly approved before publication.
- Feedback is consolidated and supplied within agreed review windows.
- The current website and operational requirements are confirmed before implementation.

## 7. Exclusions

Complex e-commerce; custom booking backend; payment processing; customer accounts; advanced multilingual content; ongoing copywriting; professional photography; AI image/video generation costs; paid hosting; paid plugins; legal/privacy-policy drafting; guaranteed SEO rankings; social-media management.

## 8. Revision allowance

Two structured revision rounds are included. Additional or fragmented revision cycles require a written change request.

## 9. Estimated timeline

${timeline}, subject to confirmed scope, material readiness, review turnaround, and a mutually agreed start date.

## 10. Acceptance criteria

The agreed scope is complete when the listed deliverables meet the technical validation criteria, the agreed content and CTA are present, and the client completes manual review or provides consolidated outstanding items.

## 11. Change-request rule

Any material change to scope, functionality, integrations, content volume, timing, or deliverables must be documented and approved before work proceeds. Price and schedule effects require confirmation.

## 12. Maintenance option

Optional: **${leadPack.recurringMaintenanceAngle}**, with exact coverage and start date to be confirmed separately.

## 13. Commercial terms placeholders

- Project price: **${leadPack.priceRange} — final amount requires confirmation**
- Payment schedule: **[CONFIRM]**
- Currency and taxes: **[CONFIRM]**
- Start conditions: **[CONFIRM]**
- Proposal/SOW validity: **[CONFIRM]**

## 14. Approval/signature placeholders

Client name: ____________________  
Client signature: ____________________  
Date: ____________________

Operator name: ____________________  
Operator signature: ____________________  
Date: ____________________

> Manual review and explicit approval are required. This SOW is not signed, approved, or sent.
`;
}

function currentSituation(context: SalesPackContext): string {
  const signals = context.leadPack.verifiedOpportunitySignals;
  const observed = signals.length > 0
    ? `Existing evidence records ${signals.join(' and ')}.`
    : 'The current website situation requires confirmation.';
  const audit = context.audit.reachable
    ? 'The public inspection found a reachable current website; detailed findings remain subject to review.'
    : 'A current website inspection was not verifiable for this pack.';
  return `${observed} ${audit} The conceptual demo proposes a possible homepage direction and does not claim completed work or measured business results.`;
}

function estimatedTimeline(offer: string): string {
  if (/landing page/i.test(offer)) return '1–2 weeks';
  if (/presence starter|starter website/i.test(offer)) return '2–4 weeks';
  if (/redesign|recovery/i.test(offer)) return '3–6 weeks';
  return '1–2 weeks';
}
