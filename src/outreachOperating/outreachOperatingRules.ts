import fs = require('fs');
import path = require('path');
import { getDemoLeadReasons, isDemoLead } from '../commercialMode/commercialModeRules';
import { ContactReviewRecord } from '../contactReview/types';
import { Lead } from '../leads/types';
import {
  ExcludedLead,
  OutreachArtifacts,
  OutreachCandidate,
  OutreachOperatingInput,
  OutreachOperatingReport,
} from './types';

const allowedContactRoles = [
  'Head of Engineering',
  'VP Engineering',
  'CTO',
  'QA Manager',
  'Product Manager',
  'Founder',
  'Operations Lead',
];

const safetyRules = [
  'No APIs.',
  'No scraping.',
  'No browsing automation.',
  'No CRM integrations.',
  'No outreach automation.',
  'No email sending.',
  'No LinkedIn automation.',
  'No payment systems.',
  'No credentials.',
  'No external databases.',
  'Do not invent contacts, URLs, company facts, audit findings, or outcomes.',
  'Daniel must approve before any external action.',
];

export function isDemoOrSampleLead(lead: Lead): boolean {
  return isDemoLead(lead);
}

export function exclusionReasons(lead: Lead): string[] {
  return getDemoLeadReasons(lead);
}

export function buildOutreachOperatingReport(input: OutreachOperatingInput): OutreachOperatingReport {
  const contactReviewByLeadId = new Map(input.contactReviews.map((review) => [review.leadId, review]));
  const excludedLeads = input.leads
    .map((lead) => ({ lead, reasons: exclusionReasons(lead) }))
    .filter((item) => item.reasons.length > 0);

  const eligibleLeads = input.leads
    .filter((lead) => !isDemoOrSampleLead(lead))
    .map((lead) => buildCandidate(lead, contactReviewByLeadId.get(lead.id)))
    .sort(sortCandidates);

  return {
    generatedAt: input.generatedAt,
    totalLeads: input.leads.length,
    excludedLeads,
    eligibleLeads,
    topFive: eligibleLeads.slice(0, 5),
    contextSources: input.contextSources,
  };
}

export function renderRealOutreachOperatingPack(report: OutreachOperatingReport): string {
  return [
    '# Real Outreach Operating Pack',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    `- Total leads: ${report.totalLeads}`,
    `- Excluded demo/sample leads: ${report.excludedLeads.length}`,
    `- Eligible commercial leads: ${report.eligibleLeads.length}`,
    `- Top 5 selected: ${report.topFive.length}`,
    '',
    'Local context read:',
    renderContextSources(report),
    '',
    '## Commercial Mode',
    renderList([
      'Commercial Mode is enabled by default for this outreach pack.',
      'Demo/sample leads are excluded unless Daniel explicitly allows them in a future workflow.',
      'Excluded conditions: sample IDs, .example websites, sample sources, Demo/Sandbox/Test company names, not-fit offers, paused status, or lost status.',
    ]),
    '',
    '## Top 5 Real Outreach Leads',
    renderTopFiveTable(report.topFive),
    '',
    '## Contact Research Workflow',
    renderList([
      'Open public sources manually only.',
      'Search LinkedIn manually for the company and the allowed roles.',
      'Verify company match before recording a role or URL.',
      'Do not scrape, export, enrich, or mass collect contacts.',
      'Do not use private data or credentials.',
      'Record only Daniel-reviewed public context in local notes.',
    ]),
    '',
    '## Message Review Workflow',
    renderList([
      'Use local research, lead pack, audit pack, and outreach pack context only.',
      'Do not invent company facts, contacts, metrics, bugs, audit results, or urgency.',
      'Keep messages draft-only until Daniel approves them.',
      'Use `npm run outreach:pack -- --id lead_id` only when enough local context exists.',
      'Use `npm run contact:review -- --id lead_id` before any manual outreach decision.',
    ]),
    '',
    '## Follow-Up Workflow',
    renderList([
      'Follow up only after Daniel manually sends an initial message.',
      'Use local contact review status and notes as the source of truth.',
      'Do not automate reminders, email, LinkedIn, CRM updates, or calendar events.',
      'If a follow-up date exists, review context before changing status or drafting a follow-up.',
    ]),
    '',
    '## First Audit Offer Workflow',
    renderList([
      'Position the first paid step as a focused QA Audit priced at $199-$500.',
      'Offer path: QA Audit -> Playwright Starter Pack -> QA Automation Retainer.',
      'Only reference completed audit work when a local audit pack exists.',
      'Do not guarantee outcomes or claim findings that are not in local evidence.',
    ]),
    '',
    '## Safety Rules',
    renderList(safetyRules),
    '',
    '## Suggested Commands',
    renderList(suggestedCommands(report.topFive).map((command) => `\`${command}\``)),
    '',
  ].join('\n');
}

