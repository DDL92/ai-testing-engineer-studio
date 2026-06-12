import fs = require('fs');
import path = require('path');
import { buildClientReadinessReport, loadClientReadinessInput } from '../clientReadiness/clientReadinessRules';
import { ClientReadinessCandidate } from '../clientReadiness/types';
import { ContactReviewRecord } from '../contactReview/types';
import { Lead } from '../leads/types';
import { buildRevenueCommandCenterReport, loadRevenueCommandCenterInput } from '../revenueCommandCenter/revenueRules';
import { RevenuePriorityOpportunity } from '../revenueCommandCenter/types';
import {
  ConfidenceLevel,
  ContactDecision,
  ContactDecisionOutcome,
  OutreachReviewItem,
  OutreachReviewReport,
  OutreachReviewStatus,
  RiskLevel,
  SendReadinessItem,
} from './types';

const outputRoot = path.join(process.cwd(), 'output', 'outreach-review');
const targetCompanies = ['PushPress', 'TeamUp', 'Wodify', 'ABC Glofox', 'Bookee'];

const manualApprovalReminder = [
  'No outreach was sent by this review.',
  'No emails, LinkedIn messages, contact-form messages, or follow-ups were sent.',
  'No contacts, findings, metrics, company facts, revenue, or client outcomes were invented.',
  'No APIs, scraping, browsing, CRM, outreach automation, payments, credentials, or external databases were used.',
  'Daniel must approve the company, contact, message, pricing, discovery path, and follow-up plan before any manual send.',
];

export function buildOutreachReviewReport(): OutreachReviewReport {
  const generatedAt = new Date().toISOString();
  const clientReadiness = buildClientReadinessReport(loadClientReadinessInput());
  const revenue = buildRevenueCommandCenterReport(loadRevenueCommandCenterInput());
  const items = buildOutreachReviewItems(clientReadiness.candidates, revenue.auditOpportunities);
  const pushPress = items.find((item) => item.company === 'PushPress');
  const pushPressContact = pushPress?.candidate.contactReview;
  const contactDecision = buildContactDecision(pushPress, pushPressContact);
  const sendReadiness = buildSendReadiness(pushPress, pushPressContact);
  const readyCount = sendReadiness.filter((item) => item.ready).length;
  const readyPercentage = sendReadiness.length === 0 ? 0 : Math.round((readyCount / sendReadiness.length) * 100);

  return {
    generatedAt,
    items,
    pushPress,
    pushPressContact,
    contactDecision,
    sendReadiness,
    readyPercentage,
    notReadyPercentage: 100 - readyPercentage,
  };
}

export function writeOutreachReviewOutputs(report: OutreachReviewReport): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });

  const outputs = [
    { fileName: 'outreach-review.md', body: renderOutreachReview(report) },
    { fileName: 'pushpress-review.md', body: renderPushPressReview(report) },
    { fileName: 'contact-decision.md', body: renderContactDecision(report) },
    { fileName: 'send-readiness.md', body: renderSendReadiness(report) },
    { fileName: 'top-5-review.md', body: renderTopFiveReview(report) },
    { fileName: 'research-gaps.md', body: renderResearchGaps(report) },
    { fileName: 'approval-checklist.md', body: renderApprovalChecklist(report) },
  ];

  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }

  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

