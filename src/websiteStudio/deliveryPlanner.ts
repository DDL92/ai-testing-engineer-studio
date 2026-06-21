import type { ClientPackContext } from './clientTypes';

const qaAreas = [
  'Agreed pages and sections present',
  'Responsive desktop and mobile behavior',
  'Navigation works',
  'Agreed CTA works',
  'Contact links use confirmed information',
  'Forms validated without production submission unless explicitly authorized',
  'No fatal console errors',
  'No broken local assets',
  'No obvious failed required resources',
  'Page title and viewport metadata',
  'Agreed browser coverage',
  'Keyboard navigation review',
  'Visible focus review',
  'Contrast and manual accessibility review',
  'Reduced-motion behavior where relevant',
  'Image alternative-text review',
  'Performance and Lighthouse review when available',
  'Approved content and assets only',
  'No remaining conceptual placeholders',
  'Client review completed',
  'Deployment authorization recorded separately',
];

export function renderDeliveryPlan(context: ClientPackContext): string {
  const fixture = fixtureNotice(context);
  const start = context.acceptance.targetStartDate ?? '[TARGET START DATE — CONFIRM]';
  const delivery = context.acceptance.targetDeliveryDate ?? '[TARGET DELIVERY DATE — CONFIRM]';
  const sowScope = extractSection(context.sow, '2. Scope', '3. Deliverables');
  const sowDeliverables = extractSection(context.sow, '3. Deliverables', '4. Technical validation');
  const sowExclusions = extractSection(context.sow, '7. Exclusions', '8. Revision allowance');
  const sowTimeline = extractSection(context.sow, '9. Estimated timeline', '10. Acceptance criteria');

  return `# Delivery Plan: ${context.acceptance.clientName}

${fixture}Status: **PLANNING — IMPLEMENTATION HAS NOT STARTED**

## 1. Project objective

Deliver the explicitly accepted **${context.acceptance.selectedOffer}** scope using approved business information, authorized assets, deterministic QA, and controlled client handoff.

## 2. Confirmed scope

${sowScope}

## 3. Deliverables

${sowDeliverables}

## 4. Exclusions

${sowExclusions}

## 5. Required client inputs

- Confirmed business details and contact information
- Authorized brand and visual assets
- Approved website copy or confirmed copywriting scope
- Domain, hosting, integration, and legal-content responsibilities
- One designated approval contact

## 6. Delivery phases

1. Phase 1: onboarding and content confirmation
2. Phase 2: design direction confirmation
3. Phase 3: implementation
4. Phase 4: QA and revisions
5. Phase 5: final approval and controlled handoff

## 7. Review checkpoints

- Onboarding completeness review
- Design direction approval
- Implementation review
- QA and consolidated revision review
- Final acceptance and deployment-authorization review

## 8. Revision allowance

Two structured revision rounds. Additional scope or revisions require a documented change request.

## 9. Estimated schedule

- Existing SOW estimate: ${sowTimeline}
- Target start: ${start}
- Target delivery: ${delivery}

Dates are not commitments until dependencies, materials, and review timing are confirmed.

## 10. Dependencies

Accepted scope, approved content, authorized assets, confirmed CTA/contact details, agreed access method, client review availability, and any approved third-party services.

## 11. Risks and blockers

- Missing or unapproved content and assets
- Unconfirmed domain, hosting, integration, or legal responsibilities
- Conceptual placeholders remaining in production-ready work
- Delayed consolidated feedback
- Unapproved scope changes

## 12. Completion criteria

Agreed deliverables are present, deterministic QA items are resolved or accepted, approved content and assets are used, client review is complete, and handoff requirements are documented.

## 13. Deployment handoff

Deployment is not authorized by this pack. Hosting access, domain changes, backups, publishing, and rollback responsibility require a separate approved handoff.

## 14. Manual approval requirements

Manual approval is required for scope changes, final content, final assets, QA exceptions, deployment, and maintenance activation.
`;
}

export function renderQaAcceptancePlan(context: ClientPackContext): string {
  return `# QA Acceptance Plan: ${context.acceptance.clientName}

${fixtureNotice(context)}No checks were run by the client-pack command. Every acceptance area defaults to **NOT_STARTED**.

Supported statuses: NOT_STARTED, PASS, FAIL, UNKNOWN, NOT_APPLICABLE.

${qaAreas.map((area, index) => `## ${index + 1}. ${area}\n\n- Status: **NOT_STARTED**\n- Evidence: [ADD DURING QA]\n- Notes: [ADD DURING QA]`).join('\n\n')}

This plan does not claim full accessibility, SEO, legal, security, or performance compliance. Production-form submission requires explicit authorization and safe test data.
`;
}

export function renderMaintenancePlan(context: ClientPackContext): string {
  return `# Optional Monthly Website Care: ${context.acceptance.clientName}

${fixtureNotice(context)}Status: **PROPOSED — NO MAINTENANCE SUBSCRIPTION IS ACTIVE**

Existing range: **USD 100–300/month**

## Basic care — suggested USD 100/month

- Monthly availability check
- Dependency/content review when applicable
- One small content update
- Backup confirmation where supported
- Concise monthly status note

## Standard care — suggested USD 200/month

- Basic care
- Two small content updates
- Monthly link/form review
- Basic performance review
- Priority response during business hours

## Premium care — suggested USD 300/month

- Standard care
- Up to four small content updates
- Monthly Playwright smoke validation for agreed critical paths
- Monthly Lighthouse snapshot when available
- Monthly QA summary
- Quarterly improvement recommendations

## Suggested fit

Recommended editable starting point for **${context.acceptance.selectedOffer}**: **Standard care**, subject to actual update volume, integrations, and support expectations.

## Terms requiring agreement

- Final scope requires written agreement.
- Unused updates do not accumulate unless agreed.
- Redesigns and new functionality are excluded.
- Third-party fees are excluded.
- Emergency or after-hours support is excluded unless contracted.
- Maintenance does not guarantee uninterrupted third-party services.
- Renewal cadence: **[CONFIRM]**
- Cancellation terms: **[CONFIRM]**
- Maintenance start date: **[CONFIRM]**

Manual approval is required before maintenance can begin.
`;
}

function extractSection(markdown: string, heading: string, nextHeading: string): string {
  const start = markdown.indexOf(`## ${heading}`);
  const end = markdown.indexOf(`## ${nextHeading}`);
  if (start < 0 || end <= start) return 'Existing SOW section requires manual review.';
  return markdown.slice(start + `## ${heading}`.length, end).trim();
}

function fixtureNotice(context: ClientPackContext): string {
  return context.fictional
    ? '> Fictional validation fixture. This plan is test-only and authorizes no real client action.\n\n'
    : '';
}
