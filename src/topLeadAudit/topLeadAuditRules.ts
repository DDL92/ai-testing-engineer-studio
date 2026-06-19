import fs = require('fs');
import path = require('path');
import { buildEvidenceReadinessDecision } from '../evidenceEngine/evidenceRules';
import { buildLeadRotationDecision } from '../leadRotation/rotationRules';
import { buildMessageReview, writeMessagePack } from '../messageReview/messageRules';
import { getRevenueSourceOfTruth } from '../revenueIntelligence/sourceOfTruth';
import { buildPainMiningReport } from '../webPainMining/painMiningRules';
import {
  TopLeadAuditDashboard,
  TopLeadAuditEvidenceItem,
  TopLeadAuditPackage,
  TopLeadAuditReadinessCheck,
} from './types';

const outputRoot = path.join(process.cwd(), 'output', 'top-lead-audit');

const safetyRules = [
  'Top Lead Audit uses Revenue Intelligence as the only source of truth for the selected company.',
  'Preparation assets are local-only and review-only.',
  'No outreach, emails, LinkedIn messages, CRM records, meetings, invoices, payments, revenue, outcomes, replies, or client interest are created.',
  'No bugs, outages, vulnerabilities, lost sales, churn, or customer complaints are invented.',
  'Human approval is required before external action.',
];

export function buildTopLeadAuditPackage(): TopLeadAuditPackage {
  const source = getRevenueSourceOfTruth();
  const rotation = buildLeadRotationDecision();
  const topLead = rotation.actionableLead;

  if (!topLead) {
    const generatedAt = new Date().toISOString();
    const fallback = {
      generatedAt,
      companyId: slug(source.topLead),
      companyName: source.topLead,
      website: '',
      category: 'Unknown',
      recommendedOffer: source.recommendedOffer,
      revenueDecision: source.revenueDecision,
      executionPriority: source.executionPriority,
      nextRevenueAction: source.nextAction,
      qualificationScore: 0,
      qaOpportunityScore: 0,
      painSignalRelevance: 0,
      offerFitScore: 0,
      evidenceItems: [{ label: 'Revenue Intelligence', value: 'No unified top lead found.', source: 'Revenue Intelligence' }],
      topBusinessRisks: ['No actionable lead is available. Refresh Lead Qualification, Evidence Engine, and Lead Rotation.'],
      topPriorities: ['Run npm run lead:rotation and review output/lead-rotation/rotation-decision.md.'],
      proposalScope: ['No proposal scope is available until an actionable lead exists.'],
      readinessChecks: [] as TopLeadAuditReadinessCheck[],
      goNoGo: 'NO GO' as const,
      remainingBlockers: ['Revenue Intelligence has no unified top lead.'],
      safetyRules,
    };
    return { ...fallback, readinessChecks: buildReadinessChecks(fallback.companyName, fallback.companyId) };
  }

  const painSignals = buildPainMiningReport().signals.filter((signal) => normalizeKey(signal.companyName) === normalizeKey(topLead.companyName));
  const lead = topLead.sourceLead;
  const evidenceItems: TopLeadAuditEvidenceItem[] = [
    { label: 'Top Ranked Lead', value: rotation.topRankedLead?.companyName ?? 'No top ranked lead', source: 'Lead Rotation' },
    { label: 'Actionable Lead', value: topLead.companyName, source: 'Lead Rotation' },
    { label: 'Website', value: topLead.website || 'No website recorded.', source: 'Qualified Ranking' },
    { label: 'Category', value: topLead.category, source: 'Lead Qualification' },
    { label: 'Qualification Score', value: `${topLead.qualificationScore}/100`, source: 'Lead Qualification' },
    { label: 'QA Opportunity Score', value: `${topLead.qaOpportunityScore}/100`, source: 'Lead Qualification' },
    { label: 'Pain Confidence', value: `${topLead.painConfidence}/100`, source: 'Lead Rotation' },
    { label: 'Commercial Readiness', value: `${topLead.commercialReadinessScore}/100`, source: 'Lead Rotation' },
    { label: 'Source Query', value: lead.query || 'No query recorded.', source: 'Web Lead Discovery' },
    { label: 'Source Title', value: lead.sourceTitle || lead.rawName || 'No source title recorded.', source: 'Web Lead Discovery' },
    { label: 'Public Notes', value: lead.notes || 'No notes recorded.', source: 'Web Lead Discovery' },
    ...painSignals.slice(0, 3).map((signal): TopLeadAuditEvidenceItem => ({
      label: `Potential Pain Signal: ${signal.category}`,
      value: signal.cautiousSummary || signal.signal || 'Potential recurring pain signal recorded.',
      source: signal.sourceTitle || signal.source || signal.url,
    })),
  ];

  const packageData = {
    generatedAt: new Date().toISOString(),
    companyId: topLead.companyId,
    companyName: topLead.companyName,
    website: topLead.website,
    category: topLead.category,
    recommendedOffer: topLead.recommendedOffer,
    revenueDecision: rotation.rotationStatus,
    executionPriority: source.executionPriority,
    nextRevenueAction: `Review ${topLead.companyName} message pack and public evidence; decide manually whether to prepare a QA Audit offer.`,
    qualificationScore: topLead.qualificationScore,
    qaOpportunityScore: topLead.qaOpportunityScore,
    painSignalRelevance: topLead.painConfidence,
    offerFitScore: topLead.commercialReadinessScore,
    evidenceItems,
    topBusinessRisks: buildBusinessRisks(topLead.companyName, topLead.qaOpportunityScore, topLead.painConfidence, painSignals.map((signal) => signal.category)),
    topPriorities: buildPriorities(topLead.companyName, topLead.recommendedOffer),
    proposalScope: buildProposalScope(topLead.companyName, topLead.recommendedOffer),
    readinessChecks: [] as TopLeadAuditReadinessCheck[],
    goNoGo: 'NO GO' as const,
    remainingBlockers: [] as string[],
    safetyRules,
  };
  const readinessChecks = buildReadinessChecks(packageData.companyName, packageData.companyId);
  const missingBlockers = readinessChecks.filter((check) => check.status === 'Missing').map((check) => `${check.label}: ${check.evidence}`);
  const partialBlockers = readinessChecks.filter((check) => check.status === 'Partial').map((check) => `${check.label}: ${check.evidence}`);
  const goNoGo = missingBlockers.length === 0 && partialBlockers.length === 0 ? 'GO' : missingBlockers.length > 0 ? 'NO GO' : 'PARTIAL';
  return {
    ...packageData,
    readinessChecks,
    goNoGo,
    remainingBlockers: [...missingBlockers, ...partialBlockers],
  };
}

