import { Lead, LeadScoreResult, RecommendedOffer } from '../leads/types';
import { ClientWorkflowDocument, ClientWorkflowInput, ClientWorkflowRecommendation, LocalWorkflowSource } from './types';

const auditPriceRange = '$199-$500';
const starterPriceRange = '$900-$1500';
const retainerPriceRange = '$1500-$3000/month';
const clientPreparationPackages = ['qa-audit', 'starter-pack', 'retainer'] as const;

export type ClientPreparationPackage = typeof clientPreparationPackages[number];

export function isSupportedClientPreparationPackage(value: string): value is ClientPreparationPackage {
  return clientPreparationPackages.includes(value as ClientPreparationPackage);
}

export function clientPreparationPackageToOffer(value: ClientPreparationPackage): RecommendedOffer {
  if (value === 'qa-audit') return 'qa-audit';
  if (value === 'starter-pack') return 'playwright-starter-pack';
  return 'qa-automation-retainer';
}

export function isEligibleForClientWorkflow(lead: Lead, score: LeadScoreResult): boolean {
  if (lead.status === 'paused' || lead.status === 'lost') return false;
  if (score.recommendedOffer === 'not-fit') return false;
  return score.score >= 6;
}

export function eligibilityFailureReason(lead: Lead, score: LeadScoreResult): string {
  if (lead.status === 'paused' || lead.status === 'lost') {
    return `Lead status is ${lead.status}. Reopen or requalify the lead before preparing a client workflow.`;
  }

  if (score.recommendedOffer === 'not-fit') {
    return 'Lead is currently scored as not-fit. Do not prepare client workflow assets until fit is requalified.';
  }

  return `Lead score is ${score.score}/10. Require score >= 6 before preparing first-client workflow assets.`;
}

export function buildClientPrepDocuments(input: ClientWorkflowInput): ClientWorkflowDocument[] {
  const recommendation = buildRecommendation(input.lead, input.score);

  return [
    discoveryCallPrep(input, recommendation),
    auditSalePlan(input, recommendation),
  ];
}

export function buildClientOnboardingDocuments(input: ClientWorkflowInput): ClientWorkflowDocument[] {
  const recommendation = buildRecommendation(input.lead, input.score);

  return [
    onboardingChecklist(input, recommendation),
    deliveryPlan(input, recommendation),
    retainerConversionPlan(input, recommendation),
  ];
}

function discoveryCallPrep(input: ClientWorkflowInput, recommendation: ClientWorkflowRecommendation): ClientWorkflowDocument {
  const { lead, score } = input;

  return doc('discovery-call-prep.md', 'Discovery Call Prep', [
    '# Discovery Call Prep',
    '',
    '## Lead Summary',
    '',
    bullets([
      `Company: ${lead.companyName}`,
      `Website: ${lead.website || 'Not provided'}`,
      `Industry: ${lead.industry}`,
      `Score: ${score.score}/10`,
      `Recommended offer: ${score.recommendedOffer}`,
      `Status: ${lead.status}`,
    ]),
    '',
    '## Business Context',
    '',
    bullets([
      lead.fitNotes || 'No fit notes recorded. Keep discovery focused on confirming real QA need.',
      `Known local pain points: ${lead.painPoints.join(', ') || 'none recorded'}.`,
      `Available local assets: ${availableSources(input).join('; ')}.`,
    ]),
    '',
    '## Likely QA Risks',
    '',
    bullets(likelyQaRisks(lead)),
    '',
    '## Discovery Questions',
    '',
    numbered(recommendation.discoveryQuestions),
    '',
    '## Qualification Questions',
    '',
    numbered(qualificationQuestions(lead)),
    '',
    '## Audit Opportunity',
    '',
    bullets([
      `Suggested first paid step: focused QA Audit in the ${recommendation.auditPriceRange} range.`,
      'Use the audit to confirm the highest-risk flows, evidence needs, and practical Playwright opportunities.',
      'Do not claim guaranteed defects, performance gains, revenue lift, compliance, or complete coverage.',
    ]),
    '',
    '## Retainer Opportunity',
    '',
    bullets(retainerOpportunity(lead, score)),
    '',
    '## Red Flags',
    '',
    bullets(redFlags(lead, input)),
    '',
    '## Call Goals',
    '',
    bullets([
      'Confirm the highest-risk workflow and business impact.',
      'Confirm what environments and data are safe to review without storing credentials.',
      'Decide whether a paid audit, starter pack, retainer discussion, or no action is appropriate.',
      'Agree on a manual next step after Daniel reviews scope and pricing.',
    ]),
    '',
    '## Next Step Options',
    '',
    bullets([
      `QA Audit: ${recommendation.auditPriceRange}`,
      `Playwright Starter Pack: ${recommendation.starterPriceRange}`,
      `QA Automation Retainer: ${recommendation.retainerPriceRange}`,
      'No action if discovery does not confirm a real QA need.',
    ]),
    '',
    humanApprovalBlock(),
  ]);
}