export function renderTopFiveRealOutreach(report: OutreachOperatingReport): string {
  return [
    '# Top 5 Real Outreach',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    report.topFive.length === 0
      ? 'No eligible commercial outreach leads found.'
      : report.topFive.map(renderLeadDetail).join('\n\n'),
    '',
    '## Safety Rules',
    renderList(safetyRules),
    '',
  ].join('\n');
}

export function renderContactResearchChecklist(report: OutreachOperatingReport): string {
  return [
    '# Contact Research Checklist',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    'Use this checklist for manual contact research only. Do not invent names, URLs, emails, titles, or private data.',
    '',
    report.topFive.length === 0
      ? 'No eligible commercial outreach leads found.'
      : report.topFive.map(renderContactChecklist).join('\n\n'),
    '',
    '## Manual Search Instructions',
    renderList([
      'Search LinkedIn manually.',
      'Verify company match.',
      'Verify role.',
      'Avoid private data.',
      'Do not scrape.',
      'Do not mass message.',
      'Do not use automation or credentials.',
    ]),
    '',
  ].join('\n');
}

export function renderFirstAuditOfferPath(report: OutreachOperatingReport): string {
  return [
    '# First Audit Offer Path',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Offer Positioning',
    'Position the first step as a focused QA Automation Audit for one or two high-risk workflows, with findings and next-step recommendations reviewed by Daniel before any client use.',
    '',
    '## Top 5 Lead-Specific Audit Angles',
    report.topFive.length === 0
      ? 'No eligible commercial outreach leads found.'
      : report.topFive.map(renderAuditAngle).join('\n\n'),
    '',
    '## Suggested QA Audit Price Range',
    'QA Audit: $199-$500',
    '',
    '## Upgrade Path',
    'QA Audit -> Playwright Starter Pack -> QA Automation Retainer',
    '',
    '## Manual Outreach Sequence',
    renderList([
      'Review local lead context and available assets.',
      'Manually identify a relevant public contact role.',
      'Draft a short first message using only verified public context.',
      'Offer a focused QA Audit only after Daniel approves the message.',
      'Record local status after any manual action.',
    ]),
    '',
    '## Follow-Up Timing',
    renderList([
      'First follow-up: 3-5 business days after a manually sent initial message.',
      'Second follow-up: 5-7 business days after the first follow-up.',
      'Stop if the lead is not interested, not relevant, or Daniel pauses the opportunity.',
    ]),
    '',
    '## Do Not Claim',
    renderList([
      'Do not guarantee outcomes.',
      'Do not claim a completed audit unless a local audit pack exists.',
      'Do not invent findings.',
      'Do not claim ROI, compliance, accessibility certification, performance scores, or production readiness without evidence.',
      'Do not imply a private contact relationship that does not exist.',
    ]),
    '',
    '## Approval Checklist',
    renderList([
      '[ ] Company is eligible in Commercial Mode.',
      '[ ] Public workflow fit is clear from local data.',
      '[ ] Contact role is manually verified.',
      '[ ] Message uses no invented facts.',
      '[ ] Audit offer is scoped and priced at $199-$500.',
      '[ ] Daniel approves before sending anything.',
    ]),
    '',
  ].join('\n');
}

export function renderExcludedDemoLeads(report: OutreachOperatingReport): string {
  return [
    '# Excluded Demo Leads',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    'Commercial Mode excludes these leads from real outreach actions.',
    '',
    report.excludedLeads.length === 0 ? 'No demo/sample leads excluded.' : renderExcludedTable(report.excludedLeads),
    '',
    '## Safety Rules',
    renderList(safetyRules),
    '',
  ].join('\n');
}

export function renderConsoleSummary(report: OutreachOperatingReport): string[] {
  return [
    `Total leads: ${report.totalLeads}`,
    `Excluded demo/sample leads: ${report.excludedLeads.length}`,
    `Eligible commercial leads: ${report.eligibleLeads.length}`,
    `Top 5 selected: ${report.topFive.length}`,
    `Top selected lead: ${report.topFive[0]?.lead.companyName ?? 'none'}`,
  ];
}