export function buildTopLeadAuditDashboard(): TopLeadAuditDashboard {
  const audit = buildTopLeadAuditPackage();
  const check = (label: string): string => audit.readinessChecks.find((item) => item.label === label)?.status ?? 'Missing';
  return {
    topLeadAuditStatus: check('Audit Package'),
    evidenceStatus: check('Evidence Package'),
    proposalStatus: check('Proposal Draft'),
    executionReadiness: audit.goNoGo,
  };
}

export function writeTopLeadEvidenceOutput(): string[] {
  const audit = buildTopLeadAuditPackage();
  return writeOutputs([
    { fileName: 'top-lead-evidence.md', body: renderTopLeadEvidence(audit) },
    { fileName: 'top-lead-readiness.md', body: renderTopLeadReadiness(buildTopLeadAuditPackage()) },
  ]);
}

export function writeTopLeadAuditOutput(): string[] {
  const audit = buildTopLeadAuditPackage();
  return writeOutputs([
    { fileName: 'top-lead-audit.md', body: renderTopLeadAudit(audit) },
    { fileName: 'top-lead-readiness.md', body: renderTopLeadReadiness(buildTopLeadAuditPackage()) },
  ]);
}

export function writeTopLeadExecutiveSummaryOutput(): string[] {
  const audit = buildTopLeadAuditPackage();
  return writeOutputs([
    { fileName: 'top-lead-executive-summary.md', body: renderTopLeadExecutiveSummary(audit) },
    { fileName: 'top-lead-readiness.md', body: renderTopLeadReadiness(buildTopLeadAuditPackage()) },
  ]);
}

export function writeTopLeadProposalOutput(): string[] {
  const audit = buildTopLeadAuditPackage();
  return writeOutputs([
    { fileName: 'top-lead-proposal.md', body: renderTopLeadProposal(audit) },
    { fileName: 'top-lead-readiness.md', body: renderTopLeadReadiness(buildTopLeadAuditPackage()) },
  ]);
}