function auditSalePlan(input: ClientWorkflowInput, recommendation: ClientWorkflowRecommendation): ClientWorkflowDocument {
  const { lead, score } = input;

  return doc('audit-sale-plan.md', 'Audit Sale Plan', [
    '# Audit Sale Plan',
    '',
    '## Why This Company Fits',
    '',
    bullets([
      `${lead.companyName} has local QA fit signals around ${lead.painPoints.join(', ') || 'release confidence and repeatable testing'}.`,
      `Lead score is ${score.score}/10 with recommended offer ${score.recommendedOffer}.`,
      `Industry context: ${lead.industry}.`,
    ]),
    '',
    '## Suggested Audit Scope',
    '',
    bullets(recommendation.suggestedAuditScope),
    '',
    '## Suggested Deliverables',
    '',
    bullets([
      'Executive QA risk summary.',
      'Prioritized findings or review notes based only on approved evidence.',
      'Playwright opportunity list for safe smoke coverage.',
      'Automation roadmap with audit, starter pack, and retainer options.',
      'Client-ready markdown or HTML summary after Daniel approval.',
    ]),
    '',
    '## Suggested Price Range',
    '',
    bullets([
      `QA Audit: ${recommendation.auditPriceRange}`,
      `Playwright Starter Pack: ${recommendation.starterPriceRange}`,
      `Retainer: ${recommendation.retainerPriceRange}`,
      'Recommended first sale: QA Audit unless discovery confirms a larger starter scope is safer and clearer.',
    ]),
    '',
    '## Expected Outcome',
    '',
    bullets([
      'Client gets a clear, bounded view of QA risk and practical next steps.',
      'Daniel gets enough evidence to recommend a starter suite or retainer only if justified.',
      'No quality, revenue, compliance, accessibility, performance, or production-readiness outcome is guaranteed.',
    ]),
    '',
    '## Upgrade Path',
    '',
    bullets(upgradePath(score.recommendedOffer)),
    '',
    '## Manual Approval Notes',
    '',
    bullets([
      'Daniel must approve scope, price, wording, evidence, and next step before sending anything.',
      'Do not create invoices, payment links, calendar automation, or contracts from this command.',
      'Do not reference audit findings unless local evidence exists and has been reviewed manually.',
    ]),
  ]);
}

function onboardingChecklist(input: ClientWorkflowInput, recommendation: ClientWorkflowRecommendation): ClientWorkflowDocument {
  const { lead } = input;

  return doc('onboarding-checklist.md', 'Client Onboarding Checklist', [
    '# Client Onboarding Checklist',
    '',
    '## Client Information',
    '',
    checklist([
      `Confirm legal/client-facing company name for ${lead.companyName}`,
      `Confirm primary website is ${lead.website || 'not recorded'}`,
      'Confirm approved point of contact manually',
      'Confirm billing or invoice process outside this system',
    ]),
    '',
    '## Access Requirements',
    '',
    checklist([
      'Confirm staging URL if available',
      'Confirm production URL if public review is approved',
      'Confirm approved test account availability without storing credentials in this repo',
      'Confirm environment info needed to run non-destructive checks',
      'Confirm deployment schedule or release cadence',
      'Confirm which flows are off-limits',
    ]),
    '',
    '## Project Scope',
    '',
    checklist(recommendation.suggestedAuditScope),
    '',
    '## Success Criteria',
    '',
    checklist([
      'Client receives a clear QA risk summary',
      'Client receives prioritized recommendations',
      'Approved Playwright opportunities are identified',
      'No unsupported metrics or guaranteed outcomes are included',
    ]),
    '',
    '## Communication Preferences',
    '',
    checklist([
      'Confirm preferred communication channel manually',
      'Confirm response expectations and timezone',
      'Confirm report delivery format',
      'Confirm review meeting or async handoff preference',
    ]),
    '',
    '## Risks',
    '',
    checklist([
      'Avoid storing credentials, secrets, private data, or sensitive screenshots',
      'Avoid production form submissions and payment testing unless explicitly approved',
      'Avoid scope creep beyond approved audit or starter tasks',
      'Avoid claiming compliance, accessibility certification, or production readiness',
    ]),
    '',
    '## Approval Items',
    '',
    checklist([
      'Scope approved by Daniel',
      'Client-safe environments approved',
      'Evidence handling approved',
      'Final price approved',
      'Delivery timeline approved',
      'Human approval complete before work starts',
    ]),
  ]);
}