function buildCandidate(lead: Lead, contactReview: ContactReviewRecord | undefined): OutreachCandidate {
  const artifacts = detectArtifacts(lead.id, Boolean(contactReview));
  const availableAssets = assetLabels(artifacts, true);
  const missingAssets = assetLabels(artifacts, false);
  const priorityScore = scoreCandidate(lead, artifacts, contactReview);

  return {
    lead,
    contactReview,
    artifacts,
    priorityScore,
    whySelected: whySelected(lead, artifacts, priorityScore),
    availableAssets,
    missingAssets,
    nextAction: nextActionFor(lead, artifacts),
    suggestedCommand: suggestedCommandFor(lead, artifacts),
  };
}

function detectArtifacts(leadId: string, hasContactReview: boolean): OutreachArtifacts {
  return {
    researchPack: exists(path.join('output', 'research', `${leadId}-research-pack.md`)),
    leadPack: exists(path.join('output', 'lead-packs', `${leadId}.md`)),
    auditPack: exists(path.join('output', 'audit-packs', leadId)),
    outreachPack: exists(path.join('output', 'outreach-packs', leadId)),
    contactReview: hasContactReview || exists(path.join('output', 'contact-reviews', leadId, 'contact-review.md')),
    sow: exists(path.join('output', 'sows', `${leadId}-sow.md`)),
  };
}

function scoreCandidate(lead: Lead, artifacts: OutreachArtifacts, contactReview: ContactReviewRecord | undefined): number {
  let score = Math.min(Math.max(lead.score, 0), 10) * 6;

  if (lead.score >= 8) score += 12;
  if (lead.recommendedOffer === 'qa-automation-retainer' || lead.recommendedOffer === 'agency-partner-retainer') score += 18;
  if (lead.recommendedOffer === 'playwright-starter-pack') score += 10;
  if (lead.recommendedOffer === 'qa-audit') score += 6;
  if (artifacts.researchPack) score += 7;
  if (artifacts.leadPack) score += 7;
  if (artifacts.auditPack) score += 10;
  if (artifacts.outreachPack) score += 10;
  if (artifacts.contactReview) score += 8;
  if (artifacts.sow) score += 4;
  if (contactReview?.messageStatus === 'prepared' || contactReview?.messageStatus === 'approved' || contactReview?.messageStatus === 'follow-up-needed') score += 5;

  return Math.min(100, Math.round(score));
}

function whySelected(lead: Lead, artifacts: OutreachArtifacts, priorityScore: number): string {
  const reasons = [
    `commercial-mode eligible`,
    `lead score ${lead.score}/10`,
    `priority score ${priorityScore}`,
    `recommended offer ${lead.recommendedOffer}`,
  ];

  if (lead.score >= 8) reasons.push('Tier A lead score');
  if (lead.recommendedOffer === 'qa-automation-retainer' || lead.recommendedOffer === 'agency-partner-retainer') reasons.push('retainer-fit path');
  if (artifacts.researchPack) reasons.push('research pack exists');
  if (artifacts.auditPack) reasons.push('audit pack exists');
  if (artifacts.outreachPack) reasons.push('outreach pack exists');
  if (artifacts.contactReview) reasons.push('contact review exists');

  return reasons.join('; ');
}

function assetLabels(artifacts: OutreachArtifacts, expectedValue: boolean): string[] {
  const labels: Array<[keyof OutreachArtifacts, string]> = [
    ['researchPack', 'Research pack'],
    ['leadPack', 'Lead pack'],
    ['auditPack', 'Audit pack'],
    ['outreachPack', 'Outreach pack'],
    ['contactReview', 'Contact review'],
    ['sow', 'SOW'],
  ];

  return labels
    .filter(([key]) => artifacts[key] === expectedValue)
    .map(([, label]) => label);
}

function nextActionFor(lead: Lead, artifacts: OutreachArtifacts): string {
  if (!artifacts.researchPack) return `Generate research pack for ${lead.companyName}.`;
  if (!artifacts.leadPack) return `Generate lead pack for ${lead.companyName}.`;
  if (!artifacts.auditPack) return `Generate audit pack for ${lead.companyName}.`;
  if (!artifacts.outreachPack) return `Generate outreach pack for ${lead.companyName}.`;
  if (!artifacts.contactReview) return `Generate contact review for ${lead.companyName}.`;
  return `Review contact context and manual outreach readiness for ${lead.companyName}.`;
}

function suggestedCommandFor(lead: Lead, artifacts: OutreachArtifacts): string {
  if (!artifacts.researchPack) return `npm run lead:research -- --id ${lead.id}`;
  if (!artifacts.leadPack) return `npm run lead:pack -- --id ${lead.id}`;
  if (!artifacts.auditPack) return `npm run audit:pack -- --id ${lead.id}`;
  if (!artifacts.outreachPack) return `npm run outreach:pack -- --id ${lead.id}`;
  if (!artifacts.contactReview) return `npm run contact:review -- --id ${lead.id}`;
  return `npm run contact:review -- --id ${lead.id}`;
}