export function writeTopLeadExecutionPackOutput(): string[] {
  const beforeMessage = buildTopLeadAuditPackage();
  if (beforeMessage.companyName && beforeMessage.companyName !== 'No unified top lead') {
    writeMessagePack(buildMessageReview(beforeMessage.companyName));
  }
  const audit = buildTopLeadAuditPackage();
  return writeOutputs([
    { fileName: 'top-lead-execution-pack.md', body: renderTopLeadExecutionPack(audit) },
    { fileName: 'top-lead-readiness.md', body: renderTopLeadReadiness(audit) },
  ]);
}

export function renderTopLeadEvidence(audit: TopLeadAuditPackage): string {
  return [
    '# Top Lead Evidence',
    '',
    `Generated: ${audit.generatedAt}`,
    '',
    renderList([
      `Company: ${audit.companyName}`,
      `Website: ${audit.website || 'No website recorded.'}`,
      `Recommended Offer: ${audit.recommendedOffer}`,
      `Revenue Decision: ${audit.revenueDecision}`,
    ]),
    '',
    '## Local Evidence',
    renderEvidenceTable(audit.evidenceItems),
    '',
    '## Evidence Boundary',
    renderList([
      'Evidence is assembled from existing local Studio outputs.',
      'This is not a full audit and does not confirm defects.',
      'Use potential, may indicate, and worth reviewing when uncertainty exists.',
    ]),
    '',
    '## Safety Rules',
    renderList(audit.safetyRules),
    '',
  ].join('\n');
}

export function renderTopLeadAudit(audit: TopLeadAuditPackage): string {
  return [
    '# Top Lead Audit',
    '',
    `Generated: ${audit.generatedAt}`,
    '',
    renderList([
      `Company: ${audit.companyName}`,
      `Category: ${audit.category}`,
      `Recommended Offer: ${audit.recommendedOffer}`,
      `Qualification Score: ${audit.qualificationScore}/100`,
      `QA Opportunity Score: ${audit.qaOpportunityScore}/100`,
    ]),
    '',
    '## Top Business Risks',
    renderNumbered(audit.topBusinessRisks),
    '',
    '## Top Priorities',
    renderNumbered(audit.topPriorities),
    '',
    '## Audit Notes',
    renderList([
      'Review public-page performance, signup, booking, scheduling, membership, and mobile workflow signals.',
      'Frame all findings as potential QA and release-confidence areas until Daniel performs a deeper paid audit.',
      'Do not claim bugs, lost revenue, vulnerabilities, or customer complaints.',
    ]),
    '',
    '## Safety Rules',
    renderList(audit.safetyRules),
    '',
  ].join('\n');
}

export function renderTopLeadExecutiveSummary(audit: TopLeadAuditPackage): string {
  return [
    '# Top Lead Executive Summary',
    '',
    `Generated: ${audit.generatedAt}`,
    '',
    renderList([
      `Company: ${audit.companyName}`,
      `Executive Score: ${Math.round((audit.qualificationScore + audit.qaOpportunityScore + audit.offerFitScore) / 3)}/100`,
      `Release Confidence: ${releaseConfidence(audit)}/100`,
      `Business Risk Level: ${businessRiskLevel(audit)}`,
      `Recommended Engagement: ${audit.recommendedOffer}`,
    ]),
    '',
    '## What Matters',
    `${audit.companyName} appears to be the current best revenue focus because Revenue Intelligence ranked it first using qualified lead, QA opportunity, pain relevance, and offer-fit signals.`,
    '',
    '## Why It Matters',
    'Public product workflows such as booking, scheduling, membership, checkout, and mobile usage may create release-confidence risk when they are complex or hard to verify manually.',
    '',
    '## What Should Be Done First',
    audit.nextRevenueAction,
    '',
    '## Safety Rules',
    renderList(audit.safetyRules),
    '',
  ].join('\n');
}