function deliveryPlan(input: ClientWorkflowInput, recommendation: ClientWorkflowRecommendation): ClientWorkflowDocument {
  const { lead, score } = input;
  const plan = weeklyPlan(score.recommendedOffer);

  return doc('delivery-plan.md', 'Delivery Plan', [
    '# Delivery Plan',
    '',
    '## Week 1',
    '',
    bullets(plan.week1),
    '',
    '## Week 2',
    '',
    bullets(plan.week2),
    '',
    '## Week 3',
    '',
    bullets(plan.week3),
    '',
    '## Week 4',
    '',
    bullets(plan.week4),
    '',
    '## Manual Review Notes',
    '',
    bullets([
      `Lead: ${lead.companyName}`,
      `Recommended offer path: ${score.recommendedOffer}`,
      `Price ranges: Audit ${recommendation.auditPriceRange}; Starter ${recommendation.starterPriceRange}; Retainer ${recommendation.retainerPriceRange}.`,
      'Adjust timeline after discovery. Do not promise full coverage or guaranteed outcomes.',
    ]),
  ]);
}

function retainerConversionPlan(input: ClientWorkflowInput, recommendation: ClientWorkflowRecommendation): ClientWorkflowDocument {
  const { lead, score } = input;

  return doc('retainer-conversion-plan.md', 'Retainer Conversion Plan', [
    '# Retainer Conversion Plan',
    '',
    '## Value Delivered',
    '',
    bullets([
      'Audit evidence and QA risk summary.',
      'Prioritized Playwright opportunities for repeatable smoke coverage.',
      'Clear next-step roadmap after reviewed evidence.',
      'Delivery artifacts that can be reused for monthly QA reporting if a retainer is justified.',
    ]),
    '',
    '## Expansion Opportunities',
    '',
    bullets(expansionOpportunities(lead)),
    '',
    '## Suggested Retainer Scope',
    '',
    bullets([
      `Suggested range: ${recommendation.retainerPriceRange}`,
      'Maintain approved Playwright smoke and regression checks.',
      'Add coverage for high-value flows confirmed during delivery.',
      'Review failures and provide concise evidence for product or engineering teams.',
    ]),
    '',
    '## Monthly Deliverables',
    '',
    bullets([
      'Maintained smoke suite for approved flows.',
      'New or updated tests for agreed changes.',
      'Monthly QA risk and coverage report.',
      'Short recommendation list for next automation priorities.',
    ]),
    '',
    '## Renewal Conversation Topics',
    '',
    bullets([
      'Which failures or risks were caught earlier because of this work?',
      'Which workflows still create release anxiety?',
      'What changed in the product roadmap that should affect QA coverage?',
      'Would monthly maintenance reduce support load or release friction?',
    ]),
    '',
    '## Manual Review Notes',
    '',
    bullets([
      `Current recommended offer: ${score.recommendedOffer}.`,
      'Retainer conversion should be earned through reviewed delivery value, not promised upfront.',
      'Do not create invoices, payment links, recurring billing, or CRM records from this command.',
      'Human approval is required before proposing retainer terms.',
    ]),
  ]);
}

function buildRecommendation(lead: Lead, score: LeadScoreResult): ClientWorkflowRecommendation {
  return {
    primaryOffer: score.recommendedOffer,
    auditPriceRange,
    starterPriceRange,
    retainerPriceRange,
    suggestedAuditScope: suggestedAuditScope(lead, score.recommendedOffer),
    discoveryQuestions: discoveryQuestions(lead),
  };
}

