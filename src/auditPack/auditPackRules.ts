import { Lead, LeadScoreResult, RecommendedOffer } from '../leads/types';
import { AuditPack, AuditPackDocument, AuditPackInput, LocalMarkdownSource } from './types';

const offerPriceRanges: Record<RecommendedOffer, string> = {
  'qa-audit': '$199-$500 focused QA Audit Pack',
  'playwright-starter-pack': '$900-$1,500 Playwright Starter Pack',
  'qa-automation-retainer': '$1,500-$3,000/month QA Automation Retainer',
  'agency-partner-retainer': '$1,500-$3,000/month agency QA partner retainer',
  'not-fit': 'No paid offer until fit is requalified',
};

export function buildAuditPack(input: AuditPackInput): AuditPack {
  const sourceSummary = buildSourceSummary(input.researchPack, input.auditReport);

  return {
    leadId: input.lead.id,
    companyName: input.lead.companyName,
    generatedAt: new Date().toISOString(),
    sourceSummary,
    documents: [
      executiveSummary(input, sourceSummary),
      qaRiskSummary(input),
      playwrightOpportunities(input),
      automationRoadmap(input),
      retainerRecommendation(input),
    ],
  };
}

export function isQualifiedForAuditPack(lead: Lead, score: LeadScoreResult): boolean {
  if (lead.status === 'lost' || lead.status === 'paused') return false;
  if (score.recommendedOffer === 'not-fit') return false;
  return score.score >= 4;
}

export function qualificationFailureReason(lead: Lead, score: LeadScoreResult): string {
  if (lead.status === 'lost' || lead.status === 'paused') {
    return `Lead status is ${lead.status}. Reopen or requalify the lead before generating a sellable audit pack.`;
  }

  if (score.recommendedOffer === 'not-fit') {
    return 'Lead is currently scored as not-fit. Add stronger QA-fit evidence before generating an audit pack.';
  }

  return `Lead score is ${score.score}/10. Require at least 4/10 before generating an audit pack.`;
}

function executiveSummary(input: AuditPackInput, sourceSummary: string[]): AuditPackDocument {
  const { lead, score } = input;
  const auditExecutiveSummary = sectionLines(input.auditReport.content, 'Executive Summary', 8);
  const researchFit = sectionLines(input.researchPack.content, 'Why This May Be A Good Fit', 5);

  return doc('executive-summary.md', `Executive Summary: ${lead.companyName}`, [
    `# Executive Summary: ${lead.companyName}`,
    '',
    '## Positioning',
    '',
    bullets([
      `Lead: ${lead.companyName}`,
      `Website: ${lead.website || 'Not provided'}`,
      `Industry: ${lead.industry}`,
      `Local score: ${score.score}/10`,
      `Recommended offer: ${score.recommendedOffer}`,
      `Sellable package: ${offerPriceRanges[score.recommendedOffer]}`,
    ]),
    '',
    '## Why This Pack Exists',
    '',
    bullets([
      `This pack turns local lead qualification, research notes, and available audit evidence into a scoped QA Audit Pack for manual review.`,
      `Primary business angle: ${lead.fitNotes || 'Review lead fit manually before positioning the offer.'}`,
      `Recorded QA pain points: ${lead.painPoints.join(', ') || 'None recorded. Do not invent client-specific pain points.'}`,
    ]),
    '',
    '## Evidence Reused',
    '',
    bullets(sourceSummary),
    '',
    '## Current Audit Evidence',
    '',
    bullets(auditExecutiveSummary.length > 0 ? auditExecutiveSummary : missingAuditEvidence()),
    '',
    '## Research Signals',
    '',
    bullets(researchFit.length > 0 ? researchFit : missingResearchEvidence()),
    '',
    humanApprovalBlock(),
  ]);
}