export function renderTopLeadProposal(audit: TopLeadAuditPackage): string {
  return [
    '# Top Lead Proposal Draft',
    '',
    `Generated: ${audit.generatedAt}`,
    '',
    renderList([
      `Company: ${audit.companyName}`,
      `Offer: ${audit.recommendedOffer}`,
      'Status: Draft only. Not sent.',
    ]),
    '',
    '## Proposed Scope',
    renderList(audit.proposalScope),
    '',
    '## Delivery Outputs',
    renderList([
      'Concise QA audit findings written in business language.',
      'Prioritized risk and opportunity list.',
      'Recommended next step for audit, starter pack, or retainer path.',
      'Manual review checkpoint before any client-facing use.',
    ]),
    '',
    '## Boundaries',
    renderList([
      'No invoice, payment link, meeting, or proposal send is created.',
      'Pricing language remains an offer range, not booked revenue.',
      'Findings are preparation notes until Daniel validates them manually.',
    ]),
    '',
    '## Safety Rules',
    renderList(audit.safetyRules),
    '',
  ].join('\n');
}

export function renderTopLeadExecutionPack(audit: TopLeadAuditPackage): string {
  return [
    '# Top Lead Execution Pack',
    '',
    `Generated: ${audit.generatedAt}`,
    '',
    renderList([
      `Company: ${audit.companyName}`,
      `GO / NO GO: ${audit.goNoGo}`,
      `Recommended Offer: ${audit.recommendedOffer}`,
      `Execution Priority: ${audit.executionPriority}`,
      `Next Revenue Action: ${audit.nextRevenueAction}`,
    ]),
    '',
    '## Readiness Checks',
    renderReadinessTable(audit.readinessChecks),
    '',
    '## Remaining Blockers',
    renderList(audit.remainingBlockers.length > 0 ? audit.remainingBlockers : ['No local preparation blockers detected. Human approval is still required before external action.']),
    '',
    '## Manual Next Action',
    audit.nextRevenueAction,
    '',
    '## Safety Rules',
    renderList(audit.safetyRules),
    '',
  ].join('\n');
}

export function renderTopLeadReadiness(audit: TopLeadAuditPackage): string {
  return [
    '# Top Lead Readiness',
    '',
    `Generated: ${audit.generatedAt}`,
    '',
    renderList([
      `Company: ${audit.companyName}`,
      `Top Lead Audit Status: ${audit.readinessChecks.find((check) => check.label === 'Audit Package')?.status ?? 'Missing'}`,
      `Evidence Status: ${audit.readinessChecks.find((check) => check.label === 'Evidence Collection')?.status ?? 'Missing'}`,
      `Proposal Status: ${audit.readinessChecks.find((check) => check.label === 'Proposal Draft')?.status ?? 'Missing'}`,
      `Execution Readiness: ${audit.goNoGo}`,
    ]),
    '',
    '## Checks',
    renderReadinessTable(audit.readinessChecks),
    '',
    '## Safety Rules',
    renderList(audit.safetyRules),
    '',
  ].join('\n');
}

function buildReadinessChecks(companyName: string, companyId: string): TopLeadAuditReadinessCheck[] {
  const rotation = buildLeadRotationDecision();
  const actionable = rotation.actionableLead;
  const fallbackEvidenceDecision = buildEvidenceReadinessDecision();
  const evidenceStatus: TopLeadAuditReadinessCheck['status'] = actionable?.companyName === companyName
    ? actionable.readiness === 'READY' ? 'Ready' : actionable.readiness === 'PARTIAL' ? 'Partial' : 'Missing'
    : fallbackEvidenceDecision.goNoGo === 'GO' ? 'Ready' : fallbackEvidenceDecision.goNoGo === 'PARTIAL' ? 'Partial' : 'Missing';
  const evidenceDescription = actionable?.companyName === companyName
    ? `Lead rotation readiness is ${actionable.readiness}; evidence ${actionable.evidenceStatus}, commercial score ${actionable.commercialReadinessScore}/100.`
    : `Evidence readiness is ${fallbackEvidenceDecision.status}; page ${fallbackEvidenceDecision.pageStatus}, screenshots ${fallbackEvidenceDecision.screenshotStatus}, lighthouse ${fallbackEvidenceDecision.lighthouseStatus}.`;
  const checks: Array<[string, string]> = [
    ['Evidence Package', path.join(process.cwd(), 'output', 'evidence-pro', 'evidence-package.md')],
    ['Audit Package', path.join(outputRoot, 'top-lead-audit.md')],
    ['Executive Summary', path.join(outputRoot, 'top-lead-executive-summary.md')],
    ['Proposal Draft', path.join(outputRoot, 'top-lead-proposal.md')],
    ['Message Pack', path.join(process.cwd(), 'output', 'messages', `${companyId}-message-pack.md`)],
  ];

  const artifactChecks: TopLeadAuditReadinessCheck[] = checks.map(([label, filePath]) => {
    const ready = fileContainsLead(filePath, companyName);
    return {
      label,
      status: ready ? 'Ready' : 'Missing',
      evidence: ready ? `Current ${companyName} file exists.` : `Missing current ${companyName} file at ${path.relative(process.cwd(), filePath)}.`,
      path: path.relative(process.cwd(), filePath),
    };
  });

  return [
    {
      label: 'Evidence Collection',
      status: evidenceStatus,
      evidence: evidenceDescription,
      path: actionable?.companyName === companyName ? 'output/lead-rotation/rotation-decision.md' : 'output/evidence/evidence-readiness.md',
    },
    ...artifactChecks,
  ];
}