function suggestedAuditScope(lead: Lead, offer: RecommendedOffer): string[] {
  const scope = [
    `Review approved public or provided flows for ${lead.companyName}`,
    'Capture evidence only from approved non-destructive checks',
    'Identify top QA risks and practical Playwright smoke-test opportunities',
  ];

  for (const painPoint of lead.painPoints.slice(0, 5)) {
    scope.push(`Review local pain point: ${painPoint}`);
  }

  if (offer === 'qa-automation-retainer' || offer === 'agency-partner-retainer') {
    scope.push('Assess whether recurring QA support is justified after the audit');
  }

  return scope;
}

function discoveryQuestions(lead: Lead): string[] {
  const questions = [
    'Which user flow creates the most business risk if it breaks?',
    'How do you currently validate releases before they go live?',
    'Which regressions have caused the most support load or engineering rework?',
    'Do you already have any automated tests, and where are they unreliable or missing?',
    'How often do you deploy product changes?',
    'Which environments are safe for non-destructive QA review?',
    'Are there public flows that can be reviewed without credentials?',
    'Which flows require staging or a safe test account?',
    'What should not be tested without explicit approval?',
    'What would make a small QA audit clearly useful for the team?',
    'Which Playwright smoke checks would create the most confidence before release?',
    'Who reviews QA findings and decides what gets fixed?',
  ];

  if (lead.painPoints.some((painPoint) => painPoint.toLowerCase().includes('payment'))) {
    questions.push('Which payment-adjacent paths can be reviewed without using real payment data?');
  }

  if (lead.painPoints.some((painPoint) => painPoint.toLowerCase().includes('mobile'))) {
    questions.push('Which mobile viewport or device class matters most for core flows?');
  }

  if (lead.painPoints.some((painPoint) => painPoint.toLowerCase().includes('onboarding'))) {
    questions.push('Where do users most often drop off or get blocked during onboarding?');
  }

  return questions.slice(0, 15);
}

function qualificationQuestions(lead: Lead): string[] {
  return [
    `Is ${lead.companyName} actively investing in QA or release confidence this month?`,
    'Is there a clear owner for QA, product quality, or release readiness?',
    'Is the team willing to approve safe environments and test boundaries?',
    'Is a paid audit budget realistic if the scope is small and practical?',
    'Would a starter Playwright suite be valuable after the audit if opportunities are confirmed?',
  ];
}

function likelyQaRisks(lead: Lead): string[] {
  const risks = lead.painPoints.map((painPoint) => `Potential risk to validate in discovery: ${painPoint}.`);

  if (risks.length > 0) return risks;

  return [
    'Potential release confidence risk around the highest-value customer workflow.',
    'Potential regression risk if key flows are checked manually or inconsistently.',
    'Potential evidence gap if failures are not captured with repeatable screenshots, traces, or reports.',
  ];
}

function retainerOpportunity(lead: Lead, score: LeadScoreResult): string[] {
  if (score.recommendedOffer === 'qa-automation-retainer' || score.recommendedOffer === 'agency-partner-retainer') {
    return [
      'Retainer may be appropriate after audit or starter delivery confirms recurring release risk.',
      `Local fit notes: ${lead.fitNotes || 'No fit notes recorded.'}`,
      `Suggested range: ${retainerPriceRange}`,
    ];
  }

  return [
    'Do not lead with retainer. Use audit or starter delivery to prove value first.',
    `Possible later range if justified: ${retainerPriceRange}`,
  ];
}

function redFlags(lead: Lead, input: ClientWorkflowInput): string[] {
  const flags = [
    lead.website ? '' : 'No website recorded.',
    input.auditPack.exists ? '' : 'No local audit pack detected.',
    input.contactReview.exists ? '' : 'No local contact review detected.',
    'Client asks for production credentials, payment testing, scraping, or unbounded scope.',
    'Client expects guaranteed revenue, compliance, accessibility certification, or perfect coverage.',
  ].filter(Boolean);

  return flags;
}