function qaRiskSummary(input: AuditPackInput): AuditPackDocument {
  const { lead } = input;
  const auditRisk = sectionLines(input.auditReport.content, 'QA Risk Assessment', 8);
  const severitySummary = sectionLines(input.auditReport.content, 'Severity Summary', 5);
  const researchRisks = sectionLines(input.researchPack.content, 'Potential QA Risk Areas', 8);

  return doc('qa-risk-summary.md', `QA Risk Summary: ${lead.companyName}`, [
    `# QA Risk Summary: ${lead.companyName}`,
    '',
    '## Risk Framing',
    '',
    bullets([
      'This is a cautious sales-support summary, not a defect report.',
      'Every finding must be manually reviewed before it is shared with a lead or client.',
      'No compliance, accessibility certification, performance score, or production-readiness claim is made.',
    ]),
    '',
    '## Audit Severity Snapshot',
    '',
    bullets(severitySummary.length > 0 ? severitySummary : missingAuditEvidence()),
    '',
    '## Audit Risk Notes',
    '',
    bullets(auditRisk.length > 0 ? auditRisk : missingAuditEvidence()),
    '',
    '## Research-Based Risk Areas',
    '',
    bullets(researchRisks.length > 0 ? researchRisks : fallbackRiskAreas(lead)),
    '',
    '## Manual Review Checklist',
    '',
    checklist([
      'Confirm the audit output matches the correct company and URL.',
      'Open the saved screenshot evidence before calling anything a finding.',
      'Remove unsupported claims, guessed metrics, or client-specific assumptions.',
      'Confirm the proposed audit scope is non-destructive and does not require credentials.',
      'Approve the final wording before any client-facing use.',
    ]),
    '',
    humanApprovalBlock(),
  ]);
}

function playwrightOpportunities(input: AuditPackInput): AuditPackDocument {
  const { lead } = input;
  const auditOpportunities = sectionLines(input.auditReport.content, 'Automation Opportunities', 8);
  const researchOpportunities = sectionLines(input.researchPack.content, 'Potential Automation Opportunities', 8);

  return doc('playwright-opportunities.md', `Playwright Opportunities: ${lead.companyName}`, [
    `# Playwright Opportunities: ${lead.companyName}`,
    '',
    '## Best First Playwright Scenarios',
    '',
    bullets(bestFirstScenarios(lead, auditOpportunities, researchOpportunities)),
    '',
    '## Audit-Derived Opportunities',
    '',
    bullets(auditOpportunities.length > 0 ? auditOpportunities : missingAuditEvidence()),
    '',
    '## Research-Derived Opportunities',
    '',
    bullets(researchOpportunities.length > 0 ? researchOpportunities : missingResearchEvidence()),
    '',
    '## Implementation Standards',
    '',
    bullets([
      'Use Playwright + TypeScript with Page Object Model separation.',
      'Use Arrange-Act-Assert in test files.',
      'Prefer getByRole, getByLabel, getByPlaceholder, and data-testid before locator.',
      'Avoid hard waits and brittle nth() selectors.',
      'Run locally first, then add CI only after stable smoke coverage exists.',
    ]),
    '',
    humanApprovalBlock(),
  ]);
}

function automationRoadmap(input: AuditPackInput): AuditPackDocument {
  const { lead, score } = input;

  return doc('automation-roadmap.md', `Automation Roadmap: ${lead.companyName}`, [
    `# Automation Roadmap: ${lead.companyName}`,
    '',
    '## Phase 1: Audit Pack Delivery',
    '',
    bullets([
      'Review local lead data, research pack, audit report, and screenshot evidence.',
      'Deliver a concise QA risk summary with confirmed evidence only.',
      'Identify 1-3 safe smoke-test candidates for a follow-up Playwright scope.',
    ]),
    '',
    '## Phase 2: Playwright Starter Scope',
    '',
    bullets([
      'Create a small Playwright + TypeScript smoke suite for approved public or staging-safe flows.',
      'Use clean page objects and stable locators.',
      'Capture trace, screenshots, and HTML report on failure.',
      'Keep coverage narrow enough to deliver quickly and maintain confidence.',
    ]),
    '',
    '## Phase 3: CI/CD Readiness',
    '',
    bullets([
      'Run smoke checks in CI after local stability is proven.',
      'Document required environment variables with placeholders only.',
      'Avoid real client credentials in code, logs, reports, and screenshots.',
      'Track flaky behavior separately from confirmed product issues.',
    ]),
    '',
    '## Phase 4: Retainer Expansion',
    '',
    bullets(retainerExpansionPath(lead, score)),
    '',
    '## Suggested Next Local Commands',
    '',
    bullets(suggestedNextCommands(lead)),
    '',
    humanApprovalBlock(),
  ]);
}