function buildBusinessRisks(companyName: string, qaOpportunityScore: number, painSignalRelevance: number, categories: string[]): string[] {
  return [
    `${companyName} may have public workflow complexity worth reviewing because QA opportunity is ${qaOpportunityScore}/100.`,
    painSignalRelevance >= 80
      ? `Public review signals may indicate recurring ${unique(categories).join(', ') || 'workflow'} friction worth reviewing.`
      : 'Pain signal relevance is limited; validate public observations before making business claims.',
    'Booking, scheduling, membership, checkout, and mobile paths may increase release-confidence risk if they are not covered by smoke checks.',
  ];
}

function buildPriorities(companyName: string, offer: string): string[] {
  return [
    `Review ${companyName} public evidence and message pack manually.`,
    `Use the ${offer} angle only after Daniel confirms the evidence is relevant.`,
    'Prepare a concise QA audit path before any starter-pack or retainer positioning.',
    'Record only real outcomes after any manual external action.',
  ];
}

function buildProposalScope(companyName: string, offer: string): string[] {
  if (offer.includes('Retainer')) {
    return [
      `Initial QA audit review for ${companyName}.`,
      'Starter smoke coverage outline for high-value public workflows.',
      'Retainer path only after a paid audit or starter pack validates value.',
    ];
  }
  if (offer.includes('Starter')) {
    return [
      `Starter Playwright smoke coverage plan for ${companyName}.`,
      'Public workflow shortlist for booking, signup, scheduling, and membership paths.',
      'Audit notes translated into release-confidence priorities.',
    ];
  }
  return [
    `Focused QA Audit for ${companyName}.`,
    'Public-page observations and prioritized business risks.',
    'Recommended next action for smoke coverage or retainer path.',
  ];
}

function releaseConfidence(audit: TopLeadAuditPackage): number {
  return Math.max(0, Math.min(100, Math.round((audit.qualificationScore + audit.qaOpportunityScore) / 2)));
}

function businessRiskLevel(audit: TopLeadAuditPackage): string {
  const score = Math.round((audit.qaOpportunityScore + audit.painSignalRelevance) / 2);
  if (score >= 75) return 'High';
  if (score >= 50) return 'Medium';
  return 'Needs Review';
}

function writeOutputs(outputs: { fileName: string; body: string }[]): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });
  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }
  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

function fileContainsLead(filePath: string, companyName: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes(`Company: ${companyName}`) || content.includes(`# ${companyName} Message Pack`);
}

function renderEvidenceTable(items: TopLeadAuditEvidenceItem[]): string {
  return [
    '| Evidence | Value | Source |',
    '| --- | --- | --- |',
    ...items.map((item) => `| ${escapeTable(item.label)} | ${escapeTable(item.value)} | ${escapeTable(item.source)} |`),
  ].join('\n');
}

function renderReadinessTable(checks: TopLeadAuditReadinessCheck[]): string {
  return [
    '| Check | Status | Evidence | Path |',
    '| --- | --- | --- | --- |',
    ...checks.map((check) => `| ${escapeTable(check.label)} | ${check.status} | ${escapeTable(check.evidence)} | ${escapeTable(check.path)} |`),
  ].join('\n');
}

function renderNumbered(items: string[]): string {
  return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'lead';
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)));
}

function escapeTable(value: string): string {
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