function renderTopFiveTable(candidates: OutreachCandidate[]): string {
  if (candidates.length === 0) return 'No eligible commercial outreach leads found.';

  return [
    '| Rank | Company | Score | Recommended Offer | Next Action | Suggested Command |',
    '| ---: | --- | ---: | --- | --- | --- |',
    ...candidates.map((candidate, index) => `| ${index + 1} | ${escapeTable(candidate.lead.companyName)} | ${candidate.priorityScore} | ${candidate.lead.recommendedOffer} | ${escapeTable(candidate.nextAction)} | \`${escapeTable(candidate.suggestedCommand)}\` |`),
  ].join('\n');
}

function renderLeadDetail(candidate: OutreachCandidate, index: number): string {
  return [
    `## ${index + 1}. ${candidate.lead.companyName}`,
    '',
    `- Rank: ${index + 1}`,
    `- Company: ${candidate.lead.companyName}`,
    `- Website: ${candidate.lead.website}`,
    `- Industry: ${candidate.lead.industry}`,
    `- Score: ${candidate.lead.score}`,
    `- Recommended offer: ${candidate.lead.recommendedOffer}`,
    `- Why selected: ${candidate.whySelected}`,
    `- Current assets available: ${candidate.availableAssets.length ? candidate.availableAssets.join(', ') : 'None yet'}`,
    `- Missing assets: ${candidate.missingAssets.length ? candidate.missingAssets.join(', ') : 'None'}`,
    `- Next action: ${candidate.nextAction}`,
    `- Suggested command: \`${candidate.suggestedCommand}\``,
  ].join('\n');
}

function renderContactChecklist(candidate: OutreachCandidate, index: number): string {
  return [
    `## ${index + 1}. ${candidate.lead.companyName}`,
    '',
    `- Website: ${candidate.lead.website}`,
    `- Recommended public contact roles only: ${allowedContactRoles.join(', ')}`,
    '- Do not invent names.',
    '- Do not invent URLs.',
    '- Verify the person works at the company before recording any local note.',
    '- Keep all contact research manual and public.',
  ].join('\n');
}

function renderAuditAngle(candidate: OutreachCandidate, index: number): string {
  const painPoints = candidate.lead.painPoints.length ? candidate.lead.painPoints.join(', ') : 'public workflow reliability';
  const auditEvidence = candidate.artifacts.auditPack
    ? 'Local audit pack exists, so Daniel can review it before referencing audit context.'
    : 'No local audit pack exists yet, so do not claim completed audit findings.';

  return [
    `## ${index + 1}. ${candidate.lead.companyName}`,
    '',
    `- Audit angle: Focus a $199-$500 QA Audit around ${painPoints}.`,
    `- Local evidence boundary: ${auditEvidence}`,
    `- Upgrade path: QA Audit -> Playwright Starter Pack -> QA Automation Retainer.`,
    `- Suggested command: \`${candidate.suggestedCommand}\``,
  ].join('\n');
}

function renderExcludedTable(excludedLeads: ExcludedLead[]): string {
  return [
    '| Excluded Lead | Reason Excluded | Original Score | Original Recommended Offer |',
    '| --- | --- | ---: | --- |',
    ...excludedLeads.map((item) => `| ${escapeTable(item.lead.companyName)} | ${escapeTable(item.reasons.join('; '))} | ${item.lead.score} | ${item.lead.recommendedOffer} |`),
  ].join('\n');
}

function suggestedCommands(candidates: OutreachCandidate[]): string[] {
  const commands = candidates.map((candidate) => candidate.suggestedCommand);
  commands.push('npm run pipeline:prioritize');
  commands.push('npm run operator:daily');
  commands.push('npm run dashboard');
  return [...new Set(commands)];
}

function sortCandidates(a: OutreachCandidate, b: OutreachCandidate): number {
  if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
  if (b.lead.score !== a.lead.score) return b.lead.score - a.lead.score;
  return a.lead.companyName.localeCompare(b.lead.companyName);
}

function renderContextSources(report: OutreachOperatingReport): string {
  return report.contextSources.map((source) => {
    const status = source.exists ? 'available' : 'missing';
    const excerpt = source.exists && source.excerpt ? ` Summary: ${source.excerpt}` : '';
    return `- ${source.label}: ${status} (${source.path}).${excerpt}`;
  }).join('\n');
}

function renderList(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), relativePath));
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|');
}
