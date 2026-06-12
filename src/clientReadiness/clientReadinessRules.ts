import fs = require('fs');
import path = require('path');
import { buildCommercialModeSummary } from '../commercialMode/commercialModeRules';
import { ContactReviewRecord } from '../contactReview/types';
import { Lead, RecommendedOffer } from '../leads/types';
import {
  ClientReadinessArtifacts,
  ClientReadinessCandidate,
  ClientReadinessInput,
  ClientReadinessReport,
  ClientReadinessSource,
  ComplexityLevel,
  ReadinessStatus,
} from './types';

const outputRoot = path.join(process.cwd(), 'output', 'real-client-readiness');

const manualApprovalReminder = [
  'Human approval is required before outreach, follow-up, discovery calls, proposals, SOWs, client delivery, invoices, or payment action.',
  'This pack prepares manual action only. It does not send messages.',
  'No APIs, scraping, browsing, CRM, outreach automation, email sending, LinkedIn automation, payments, credentials, or external databases were used.',
  'Do not invent contacts, names, private data, audit findings, revenue claims, or client outcomes.',
];

export function loadClientReadinessInput(): ClientReadinessInput {
  const generatedAt = new Date().toISOString();

  return {
    generatedAt,
    leads: readJson<Lead[]>(path.join('data', 'leads.json'), []),
    contactReviews: readJson<ContactReviewRecord[]>(path.join('data', 'contact-reviews.json'), []),
    contextSources: [
      readContextSource('Leads', path.join('data', 'leads.json')),
      readContextSource('Contact reviews', path.join('data', 'contact-reviews.json')),
      readContextSource('Top 5 real outreach', path.join('output', 'outreach-operating', 'top-5-real-outreach.md')),
      readContextSource('First audit offer path', path.join('output', 'outreach-operating', 'first-audit-offer-path.md')),
      readContextSource('Commercial prioritized pipeline', path.join('output', 'pipeline-prioritization', 'commercial-prioritized-pipeline.md')),
      readContextSource('Commercial dashboard', path.join('output', 'dashboard', 'commercial-dashboard.md')),
      readContextSource('Revenue command center', path.join('output', 'revenue-command-center', 'revenue-command-center.md')),
      readContextSource('Mac daily summary', path.join('output', 'mac-daily', 'mac-daily-summary.md')),
    ],
  };
}

export function buildClientReadinessReport(input: ClientReadinessInput): ClientReadinessReport {
  const commercialSummary = buildCommercialModeSummary(input.leads);
  const commercialLeadIds = new Set(commercialSummary.commercialLeads.map((lead) => lead.id));
  const contactReviews = input.contactReviews.filter((review) => commercialLeadIds.has(review.leadId));
  const contactReviewByLeadId = new Map(contactReviews.map((review) => [review.leadId, review]));
  const topOutreachLeadIds = parseTopOutreachLeadIds(input.contextSources);
  const candidates = commercialSummary.commercialLeads
    .map((lead) => buildCandidate(lead, contactReviewByLeadId.get(lead.id), topOutreachLeadIds.has(lead.id)))
    .filter((candidate) => candidate.readinessScore > 0)
    .sort(sortCandidates);

  return {
    generatedAt: input.generatedAt,
    totalLeads: input.leads.length,
    commercialLeads: commercialSummary.commercialLeads.length,
    excludedLeads: commercialSummary.demoLeads.length,
    candidates,
    topFive: candidates.slice(0, 5),
    contextSources: input.contextSources,
  };
}

export function writeClientReadinessOutputs(report: ClientReadinessReport): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });

  const outputs = [
    { fileName: 'real-client-readiness-pack.md', body: renderRealClientReadinessPack(report) },
    { fileName: 'first-audit-sales-pack.md', body: renderFirstAuditSalesPack(report) },
    { fileName: 'top-5-contact-plan.md', body: renderTopFiveContactPlan(report) },
    { fileName: 'manual-outreach-checklist.md', body: renderManualOutreachChecklist(report) },
    { fileName: 'sow-readiness.md', body: renderSowReadiness(report) },
  ];

  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }

  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

export function writeFirstAuditSalesPack(report: ClientReadinessReport): string {
  fs.mkdirSync(outputRoot, { recursive: true });
  const outputPath = path.join(outputRoot, 'first-audit-sales-pack.md');
  fs.writeFileSync(outputPath, renderFirstAuditSalesPack(report), 'utf8');
  return outputPath;
}