function retainerRecommendation(input: AuditPackInput): AuditPackDocument {
  const { lead, score } = input;
  const retainerFit = buildRetainerFit(lead, score);

  return doc('retainer-recommendation.md', `Retainer Recommendation: ${lead.companyName}`, [
    `# Retainer Recommendation: ${lead.companyName}`,
    '',
    '## Recommendation',
    '',
    bullets([
      `Recommended offer path: ${score.recommendedOffer}`,
      `Commercial range: ${offerPriceRanges[score.recommendedOffer]}`,
      retainerFit.recommendation,
    ]),
    '',
    '## Why',
    '',
    bullets(retainerFit.reasons),
    '',
    '## Retainer Scope Candidates',
    '',
    bullets([
      'Monthly smoke-suite maintenance and regression review.',
      'New flow coverage for approved releases or high-risk product changes.',
      'Bug reproduction support with trace, screenshot, and concise evidence.',
      'Monthly QA report summarizing coverage, risk areas, and recommended next tests.',
    ]),
    '',
    '## Conditions Before Pitching Retainer',
    '',
    checklist([
      'The audit pack has been reviewed and approved by Daniel.',
      'A real recurring release or regression risk has been confirmed.',
      'The client has agreed which environments, users, and data are safe to test.',
      'Pricing and scope have been reviewed before sending a SOW or proposal.',
    ]),
    '',
    humanApprovalBlock(),
  ]);
}

function doc(fileName: AuditPackDocument['fileName'], title: string, lines: string[]): AuditPackDocument {
  return {
    fileName,
    title,
    body: `${lines.join('\n').trim()}\n`,
  };
}

function buildSourceSummary(researchPack: LocalMarkdownSource, auditReport: LocalMarkdownSource): string[] {
  return [
    `${researchPack.label}: ${researchPack.exists ? researchPack.path : `missing at ${researchPack.path}`}`,
    `${auditReport.label}: ${auditReport.exists ? auditReport.path : `missing at ${auditReport.path}`}`,
    'No scraping, external APIs, browsing, outreach, or credentialed access was performed by this generator.',
  ];
}

function sectionLines(markdown: string | undefined, heading: string, limit: number): string[] {
  if (!markdown) return [];

  const lines = markdown.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (headingIndex === -1) return [];

  const body: string[] = [];
  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (line.startsWith('## ')) break;
    if (!line || line.startsWith('#')) continue;
    body.push(cleanMarkdownLine(line));
  }

  return body.filter(Boolean).slice(0, limit);
}

function cleanMarkdownLine(line: string): string {
  return line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').trim();
}

function bullets(lines: string[]): string {
  return lines.map((line) => `- ${line}`).join('\n');
}

function checklist(lines: string[]): string {
  return lines.map((line) => `- [ ] ${line}`).join('\n');
}

function missingAuditEvidence(): string[] {
  return [
    'No local audit output was found for this lead. Run `npm run audit:site -- --url <lead website>` only after confirming the target is approved for passive review.',
    'Until audit evidence exists, keep findings framed as potential review areas, not confirmed defects.',
  ];
}

function missingResearchEvidence(): string[] {
  return [
    'No local research pack was found for this lead. Run `npm run lead:research -- --id <lead_id>` to create one from existing local lead data.',
    'Until research notes exist, use only the lead record and avoid invented company-specific claims.',
  ];
}

function fallbackRiskAreas(lead: Lead): string[] {
  const risks = lead.painPoints.map((painPoint) => `Potential area for manual review: ${painPoint}.`);

  if (risks.length > 0) return risks;

  return [
    'Potential area for manual review: critical public user flow reliability.',
    'Potential area for manual review: regression risk around the highest-value customer path.',
  ];
}

