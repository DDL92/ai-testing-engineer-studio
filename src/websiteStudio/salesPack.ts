import type { SalesPackContext, SalesPackJson } from './salesTypes';

export function buildSalesPackJson(context: SalesPackContext): SalesPackJson {
  const { record, leadPack, audit, validation, recommendedChannel, recommendedCTA } = context;
  return {
    leadId: record.lead.id,
    businessName: record.lead.companyName,
    generatedAt: new Date().toISOString(),
    leadDecision: record.analysis.decision,
    leadScore: record.analysis.score,
    primaryOffer: leadPack.recommendedPrimaryOffer,
    priceRange: leadPack.priceRange,
    recurringOffer: leadPack.recurringMaintenanceAngle,
    evidenceSummary: [
      ...leadPack.verifiedOpportunitySignals.map((signal) => `Verified existing signal: ${signal}.`),
      ...context.visualBrief.suppliedInformation.map((item) => `Supplied information: ${item}`),
      `Conceptual demo validation: ${validation.overallStatus}.`,
      `Current-site audit: ${auditStatus(audit)}.`,
    ],
    evidenceGaps: unique([...leadPack.evidenceGaps, ...audit.evidenceLimitations, ...context.limitations]),
    demoValidationStatus: validation.overallStatus,
    auditStatus: auditStatus(audit),
    outreachDraftPaths: ['outreach-drafts.md'],
    proposalPath: 'proposal.md',
    sowPath: 'sow.md',
    followUpPlanPath: 'follow-up-plan.md',
    approvalChecklistPath: 'approval-checklist.md',
    recommendedChannel,
    recommendedCTA,
    salesStatus: 'draft',
    manualReviewRequired: true,
    sent: false,
    approved: false,
  };
}

export function renderFollowUpPlan(context: SalesPackContext): string {
  const evidence = context.leadPack.verifiedOpportunitySignals[0] ?? 'current website situation requires confirmation';
  const fixture = context.fictional
    ? '> Fictional validation plan. Do not send or schedule any step.\n\n'
    : '';
  return `# Manual Follow-up Plan: ${context.record.lead.companyName}

${fixture}Nothing in this plan is scheduled or sent. Stop after Day 7 unless the lead replies.

## Day 0 — Initial manual message

- Purpose: Ask permission to share the conceptual demo without assuming interest.
- Draft to use: Short email or LinkedIn/direct-message version, selected after contact verification.
- Evidence to mention: ${evidence}.
- Desired CTA: ${context.recommendedCTA}.
- Status: [ ] Not reviewed  [ ] Approved  [ ] Sent manually

## Day 3 — First manual follow-up

- Purpose: Provide one concise reminder and make response easy.
- Draft to use: Follow-up message.
- Evidence to mention: The demo is conceptual and uses only supplied or previously verified context.
- Desired CTA: Confirmation of interest or a clear decline.
- Status: [ ] Not reviewed  [ ] Approved  [ ] Sent manually  [ ] Stop requested

## Day 7 — Final manual follow-up

- Purpose: Close the loop respectfully.
- Draft to use: Follow-up message, edited to state this is the final follow-up.
- Evidence to mention: No new claims; refer only to the previously mentioned conceptual demo.
- Desired CTA: Confirmation of interest; otherwise close the sequence.
- Status: [ ] Not reviewed  [ ] Approved  [ ] Sent manually  [ ] Sequence closed

After Day 7: stop unless the lead replies. Do not create additional automated follow-ups.
`;
}

export function renderApprovalChecklist(context: SalesPackContext): string {
  const fixture = context.fictional
    ? '> Fictional validation pack: manual send must remain unauthorized.\n\n'
    : '';
  return `# Sales Pack Approval Checklist

${fixture}This pack is a draft and is **not ready to send automatically**.

- [ ] Business identity verified
- [ ] Contact method publicly available or legitimately obtained
- [ ] Audit evidence reviewed
- [ ] Conceptual demo reviewed
- [ ] Placeholders removed or clearly labeled
- [ ] Screenshots reviewed
- [ ] No unauthorized assets
- [ ] No unsupported claims
- [ ] Offer and price reviewed
- [ ] Timeline reviewed
- [ ] Scope and exclusions reviewed
- [ ] Privacy/commercial-email requirements considered
- [ ] Sender identity and signature completed
- [ ] Opt-out language considered where applicable
- [ ] Final message approved manually
- [ ] Manual send authorized

Current status: **DRAFT — NOT APPROVED — NOT SENT**
`;
}

function auditStatus(audit: SalesPackContext['audit']): string {
  if (audit.reachable === true) return 'reachable';
  if (!audit.auditedUrl) return 'not applicable; no website URL was audited';
  return audit.checks.urlLoads?.status === 'UNKNOWN' ? 'unknown' : 'unavailable or skipped';
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