export function renderRealClientReadinessPack(report: ClientReadinessReport): string {
  return [
    '# Real Client Readiness Pack',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Executive Summary',
    renderList([
      `Total leads reviewed: ${report.totalLeads}`,
      `Commercial leads eligible: ${report.commercialLeads}`,
      `Excluded demo/sample/not-fit/paused/lost leads: ${report.excludedLeads}`,
      `Top 5 commercial leads prepared: ${report.topFive.length}`,
      `READY leads: ${report.topFive.filter((candidate) => candidate.readinessStatus === 'READY').length}`,
      `PARTIAL leads: ${report.topFive.filter((candidate) => candidate.readinessStatus === 'PARTIAL').length}`,
      'This pack prepares manual contact, first audit sales, discovery, and SOW decisions only.',
    ]),
    '',
    '## Commercial Readiness',
    renderContextSources(report.contextSources),
    '',
    '## Top 5 Commercial Leads',
    renderTopFiveTable(report.topFive),
    '',
    '## Audit Readiness',
    renderReadinessBreakdown(report.topFive, 'auditReadiness'),
    '',
    '## Outreach Readiness',
    renderReadinessBreakdown(report.topFive, 'readinessStatus'),
    '',
    '## Discovery Call Readiness',
    renderDiscoveryReadiness(report.topFive),
    '',
    '## SOW Readiness',
    renderSowTable(report.topFive),
    '',
    '## Revenue Potential',
    renderRevenuePotential(report.topFive),
    '',
    '## Risks',
    renderList(buildRisks(report)),
    '',
    '## Suggested Commands',
    renderList(suggestedCommands(report.topFive).map((command) => `\`${command}\``)),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderTopFiveContactPlan(report: ClientReadinessReport): string {
  return [
    '# Top 5 Contact Plan',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    report.topFive.length === 0 ? 'No Top 5 commercial leads available.' : renderContactPlanTable(report.topFive),
    '',
    '## Contact Boundary',
    renderList([
      'Use real lead IDs only.',
      'Do not invent contact names.',
      'Only record public roles or manually verified public contacts after Daniel review.',
      'Do not send anything from this report.',
    ]),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderManualOutreachChecklist(_report: ClientReadinessReport): string {
  return [
    '# Manual Outreach Checklist',
    '',
    '## Research',
    renderChecklist([
      'verify company',
      'verify website',
      'verify product/service',
      'verify ICP fit',
    ]),
    '',
    '## Contact',
    renderChecklist([
      'identify public role',
      'verify relevance',
      'verify company match',
    ]),
    '',
    '## Message',
    renderChecklist([
      'review manually',
      'personalize manually',
      'approval required',
    ]),
    '',
    '## Follow-up',
    renderChecklist([
      'track manually',
      'update status manually',
    ]),
    '',
    '## Safety',
    renderChecklist([
      'no scraping',
      'no mass outreach',
      'no automation',
      'no private data',
    ]),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderFirstAuditSalesPack(report: ClientReadinessReport): string {
  return [
    '# First Audit Sales Pack',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Offer',
    'A focused QA Audit for one or two high-risk public workflows, reviewed manually before any client-facing use.',
    '',
    '## Pricing',
    'QA Audit: $199-$500',
    '',
    '## Audit Scope',
    renderList([
      'Public website/product workflow review using only approved local context.',
      'Smoke-test opportunity review for signup, booking, checkout, onboarding, payments, or mobile flows when those signals exist in local lead data.',
      'No login, production client system, payment, private data, or credential use unless Daniel explicitly approves a future scoped engagement.',
    ]),
    '',
    '## Discovery Call Topics',
    renderList([
      'Highest-risk public workflow.',
      'Current release and regression pain.',
      'Manual QA bottlenecks.',
      'Existing Playwright or automation coverage.',
      'Evidence needed to justify a starter pack or retainer.',
    ]),
    '',
    '## Audit Deliverables',
    renderList([
      'QA risk summary.',
      'Playwright smoke-test opportunities.',
      'Automation roadmap.',
      'Executive summary.',
      'Retainer recommendation when evidence supports it.',
    ]),
    '',
    '## Upgrade Path',
    'QA Audit -> Playwright Starter Pack -> QA Automation Retainer',
    '',
    '## Objection Handling',
    renderList([
      'If price concern: keep scope narrow and evidence-focused.',
      'If timing concern: offer a small audit window before larger automation work.',
      'If they already have QA: position the audit as a second opinion on critical regression risk.',
      'If they want guarantees: avoid guarantees and commit only to reviewed deliverables.',
    ]),
    '',
    '## Follow-Up Plan',
    renderList([
      'Follow up 3-5 business days after a manually sent initial message.',
      'Second follow-up 5-7 business days after the first follow-up.',
      'Stop or pause when the lead is not relevant, not interested, or Daniel decides not to proceed.',
      'Update local contact review status manually after any action.',
    ]),
    '',
    '## Top Audit Sales Priorities',
    renderAuditPriorityList(report.topFive),
    '',
    '## Approval Checklist',
    renderChecklist([
      'company and website manually verified',
      'ICP fit manually confirmed',
      'message reviewed and personalized manually',
      'no invented contacts, findings, metrics, or claims',
      'QA Audit scope and $199-$500 price range approved',
      'Daniel approves before sending anything',
    ]),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderSowReadiness(report: ClientReadinessReport): string {
  return [
    '# SOW Readiness',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderSowTable(report.topFive),
    '',
    '## Status Rules',
    renderList([
      'READY: enough local assets exist to prepare or review a SOW draft.',
      'PARTIAL: some assets exist, but audit/contact/scope context needs more work.',
      'NOT READY: research, lead pack, or commercial context is too thin for SOW work.',
    ]),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

function buildCandidate(lead: Lead, contactReview: ContactReviewRecord | undefined, isTopOutreach: boolean): ClientReadinessCandidate {
  const artifacts = detectArtifacts(lead.id, Boolean(contactReview));
  const score = scoreReadiness(lead, artifacts, contactReview, isTopOutreach);
  const missingAssets = assetLabels(artifacts, false);
  const availableAssets = assetLabels(artifacts, true);
  const auditReadiness = statusForAudit(artifacts);
  const readinessStatus = statusForScore(score.score);
  const retainerFit = isRetainerOffer(lead.recommendedOffer) ? 'READY' : lead.recommendedOffer === 'playwright-starter-pack' ? 'PARTIAL' : 'NOT READY';

  return {
    lead,
    contactReview,
    artifacts,
    readinessScore: score.score,
    readinessStatus,
    outreachStatus: outreachStatusFor(contactReview, artifacts),
    auditStatus: auditStatusFor(artifacts),
    missingAssets,
    availableAssets,
    revenuePotential: revenuePotentialFor(lead.recommendedOffer),
    scopeClarity: scopeClarityFor(lead, artifacts),
    auditReadiness,
    retainerFit,
    estimatedComplexity: complexityFor(lead, artifacts),
    nextAction: nextActionFor(lead, artifacts, contactReview),
    suggestedCommand: suggestedCommandFor(lead, artifacts, contactReview),
    scoreReasons: score.reasons,
  };
}

function scoreReadiness(
  lead: Lead,
  artifacts: ClientReadinessArtifacts,
  contactReview: ContactReviewRecord | undefined,
  isTopOutreach: boolean,
): { score: number; reasons: string[] } {
  const reasons: string[] = ['commercial lead'];
  let score = 20;

  if (lead.status !== 'paused' && lead.status !== 'lost') {
    score += 10;
    reasons.push('not paused or lost');
  }
  if (lead.score >= 8) {
    score += 10;
    reasons.push('high lead score');
  } else if (lead.score >= 6) {
    score += 6;
    reasons.push('medium lead score');
  }
  if (lead.recommendedOffer !== 'not-fit') {
    score += 10;
    reasons.push('revenue fit');
  }
  if (isRetainerOffer(lead.recommendedOffer)) {
    score += 10;
    reasons.push('retainer fit');
  }
  if (artifacts.researchPack) score += 5;
  if (artifacts.leadPack) score += 5;
  if (artifacts.auditPack) score += 10;
  if (artifacts.outreachPack) score += 10;
  if (artifacts.contactReview || contactReview) score += 10;
  if (artifacts.clientWorkflow) score += 5;
  if (artifacts.sow) score += 5;
  if (isTopOutreach) {
    score += 5;
    reasons.push('top 5 outreach lead');
  }
  if (contactReview?.messageStatus === 'prepared' || contactReview?.messageStatus === 'approved' || contactReview?.messageStatus === 'follow-up-needed') {
    score += 5;
    reasons.push(`message status ${contactReview.messageStatus}`);
  }

  return { score: Math.min(100, Math.round(score)), reasons };
}

function detectArtifacts(leadId: string, hasContactReview: boolean): ClientReadinessArtifacts {
  return {
    researchPack: exists(path.join('output', 'research', `${leadId}-research-pack.md`)),
    leadPack: exists(path.join('output', 'lead-packs', `${leadId}.md`)),
    auditPack: exists(path.join('output', 'audit-packs', leadId)),
    outreachPack: exists(path.join('output', 'outreach-packs', leadId)),
    contactReview: hasContactReview || exists(path.join('output', 'contact-reviews', leadId, 'contact-review.md')),
    clientWorkflow: exists(path.join('output', 'client-workflows', leadId, 'discovery-call-prep.md'))
      || exists(path.join('output', 'client-workflows', leadId, 'audit-sale-plan.md'))
      || exists(path.join('output', 'client-workflows', leadId, 'retainer-conversion-plan.md')),
    sow: exists(path.join('output', 'sows', `${leadId}-sow.md`)),
  };
}

function assetLabels(artifacts: ClientReadinessArtifacts, expectedValue: boolean): string[] {
  const labels: Array<[keyof ClientReadinessArtifacts, string]> = [
    ['researchPack', 'Research pack'],
    ['leadPack', 'Lead pack'],
    ['auditPack', 'Audit pack'],
    ['outreachPack', 'Outreach pack'],
    ['contactReview', 'Contact review'],
    ['clientWorkflow', 'Client workflow'],
    ['sow', 'SOW'],
  ];

  return labels.filter(([key]) => artifacts[key] === expectedValue).map(([, label]) => label);
}

function statusForScore(score: number): ReadinessStatus {
  if (score >= 80) return 'READY';
  if (score >= 50) return 'PARTIAL';
  return 'NOT READY';
}

function statusForAudit(artifacts: ClientReadinessArtifacts): ReadinessStatus {
  if (artifacts.auditPack) return 'READY';
  if (artifacts.researchPack && artifacts.leadPack) return 'PARTIAL';
  return 'NOT READY';
}

function scopeClarityFor(lead: Lead, artifacts: ClientReadinessArtifacts): ReadinessStatus {
  if (artifacts.auditPack || artifacts.clientWorkflow || artifacts.sow) return 'READY';
  if (lead.painPoints.length > 0 && (artifacts.researchPack || artifacts.leadPack)) return 'PARTIAL';
  return 'NOT READY';
}

function complexityFor(lead: Lead, artifacts: ClientReadinessArtifacts): ComplexityLevel {
  if (artifacts.clientWorkflow || artifacts.sow) return 'Medium';
  if (lead.painPoints.length >= 4 || isRetainerOffer(lead.recommendedOffer)) return 'High';
  if (lead.painPoints.length >= 2) return 'Medium';
  return 'Low';
}

function auditStatusFor(artifacts: ClientReadinessArtifacts): string {
  if (artifacts.auditPack) return 'Audit pack exists';
  if (artifacts.leadPack) return 'Lead pack exists; audit pack needed';
  if (artifacts.researchPack) return 'Research pack exists; lead pack and audit pack needed';
  return 'Research needed';
}

function outreachStatusFor(contactReview: ContactReviewRecord | undefined, artifacts: ClientReadinessArtifacts): string {
  if (contactReview) return `Contact review ${contactReview.messageStatus}`;
  if (artifacts.contactReview) return 'Contact review exists';
  if (artifacts.outreachPack) return 'Outreach pack exists; contact review needed';
  return 'Outreach not ready';
}

function nextActionFor(lead: Lead, artifacts: ClientReadinessArtifacts, contactReview: ContactReviewRecord | undefined): string {
  if (!artifacts.researchPack) return `Generate research pack for ${lead.companyName}.`;
  if (!artifacts.leadPack) return `Generate lead pack for ${lead.companyName}.`;
  if (!artifacts.auditPack) return `Generate audit pack for ${lead.companyName}.`;
  if (!artifacts.outreachPack) return `Generate outreach pack for ${lead.companyName}.`;
  if (!artifacts.contactReview || !contactReview) return `Generate contact review for ${lead.companyName}.`;
  if (!artifacts.sow) return `Review contact status and decide whether ${lead.companyName} needs a SOW.`;
  return `Review manual outreach and discovery readiness for ${lead.companyName}.`;
}

function suggestedCommandFor(lead: Lead, artifacts: ClientReadinessArtifacts, contactReview: ContactReviewRecord | undefined): string {
  if (!artifacts.researchPack) return `npm run lead:research -- --id ${lead.id}`;
  if (!artifacts.leadPack) return `npm run lead:pack -- --id ${lead.id}`;
  if (!artifacts.auditPack) return `npm run audit:pack -- --id ${lead.id}`;
  if (!artifacts.outreachPack) return `npm run outreach:pack -- --id ${lead.id}`;
  if (!artifacts.contactReview || !contactReview) return `npm run contact:review -- --id ${lead.id}`;
  if (!artifacts.sow) return `npm run sow:generate -- --id ${lead.id}`;
  return `npm run contact:review -- --id ${lead.id}`;
}

function revenuePotentialFor(offer: RecommendedOffer): string {
  if (offer === 'qa-audit') return 'QA Audit: $199-$500';
  if (offer === 'playwright-starter-pack') return 'Playwright Starter Pack: $900-$1,500';
  if (offer === 'qa-automation-retainer') return 'QA Automation Retainer: $1,500-$3,000/month';
  if (offer === 'agency-partner-retainer') return 'Agency Partner Retainer: $1,500-$3,000/month';
  return 'No revenue path recommended';
}

function isRetainerOffer(offer: RecommendedOffer): boolean {
  return offer === 'qa-automation-retainer' || offer === 'agency-partner-retainer';
}

function renderTopFiveTable(candidates: ClientReadinessCandidate[]): string {
  if (candidates.length === 0) return 'No Top 5 commercial leads available.';

  return [
    '| Rank | Company | Readiness Score | Status | Offer | Outreach | Audit | Next Action |',
    '| ---: | --- | ---: | --- | --- | --- | --- | --- |',
    ...candidates.map((candidate, index) => `| ${index + 1} | ${escapeTable(candidate.lead.companyName)} | ${candidate.readinessScore} | ${candidate.readinessStatus} | ${candidate.lead.recommendedOffer} | ${escapeTable(candidate.outreachStatus)} | ${escapeTable(candidate.auditStatus)} | ${escapeTable(candidate.nextAction)} |`),
  ].join('\n');
}

function renderContactPlanTable(candidates: ClientReadinessCandidate[]): string {
  return [
    '| Company | Website | Industry | Current Readiness Score | Recommended Offer | Outreach Status | Audit Status | Missing Assets | Next Action | Suggested Command |',
    '| --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- |',
    ...candidates.map((candidate) => `| ${escapeTable(candidate.lead.companyName)} | ${escapeTable(candidate.lead.website)} | ${escapeTable(candidate.lead.industry)} | ${candidate.readinessScore} | ${candidate.lead.recommendedOffer} | ${escapeTable(candidate.outreachStatus)} | ${escapeTable(candidate.auditStatus)} | ${candidate.missingAssets.length ? escapeTable(candidate.missingAssets.join(', ')) : 'None'} | ${escapeTable(candidate.nextAction)} | \`${escapeTable(candidate.suggestedCommand)}\` |`),
  ].join('\n');
}

function renderReadinessBreakdown(candidates: ClientReadinessCandidate[], field: 'auditReadiness' | 'readinessStatus'): string {
  if (candidates.length === 0) return 'No Top 5 commercial leads available.';

  return candidates
    .map((candidate) => `- ${candidate.lead.companyName}: ${candidate[field]}, score ${candidate.readinessScore}/100, ${candidate.nextAction}`)
    .join('\n');
}

function renderDiscoveryReadiness(candidates: ClientReadinessCandidate[]): string {
  if (candidates.length === 0) return 'No Top 5 commercial leads available.';

  return candidates
    .map((candidate) => {
      const status = candidate.artifacts.clientWorkflow || candidate.artifacts.sow || candidate.artifacts.contactReview ? 'PARTIAL' : 'NOT READY';
      return `- ${candidate.lead.companyName}: ${status}, scope ${candidate.scopeClarity}, suggested command \`${candidate.suggestedCommand}\``;
    })
    .join('\n');
}

function renderSowTable(candidates: ClientReadinessCandidate[]): string {
  if (candidates.length === 0) return 'No Top 5 commercial leads available.';

  return [
    '| Company | Readiness Score | Status | Scope Clarity | Audit Readiness | Retainer Fit | Estimated Complexity | Next Required Step |',
    '| --- | ---: | --- | --- | --- | --- | --- | --- |',
    ...candidates.map((candidate) => `| ${escapeTable(candidate.lead.companyName)} | ${candidate.readinessScore} | ${sowStatusFor(candidate)} | ${candidate.scopeClarity} | ${candidate.auditReadiness} | ${candidate.retainerFit} | ${candidate.estimatedComplexity} | ${escapeTable(candidate.nextAction)} |`),
  ].join('\n');
}

function renderRevenuePotential(candidates: ClientReadinessCandidate[]): string {
  if (candidates.length === 0) return 'No Top 5 commercial leads available.';
  return candidates.map((candidate) => `- ${candidate.lead.companyName}: ${candidate.revenuePotential}; opportunity only, not booked revenue.`).join('\n');
}

function renderAuditPriorityList(candidates: ClientReadinessCandidate[]): string {
  if (candidates.length === 0) return 'No Top 5 commercial leads available.';

  return candidates
    .map((candidate, index) => [
      `### ${index + 1}. ${candidate.lead.companyName}`,
      `- Website: ${candidate.lead.website}`,
      `- Audit readiness: ${candidate.auditReadiness}`,
      `- Audit status: ${candidate.auditStatus}`,
      `- Suggested next command: \`${candidate.suggestedCommand}\``,
      '- Contact names: not provided; do not invent.',
      '- Audit findings: use only local evidence; do not invent findings.',
    ].join('\n'))
    .join('\n\n');
}

function sowStatusFor(candidate: ClientReadinessCandidate): ReadinessStatus {
  if (candidate.artifacts.sow || (candidate.artifacts.auditPack && candidate.artifacts.contactReview && candidate.scopeClarity !== 'NOT READY')) return 'READY';
  if (candidate.artifacts.leadPack || candidate.artifacts.auditPack || candidate.artifacts.contactReview) return 'PARTIAL';
  return 'NOT READY';
}

function buildRisks(report: ClientReadinessReport): string[] {
  const missingSources = report.contextSources.filter((source) => !source.exists);
  const risks = [
    'Top 5 readiness does not mean outreach should be sent automatically.',
    'Contact names are not generated or inferred.',
    'Audit findings must come from local audit evidence only.',
    'SOW readiness still requires Daniel review of scope, pricing, assumptions, and exclusions.',
  ];

  if (missingSources.length > 0) {
    risks.push(`Missing optional local context: ${missingSources.map((source) => source.path).join(', ')}`);
  }

  return risks;
}

function suggestedCommands(candidates: ClientReadinessCandidate[]): string[] {
  const commands = candidates.map((candidate) => candidate.suggestedCommand);
  commands.push('npm run outreach:operating-pack');
  commands.push('npm run revenue:command-center');
  commands.push('npm run mac:daily');
  return [...new Set(commands)];
}

function parseTopOutreachLeadIds(contextSources: ClientReadinessSource[]): Set<string> {
  const source = contextSources.find((candidate) => candidate.path === path.join('output', 'outreach-operating', 'top-5-real-outreach.md'));
  if (!source?.exists) return new Set();

  const content = fs.readFileSync(path.join(process.cwd(), source.path), 'utf8');
  return new Set([...content.matchAll(/--id\s+([a-z0-9-]+)/gi)].map((match) => match[1]));
}

function sortCandidates(a: ClientReadinessCandidate, b: ClientReadinessCandidate): number {
  if (b.readinessScore !== a.readinessScore) return b.readinessScore - a.readinessScore;
  if (b.lead.score !== a.lead.score) return b.lead.score - a.lead.score;
  return a.lead.companyName.localeCompare(b.lead.companyName);
}

function readJson<T>(relativePath: string, fallback: T): T {
  const absolutePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(absolutePath)) return fallback;
  const raw = fs.readFileSync(absolutePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function readContextSource(label: string, relativePath: string): ClientReadinessSource {
  const absolutePath = path.join(process.cwd(), relativePath);
  const exists = fs.existsSync(absolutePath);
  const content = exists ? fs.readFileSync(absolutePath, 'utf8') : '';

  return {
    label,
    path: relativePath,
    exists,
    excerpt: summarizeMarkdown(content),
  };
}

function summarizeMarkdown(content: string): string {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('|') && !line.startsWith('---'))
    .slice(0, 4)
    .join(' ');
}

function renderContextSources(sources: ClientReadinessSource[]): string {
  return sources.map((source) => {
    const status = source.exists ? 'available' : 'missing';
    const excerpt = source.exists && source.excerpt ? ` Summary: ${source.excerpt}` : '';
    return `- ${source.label}: ${status} (${source.path}).${excerpt}`;
  }).join('\n');
}

function renderChecklist(items: string[]): string {
  return items.map((item) => `- [ ] ${item}`).join('\n');
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), relativePath));
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