function bestFirstScenarios(lead: Lead, auditOpportunities: string[], researchOpportunities: string[]): string[] {
  const scenarios = new Set<string>();

  scenarios.add('Homepage smoke test: load the approved URL, verify title or main landmark, and capture evidence on failure.');

  for (const opportunity of [...auditOpportunities, ...researchOpportunities]) {
    const text = opportunity.toLowerCase();
    if (text.includes('navigation')) scenarios.add('Navigation smoke test: verify critical links or navigation landmarks are visible before clicking deeper flows.');
    if (text.includes('signup') || text.includes('onboarding')) scenarios.add('Signup/onboarding smoke test: validate only approved non-destructive steps.');
    if (text.includes('booking') || text.includes('scheduling')) scenarios.add('Booking smoke test: validate availability or booking entry points without submitting real reservations.');
    if (text.includes('checkout') || text.includes('payment')) scenarios.add('Checkout smoke test: validate cart or payment entry points without real transactions.');
    if (text.includes('api')) scenarios.add('API smoke test: validate approved health or read-only endpoints only when documentation is available.');
    if (text.includes('mobile')) scenarios.add('Mobile viewport smoke test: verify critical public flows at one approved mobile viewport.');
  }

  for (const painPoint of lead.painPoints) {
    const text = painPoint.toLowerCase();
    if (text.includes('regression')) scenarios.add('Regression smoke suite: cover the smallest repeatable set of high-value checks before each release.');
    if (text.includes('payment')) scenarios.add('Payment-adjacent smoke test: validate visible payment flow entry points without using real payment data.');
  }

  return Array.from(scenarios).slice(0, 7);
}

function retainerExpansionPath(lead: Lead, score: LeadScoreResult): string[] {
  const path = [
    'Start with a paid audit pack and manual findings review.',
    'Convert confirmed opportunities into a small Playwright Starter Pack.',
  ];

  if (score.recommendedOffer === 'qa-automation-retainer' || score.recommendedOffer === 'agency-partner-retainer') {
    path.push('Pitch monthly QA automation support only after recurring release risk is confirmed.');
  } else {
    path.push('Do not pitch a retainer first; use the audit and starter scope to prove value.');
  }

  if (lead.painPoints.some((painPoint) => painPoint.toLowerCase().includes('regression'))) {
    path.push('Use regression coverage as the clearest retainer expansion angle.');
  }

  return path;
}

function suggestedNextCommands(lead: Lead): string[] {
  const commands = [
    `npm run lead:research -- --id ${lead.id}`,
  ];

  if (lead.website) commands.push(`npm run audit:site -- --url ${lead.website}`);

  commands.push(`npm run audit:pack -- --id ${lead.id}`);
  commands.push(`npm run sow:generate -- --id ${lead.id}`);

  return commands;
}

function buildRetainerFit(lead: Lead, score: LeadScoreResult): { recommendation: string; reasons: string[] } {
  const reasons = [
    `Local score is ${score.score}/10.`,
    `Lead offer fit is ${score.recommendedOffer}.`,
    `Recorded pain points: ${lead.painPoints.join(', ') || 'none recorded'}.`,
  ];

  if (score.recommendedOffer === 'qa-automation-retainer' || score.recommendedOffer === 'agency-partner-retainer') {
    return {
      recommendation: 'Retainer is a reasonable follow-up path after a paid audit or starter implementation confirms recurring QA need.',
      reasons: [
        ...reasons,
        'The current recommended offer already points toward recurring QA value.',
        'Do not lead with retainer scope until audit evidence and discovery confirm ongoing release risk.',
      ],
    };
  }

  if (score.recommendedOffer === 'playwright-starter-pack') {
    return {
      recommendation: 'Retainer should be positioned as a later expansion after a starter suite proves value.',
      reasons: [
        ...reasons,
        'A bounded starter scope is the cleaner next sale than recurring support.',
      ],
    };
  }

  return {
    recommendation: 'Retainer is not the first offer. Sell the audit pack first and reassess after confirmed findings.',
    reasons: [
      ...reasons,
      'The local score supports a focused audit, not immediate recurring scope.',
    ],
  };
}

function humanApprovalBlock(): string {
  return `## Human Approval Required

- Daniel must review and approve this document before it is sent, quoted, copied into a proposal, or used in client communication.
- Do not send outreach from this command.
- Do not add claims from scraping, APIs, private credentials, or unreviewed screenshots.
- Use this as a local draft until manually approved.`;
}