function upgradePath(offer: RecommendedOffer): string[] {
  if (offer === 'agency-partner-retainer') {
    return [
      'QA Audit -> Agency Partner Retainer',
      'Use partner-retainer positioning only after one project or workflow proves repeatable value.',
    ];
  }

  if (offer === 'qa-automation-retainer') {
    return [
      'QA Audit -> Playwright Starter Pack -> QA Automation Retainer',
      'Use retainer positioning after evidence confirms recurring release risk and maintenance need.',
    ];
  }

  return [
    'QA Audit -> Playwright Starter Pack -> QA Automation Retainer',
    'Keep the first offer small unless discovery confirms the client is ready for implementation.',
  ];
}

function weeklyPlan(offer: RecommendedOffer): { week1: string[]; week2: string[]; week3: string[]; week4: string[] } {
  if (offer === 'qa-audit') {
    return {
      week1: ['Confirm scope, URLs, boundaries, and evidence handling.', 'Run approved review and collect findings.', 'Draft audit summary and recommendations.'],
      week2: ['Review findings with Daniel.', 'Deliver approved audit report.', 'Identify follow-up Playwright opportunities.'],
      week3: ['Prepare optional starter-pack scope if client shows interest.', 'Clarify priority flows and environment needs.', 'Avoid implementation work until approved.'],
      week4: ['Review whether retainer or starter scope is justified.', 'Prepare manual follow-up recommendations.', 'Archive delivery notes locally.'],
    };
  }

  if (offer === 'playwright-starter-pack') {
    return {
      week1: ['Confirm approved flows, environment, and test boundaries.', 'Set up Playwright framework structure.', 'Create first smoke test skeleton.'],
      week2: ['Build smoke coverage for 1-3 approved flows.', 'Add stable locators and Page Object Model separation.', 'Configure HTML report and failure evidence.'],
      week3: ['Stabilize tests locally.', 'Document run instructions and environment placeholders.', 'Review CI readiness without adding secrets.'],
      week4: ['Deliver starter suite and coverage notes.', 'Review next automation priorities.', 'Discuss monthly maintenance only if justified.'],
    };
  }

  return {
    week1: ['Confirm monthly scope, approved workflows, and evidence handling.', 'Review existing QA assets and current release risks.', 'Prioritize first smoke/regression targets.'],
    week2: ['Maintain or create approved smoke coverage.', 'Review failures and document risk evidence.', 'Prepare concise progress notes.'],
    week3: ['Expand coverage for one agreed high-value flow.', 'Clean up flaky checks and improve reporting.', 'Review upcoming release risks.'],
    week4: ['Deliver monthly QA summary.', 'Recommend next coverage priorities.', 'Prepare renewal or next-month scope discussion.'],
  };
}

function expansionOpportunities(lead: Lead): string[] {
  const opportunities = [
    'Expand smoke coverage around confirmed high-risk flows.',
    'Add reporting and failure evidence to support release decisions.',
  ];

  for (const painPoint of lead.painPoints.slice(0, 4)) {
    opportunities.push(`Expand coverage around ${painPoint}.`);
  }

  return opportunities;
}

function availableSources(input: ClientWorkflowInput): string[] {
  return [input.researchPack, input.auditPack, input.outreachPack, input.contactReview]
    .filter((source) => source.exists)
    .map((source) => `${source.label} at ${source.path}`);
}

export function sourceSummary(sources: LocalWorkflowSource[]): string[] {
  return sources.map((source) => `${source.label}: ${source.exists ? source.path : `missing at ${source.path}`}`);
}

function doc(fileName: ClientWorkflowDocument['fileName'], title: string, lines: string[]): ClientWorkflowDocument {
  return {
    fileName,
    title,
    body: `${lines.join('\n').trim()}\n`,
  };
}

function bullets(lines: string[]): string {
  return lines.map((line) => `- ${line}`).join('\n');
}

function numbered(lines: string[]): string {
  return lines.map((line, index) => `${index + 1}. ${line}`).join('\n');
}

function checklist(lines: string[]): string {
  return lines.map((line) => `- [ ] ${line}`).join('\n');
}

function humanApprovalBlock(): string {
  return `## Human Approval Required

- Daniel must approve call notes, pricing, scope, and next steps before sending anything.
- Do not send outreach, create invoices, create payment links, automate calls, use credentials, or connect CRM tools.
- Use this as a local preparation artifact only.`;
}