export function renderOutreachReview(report: OutreachReviewReport): string {
  return [
    '# Outreach Review',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    renderList([
      `Best first outreach target: ${report.pushPress?.company ?? 'none'}.`,
      `Contact decision: ${report.contactDecision.outcome}.`,
      `Send readiness: ${report.readyPercentage}% ready / ${report.notReadyPercentage}% not ready.`,
      'This is a review-only pack; no outreach was sent.',
    ]),
    '',
    '## Top 5 Outreach Review',
    renderOutreachReviewTable(report.items),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderPushPressReview(report: OutreachReviewReport): string {
  const item = report.pushPress;
  const contact = report.pushPressContact;

  return [
    '# PushPress Review',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Why It Is Ranked #1',
    renderList([
      'PushPress has the highest local readiness score among the Top 5 commercial leads.',
      'Local research, lead pack, audit pack, outreach pack, contact review, client workflow, and SOW evidence exist.',
      'The next blocker is manual contact verification and Daniel approval, not more infrastructure.',
    ]),
    '',
    '## Readiness Analysis',
    renderList([
      `Readiness: ${item?.readiness ?? 'NOT READY'}.`,
      `Risk level: ${item?.riskLevel ?? 'HIGH'}.`,
      `Confidence: ${item?.confidence ?? 'LOW'}.`,
      `Next action: ${item?.nextAction ?? 'No local next action.'}`,
    ]),
    '',
    '## Missing Information',
    renderList(item?.missingData ?? ['PushPress local review item missing.']),
    '',
    '## Required Manual Research',
    renderList(item?.recommendedManualResearch ?? ['Review local lead record before any manual action.']),
    '',
    '## Outreach Readiness',
    renderList([
      `Outreach status: ${item?.outreachStatus ?? 'not available'}.`,
      `Contact status: ${contact?.contactStatus ?? 'no contact review record'}.`,
      `Message status: ${contact?.messageStatus ?? 'no message status'}.`,
      contact?.contactName ? `Current contact name field: ${contact.contactName}. Verify manually before use.` : 'No contact name recorded.',
      'Do not use placeholder contact details for a real send.',
    ]),
    '',
    '## Audit Readiness',
    renderList([
      item?.auditStatus ?? 'Audit readiness not available.',
      item?.candidate.artifacts.auditPack ? 'Local audit pack exists.' : 'Local audit pack missing.',
      'Do not claim completed findings externally unless Daniel reviews the local audit evidence.',
    ]),
    '',
    '## Proposal Readiness',
    renderList([
      item?.proposalStatus ?? 'Proposal readiness not available.',
      item?.candidate.artifacts.sow ? 'Local SOW draft exists.' : 'SOW draft missing.',
      'Do not send a SOW before contact/discovery context is approved.',
    ]),
    '',
    '## Discovery Call Readiness',
    renderList([
      item?.candidate.artifacts.clientWorkflow ? 'Discovery and client workflow artifacts exist locally.' : 'Discovery workflow artifacts are missing.',
      'Discovery path still requires Daniel review before use.',
    ]),
    '',
    '## Revenue Potential',
    renderList([
      item?.candidate.revenuePotential ?? 'Revenue potential unavailable.',
      'Revenue potential is an opportunity only, not booked revenue.',
    ]),
    '',
    '## Risks',
    renderList(item?.blockingIssues ?? ['Contact/message approval state still needs review.']),
    '',
    '## Exact Next Step',
    `\`${report.contactDecision.nextAction}\``,
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderContactDecision(report: OutreachReviewReport): string {
  const decision = report.contactDecision;

  return [
    '# Contact Decision',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Decision: ${decision.outcome}`,
    '',
    '## Why',
    renderList(decision.why),
    '',
    '## Missing Items',
    renderList(decision.missingItems),
    '',
    '## Confidence Level',
    decision.confidence,
    '',
    '## Next Action',
    `\`${decision.nextAction}\``,
    '',
    '## Decision Rules',
    renderList([
      'SEND requires manually approved contact and approved message status.',
      'NEEDS RESEARCH applies when the lead is commercially ready but contact/message approval is incomplete.',
      'DO NOT SEND applies when the contact is rejected, lead is not a fit, or required local evidence is missing.',
    ]),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderSendReadiness(report: OutreachReviewReport): string {
  return [
    '# Send Readiness',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Ready %: ${report.readyPercentage}%`,
    `Not Ready %: ${report.notReadyPercentage}%`,
    '',
    '| Checklist Item | Status | Evidence |',
    '| --- | --- | --- |',
    ...report.sendReadiness.map((item) => `| ${escapeTable(item.item)} | ${item.ready ? 'READY' : 'NOT READY'} | ${escapeTable(item.evidence)} |`),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderTopFiveReview(report: OutreachReviewReport): string {
  return [
    '# Top 5 Review',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Rank | Priority | Company | Offer Type | Audit Path | Retainer Path | Confidence |',
    '| ---: | ---: | --- | --- | --- | --- | --- |',
    ...report.items.map((item) => `| ${item.rank} | ${item.priority} | ${escapeTable(item.company)} | ${escapeTable(item.offerType)} | ${escapeTable(item.auditPath)} | ${escapeTable(item.retainerPath)} | ${item.confidence} |`),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderResearchGaps(report: OutreachReviewReport): string {
  return [
    '# Research Gaps',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Company | Missing Data | Recommended Manual Research | Blocking Issues |',
    '| --- | --- | --- | --- |',
    ...report.items.map((item) => `| ${escapeTable(item.company)} | ${escapeTable(formatCellList(item.missingData))} | ${escapeTable(formatCellList(item.recommendedManualResearch))} | ${escapeTable(formatCellList(item.blockingIssues))} |`),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderApprovalChecklist(report: OutreachReviewReport): string {
  return [
    '# Approval Checklist',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '- [ ] company reviewed',
    '- [ ] contact verified',
    '- [ ] pricing reviewed',
    '- [ ] outreach reviewed',
    '- [ ] no fake findings',
    '- [ ] no fake metrics',
    '- [ ] no unsupported claims',
    '- [ ] discovery call path reviewed',
    '- [ ] Daniel approved',
    '',
    '## Current Decision',
    `Decision: ${report.contactDecision.outcome}`,
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

function buildOutreachReviewItems(
  candidates: ClientReadinessCandidate[],
  opportunities: RevenuePriorityOpportunity[],
): OutreachReviewItem[] {
  return targetCompanies
    .map((company) => {
      const candidate = findCandidate(company, candidates);
      if (!candidate) return undefined;
      const opportunity = findOpportunity(candidate.lead, opportunities);
      return buildOutreachReviewItem(candidate, opportunity);
    })
    .filter((item): item is OutreachReviewItem => Boolean(item))
    .sort((a, b) => b.priority - a.priority || a.company.localeCompare(b.company))
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

function buildOutreachReviewItem(
  candidate: ClientReadinessCandidate,
  opportunity: RevenuePriorityOpportunity | undefined,
): OutreachReviewItem {
  const missingData = buildMissingData(candidate);
  const blockingIssues = buildBlockingIssues(candidate);
  const readiness = outreachReadiness(candidate, blockingIssues);
  const riskLevel = riskLevelFor(readiness, blockingIssues);

  return {
    rank: 0,
    company: candidate.lead.companyName,
    leadId: candidate.lead.id,
    readiness,
    researchStatus: candidate.artifacts.researchPack ? 'Research pack exists' : 'Research needed',
    outreachStatus: candidate.outreachStatus,
    auditStatus: candidate.auditStatus,
    proposalStatus: candidate.artifacts.sow ? 'SOW draft exists locally' : 'Proposal/SOW not ready',
    riskLevel,
    nextAction: nextActionFor(candidate, blockingIssues),
    priority: candidate.readinessScore,
    offerType: candidate.lead.recommendedOffer,
    auditPath: auditPathFor(candidate),
    retainerPath: retainerPathFor(candidate.lead),
    confidence: confidenceFor(readiness, candidate),
    missingData,
    recommendedManualResearch: recommendedManualResearch(candidate),
    blockingIssues,
    candidate,
    opportunity,
  };
}

function buildContactDecision(
  pushPress: OutreachReviewItem | undefined,
  contact: ContactReviewRecord | undefined,
): ContactDecision {
  if (!pushPress) {
    return decision('DO NOT SEND', ['PushPress is missing from local Top 5 review data.'], ['Local PushPress review item.'], 'LOW', 'npm run first-client:path');
  }

  if (contact?.contactStatus === 'rejected') {
    return decision('DO NOT SEND', ['The current contact review is rejected.'], ['A different manually verified contact or pause decision.'], 'HIGH', 'npm run contact:review -- --id pushpress');
  }

  const missingItems = [
    pushPress.readiness !== 'READY' ? 'PushPress outreach readiness is not READY.' : undefined,
    !contact ? 'Contact review record is missing.' : undefined,
    contact && contact.contactStatus !== 'approved' ? `Contact status is ${contact.contactStatus}, not approved.` : undefined,
    contact && contact.messageStatus !== 'approved' ? `Message status is ${contact.messageStatus}, not approved.` : undefined,
    contact && isPlaceholderContact(contact) ? 'Contact details appear to be placeholder/demo values and must be manually verified.' : undefined,
  ].filter((item): item is string => Boolean(item));

  if (missingItems.length === 0) {
    return decision(
      'SEND',
      ['PushPress is READY, contact is approved, and message is approved in local records.'],
      [],
      'HIGH',
      'Send manually only if Daniel confirms in the moment; then update local contact status.',
    );
  }

  return decision(
    'NEEDS RESEARCH',
    [
      'PushPress has strong local readiness assets, but contact/message approval is incomplete.',
      'The current contact review must be manually verified before any real send.',
    ],
    missingItems,
    'MEDIUM',
    'npm run contact:review -- --id pushpress',
  );
}

function buildSendReadiness(
  pushPress: OutreachReviewItem | undefined,
  contact: ContactReviewRecord | undefined,
): SendReadinessItem[] {
  const lead = pushPress?.candidate.lead;

  return [
    readyItem('Company verified', Boolean(lead?.companyName), lead?.companyName ? `Local company record: ${lead.companyName}.` : 'No local company record.'),
    readyItem('Website verified', Boolean(lead?.website), lead?.website ? `Local website record: ${lead.website}. Manual browser review still required before sending.` : 'No website recorded.'),
    readyItem('Commercial fit verified', Boolean(pushPress && pushPress.priority >= 80), pushPress ? `Local readiness score: ${pushPress.priority}/100.` : 'No readiness score.'),
    readyItem('Offer selected', Boolean(lead?.recommendedOffer && lead.recommendedOffer !== 'not-fit'), lead?.recommendedOffer ? `Offer: ${lead.recommendedOffer}.` : 'No offer selected.'),
    readyItem('Message reviewed', contact?.messageStatus === 'approved', contact ? `Message status: ${contact.messageStatus}.` : 'No contact review record.'),
    readyItem('Discovery path prepared', Boolean(pushPress?.candidate.artifacts.clientWorkflow), pushPress?.candidate.artifacts.clientWorkflow ? 'Client workflow/discovery artifacts exist locally.' : 'Discovery workflow missing.'),
    readyItem('Pricing reviewed', Boolean(pushPress?.candidate.artifacts.sow), pushPress?.candidate.artifacts.sow ? 'Local SOW/proposal artifact exists for pricing review.' : 'SOW/pricing artifact missing.'),
    readyItem('Approval completed', contact?.contactStatus === 'approved' && contact.messageStatus === 'approved', contact ? `Contact status: ${contact.contactStatus}; message status: ${contact.messageStatus}.` : 'No approval record.'),
  ];
}

function buildMissingData(candidate: ClientReadinessCandidate): string[] {
  const missing = [...candidate.missingAssets];
  const contact = candidate.contactReview;

  if (!contact) missing.push('Contact review');
  if (contact && contact.contactStatus !== 'approved') missing.push(`Approved contact status (current: ${contact.contactStatus})`);
  if (contact && contact.messageStatus !== 'approved') missing.push(`Approved message status (current: ${contact.messageStatus})`);
  if (contact && isPlaceholderContact(contact)) missing.push('Manually verified non-placeholder contact details');
  if (!candidate.lead.website) missing.push('Website');

  return unique(missing).length === 0 ? ['No missing local assets detected; final Daniel approval still required.'] : unique(missing);
}

function recommendedManualResearch(candidate: ClientReadinessCandidate): string[] {
  const contact = candidate.contactReview;
  const steps = [
    'Verify company website and product fit manually.',
    'Verify a relevant public contact or role manually.',
    'Review outreach draft for unsupported claims before approval.',
  ];

  if (!candidate.artifacts.researchPack) steps.push('Create local research pack before outreach review.');
  if (!candidate.artifacts.auditPack) steps.push('Create local audit pack before claiming audit evidence.');
  if (!candidate.artifacts.sow) steps.push('Review pricing/SOW only after audit and contact readiness improve.');
  if (!contact || contact.contactStatus !== 'approved') steps.push('Update contact review only after Daniel manually verifies contact details.');

  return unique(steps);
}

function buildBlockingIssues(candidate: ClientReadinessCandidate): string[] {
  const contact = candidate.contactReview;
  const issues = [
    !candidate.artifacts.researchPack ? 'Research pack missing.' : undefined,
    !candidate.artifacts.auditPack ? 'Audit pack missing.' : undefined,
    !candidate.artifacts.outreachPack ? 'Outreach pack missing.' : undefined,
    !candidate.artifacts.sow ? 'SOW/proposal draft missing.' : undefined,
    !contact ? 'Contact review missing.' : undefined,
    contact && contact.contactStatus !== 'approved' ? `Contact not approved: ${contact.contactStatus}.` : undefined,
    contact && contact.messageStatus !== 'approved' ? `Message not approved: ${contact.messageStatus}.` : undefined,
    contact && isPlaceholderContact(contact) ? 'Contact record contains placeholder/demo values.' : undefined,
  ].filter((item): item is string => Boolean(item));

  return issues.length === 0 ? ['Daniel approval is still required before any manual send.'] : issues;
}

function outreachReadiness(candidate: ClientReadinessCandidate, blockingIssues: string[]): OutreachReviewStatus {
  if (candidate.readinessStatus === 'READY' && blockingIssues.every((issue) => issue === 'Daniel approval is still required before any manual send.')) return 'READY';
  if (candidate.artifacts.researchPack || candidate.artifacts.leadPack || candidate.artifacts.auditPack) return 'PARTIAL';
  return 'NOT READY';
}

function riskLevelFor(readiness: OutreachReviewStatus, blockingIssues: string[]): RiskLevel {
  if (readiness === 'NOT READY') return 'HIGH';
  if (blockingIssues.some((issue) => issue.includes('missing') || issue.includes('not approved') || issue.includes('placeholder'))) return 'MEDIUM';
  return 'LOW';
}

function confidenceFor(readiness: OutreachReviewStatus, candidate: ClientReadinessCandidate): ConfidenceLevel {
  if (readiness === 'READY' && candidate.readinessScore >= 90) return 'HIGH';
  if (readiness === 'PARTIAL' && candidate.readinessScore >= 60) return 'MEDIUM';
  return 'LOW';
}

function nextActionFor(candidate: ClientReadinessCandidate, blockingIssues: string[]): string {
  if (candidate.lead.id === 'pushpress') return 'Review and verify contact details manually before any send.';
  if (blockingIssues.some((issue) => issue.includes('Research pack'))) return `Generate research pack for ${candidate.lead.companyName}.`;
  if (blockingIssues.some((issue) => issue.includes('Audit pack'))) return `Generate audit pack for ${candidate.lead.companyName}.`;
  if (blockingIssues.some((issue) => issue.includes('Contact review'))) return `Create contact review for ${candidate.lead.companyName}.`;
  return candidate.nextAction;
}

function auditPathFor(candidate: ClientReadinessCandidate): string {
  if (candidate.artifacts.auditPack) return 'Audit pack exists; review evidence manually before referencing externally.';
  if (candidate.artifacts.leadPack) return 'Generate audit pack from existing lead pack.';
  return 'Research and lead pack required before audit path.';
}

function retainerPathFor(lead: Lead): string {
  if (lead.recommendedOffer === 'qa-automation-retainer') return 'QA Audit -> discovery -> Playwright starter or QA automation retainer.';
  if (lead.recommendedOffer === 'agency-partner-retainer') return 'Research -> audit angle -> agency partner retainer discovery.';
  if (lead.recommendedOffer === 'playwright-starter-pack') return 'QA Audit -> starter pack -> maintenance retainer.';
  return 'QA Audit -> evidence review -> retainer decision if supported.';
}

function decision(
  outcome: ContactDecisionOutcome,
  why: string[],
  missingItems: string[],
  confidence: ConfidenceLevel,
  nextAction: string,
): ContactDecision {
  return {
    outcome,
    why,
    missingItems,
    confidence,
    nextAction,
  };
}

function readyItem(item: string, ready: boolean, evidence: string): SendReadinessItem {
  return { item, ready, evidence };
}

function findCandidate(company: string, candidates: ClientReadinessCandidate[]): ClientReadinessCandidate | undefined {
  const normalized = normalize(company);
  return candidates.find((candidate) => normalize(candidate.lead.companyName) === normalized || normalize(candidate.lead.id) === normalized);
}

function findOpportunity(lead: Lead, opportunities: RevenuePriorityOpportunity[]): RevenuePriorityOpportunity | undefined {
  return opportunities.find((opportunity) => opportunity.lead.id === lead.id);
}

function isPlaceholderContact(contact: ContactReviewRecord): boolean {
  const combined = `${contact.contactName} ${contact.notes}`.toLowerCase();
  return combined.includes('placeholder') || combined.includes('demo-only');
}

function renderOutreachReviewTable(items: OutreachReviewItem[]): string {
  return [
    '| Company | Readiness | Research Status | Outreach Status | Audit Status | Proposal Status | Risk Level | Next Action |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...items.map((item) => `| ${escapeTable(item.company)} | ${item.readiness} | ${escapeTable(item.researchStatus)} | ${escapeTable(item.outreachStatus)} | ${escapeTable(item.auditStatus)} | ${escapeTable(item.proposalStatus)} | ${item.riskLevel} | ${escapeTable(item.nextAction)} |`),
  ].join('\n');
}

function formatCellList(items: string[]): string {
  if (items.length === 0) return 'None.';
  return items.join('<br>');
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items));
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}
