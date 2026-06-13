import fs = require('fs');
import path = require('path');
import { ChannelRecord } from '../channelResearch/types';
import { CompanyContactRecord } from '../leadResearch/types';
import { loadLighthouseReport } from '../lighthouseEvidence/lighthouseRules';
import { buildOpportunity } from '../opportunityEngine/opportunityEngineRules';
import { PainResearchRecord } from '../painIntelligence/types';
import { SiteIntelligenceRecord } from '../siteIntelligence/types';
import {
  EvidenceCategory,
  EvidenceConfidence,
  EvidenceGap,
  EvidenceInputBundle,
  EvidenceItem,
  EvidenceOutputFile,
  EvidencePortfolio,
  EvidenceReport,
  EvidenceSupports,
  EvidenceTarget,
  FutureEvidenceSlot,
} from './types';

const targetsPath = path.join(process.cwd(), 'data', 'evidence', 'evidence.json');
const contactsPath = path.join(process.cwd(), 'data', 'contacts', 'contacts.json');
const channelsPath = path.join(process.cwd(), 'data', 'channels', 'channels.json');
const painPath = path.join(process.cwd(), 'data', 'pain-intelligence', 'pain-research.json');
const sitePath = path.join(process.cwd(), 'data', 'site-intelligence', 'site-intelligence.json');
const outputDir = path.join(process.cwd(), 'output', 'evidence');

export function loadEvidenceTargets(): EvidenceTarget[] {
  return readJson<EvidenceTarget[]>(targetsPath, []);
}

export function buildEvidenceReport(company: string): EvidenceReport {
  const bundle = buildInputBundle(company);
  const evidenceItems = buildEvidenceItems(bundle);
  const gaps = buildEvidenceGaps(bundle);
  const coverage = {
    contactCoverage: scoreContactCoverage(bundle),
    channelCoverage: scoreChannelCoverage(bundle),
    painCoverage: scorePainCoverage(bundle),
    siteCoverage: scoreSiteCoverage(bundle),
    lighthouseCoverage: scoreLighthouseCoverage(bundle),
    opportunityCoverage: scoreOutput('Opportunity Engine', bundle.outputFiles),
    auditCoverage: scoreOutput('QA Audit Pack', bundle.outputFiles),
  };
  const readinessScore = Math.round(average(Object.values(coverage)));

  return {
    companyId: bundle.target.companyId,
    companyName: bundle.target.companyName,
    opportunityScore: bundle.opportunity?.confidenceScore ?? 0,
    readinessScore,
    confidence: confidenceFromReadiness(readinessScore),
    gapCount: gaps.length,
    gaps,
    recommendedNextAction: recommendedNextAction(bundle, gaps, readinessScore),
    coverage,
    evidenceItems,
    outputFiles: bundle.outputFiles,
    futureEvidenceSlots: futureEvidenceSlots(),
    safetyNotes: safetyNotes(),
  };
}

export function buildEvidencePortfolio(): EvidencePortfolio {
  const reports = loadEvidenceTargets()
    .filter((target) => target.status === 'active')
    .map((target) => buildEvidenceReport(target.companyName));
  const priorities = [...reports].sort(sortEvidencePriority);

  return {
    generatedAt: new Date().toISOString(),
    reports,
    priorities,
    highestReadiness: priorities[0],
    lowestReadiness: [...reports].sort((left, right) => left.readinessScore - right.readinessScore || left.companyName.localeCompare(right.companyName))[0],
    bestFirstClient: priorities.find((report) => report.gapCount <= 1) ?? priorities[0],
    mostCompleteAudit: priorities.find((report) => report.coverage.auditCoverage === 100 && report.coverage.siteCoverage >= 75) ?? priorities[0],
    largestEvidenceGap: [...reports].sort((left, right) => right.gapCount - left.gapCount || left.readinessScore - right.readinessScore || left.companyName.localeCompare(right.companyName))[0],
    researchNeeded: reports.filter((report) => report.gapCount > 0),
  };
}

export function writeEvidenceReport(report: EvidenceReport): string {
  const outputPath = path.join(outputDir, `${report.companyId}-evidence.md`);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, renderEvidenceReport(report), 'utf8');
  return outputPath;
}

export function writeEvidencePortfolio(portfolio: EvidencePortfolio): string[] {
  const outputs = [
    ['evidence-portfolio.md', renderEvidencePortfolio(portfolio)],
    ['evidence-gaps.md', renderEvidenceGaps(portfolio)],
    ['evidence-readiness.md', renderEvidenceReadiness(portfolio)],
    ['evidence-priorities.md', renderEvidencePriorities(portfolio)],
  ] as const;

  fs.mkdirSync(outputDir, { recursive: true });

  return outputs.map(([fileName, content]) => {
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, content, 'utf8');
    return outputPath;
  });
}

export function renderEvidenceReport(report: EvidenceReport): string {
  return `# Evidence Collection: ${report.companyName}

## Executive Summary

${bullets([
    `Company: ${report.companyName}`,
    `Evidence Readiness: ${report.readinessScore}/100`,
    `Confidence: ${report.confidence}`,
    `Gap Count: ${report.gapCount}`,
    `Recommended Next Action: ${report.recommendedNextAction}`,
  ])}

## Coverage Factors

| Factor | Score |
| --- | --- |
| Contact Coverage | ${report.coverage.contactCoverage}/100 |
| Channel Coverage | ${report.coverage.channelCoverage}/100 |
| Pain Coverage | ${report.coverage.painCoverage}/100 |
| Site Coverage | ${report.coverage.siteCoverage}/100 |
| Lighthouse Coverage | ${report.coverage.lighthouseCoverage}/100 |
| Opportunity Coverage | ${report.coverage.opportunityCoverage}/100 |
| Audit Coverage | ${report.coverage.auditCoverage}/100 |

## Evidence Items

${report.evidenceItems.map(renderEvidenceItem).join('\n\n')}

## Evidence Gaps

${report.gaps.length > 0 ? bullets(report.gaps) : '- No required evidence gaps recorded.'}

## Source Outputs

${bullets(report.outputFiles.map((file) => `${file.label}: ${file.available ? 'Available' : 'Missing'} - ${file.path}`))}

## Future Evidence Slots

${report.futureEvidenceSlots.map((slot) => `### ${slot.type}

${bullets([
    `Status: ${slot.status}`,
    `Notes: ${slot.notes}`,
  ])}`).join('\n\n')}

## Safety Notes

${bullets(report.safetyNotes)}
`;
}

export function renderEvidencePortfolio(portfolio: EvidencePortfolio): string {
  return `# Evidence Portfolio

Generated: ${portfolio.generatedAt}

## Highest Readiness

${portfolio.highestReadiness ? portfolioBullets(portfolio.highestReadiness) : '- No evidence reports available.'}

## Lowest Readiness

${portfolio.lowestReadiness ? portfolioBullets(portfolio.lowestReadiness) : '- No evidence reports available.'}

## Best First Client

${portfolio.bestFirstClient ? portfolioBullets(portfolio.bestFirstClient) : '- No evidence reports available.'}

## Most Complete Audit

${portfolio.mostCompleteAudit ? portfolioBullets(portfolio.mostCompleteAudit) : '- No evidence reports available.'}

## Largest Evidence Gap

${portfolio.largestEvidenceGap ? portfolioBullets(portfolio.largestEvidenceGap) : '- No evidence reports available.'}

## Research Needed

${portfolio.researchNeeded.length > 0 ? bullets(portfolio.researchNeeded.map((report) => `${report.companyName}: ${report.gaps.join(', ')}`)) : '- No research gaps recorded.'}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderEvidenceGaps(portfolio: EvidencePortfolio): string {
  return `# Evidence Gaps

| Company | Gap Count | Gaps | Recommended Next Action |
| --- | --- | --- | --- |
${portfolio.priorities.map((report) => `| ${report.companyName} | ${report.gapCount} | ${report.gaps.length > 0 ? report.gaps.join('; ') : 'None'} | ${report.recommendedNextAction} |`).join('\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderEvidenceReadiness(portfolio: EvidencePortfolio): string {
  return `# Evidence Readiness

| Company | Readiness | Confidence | Contact | Channel | Pain | Site | Lighthouse | Opportunity | Audit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${portfolio.priorities.map((report) => `| ${report.companyName} | ${report.readinessScore}/100 | ${report.confidence} | ${report.coverage.contactCoverage} | ${report.coverage.channelCoverage} | ${report.coverage.painCoverage} | ${report.coverage.siteCoverage} | ${report.coverage.lighthouseCoverage} | ${report.coverage.opportunityCoverage} | ${report.coverage.auditCoverage} |`).join('\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderEvidencePriorities(portfolio: EvidencePortfolio): string {
  return `# Evidence Priorities

${portfolio.priorities.map((report, index) => `## ${index + 1}. ${report.companyName}

${bullets([
    `Readiness Score: ${report.readinessScore}/100`,
    `Opportunity Score: ${report.opportunityScore}/100`,
    `Confidence: ${report.confidence}`,
    `Gap Count: ${report.gapCount}`,
    `Recommended Next Action: ${report.recommendedNextAction}`,
  ])}`).join('\n\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

function buildInputBundle(company: string): EvidenceInputBundle {
  const target = findTarget(company);
  if (!target) {
    throw new Error(`Company not found in data/evidence/evidence.json: ${company}`);
  }

  const opportunity = buildOpportunity(target.companyName);

  return {
    target,
    contacts: readJson<CompanyContactRecord[]>(contactsPath, []).find((record) => record.companyId === target.companyId),
    channels: readJson<ChannelRecord[]>(channelsPath, []).filter((record) => record.companyId === target.companyId),
    pain: readJson<PainResearchRecord[]>(painPath, []).find((record) => record.companyId === target.companyId),
    site: readJson<SiteIntelligenceRecord[]>(sitePath, []).find((record) => record.companyId === target.companyId),
    lighthouse: loadLighthouseReport(target.companyId),
    opportunity,
    outputFiles: buildOutputFiles(target.companyId),
  };
}

function buildEvidenceItems(bundle: EvidenceInputBundle): EvidenceItem[] {
  const items: EvidenceItem[] = [];
  const contacts = bundle.contacts?.contacts ?? [];

  if (contacts.length > 0) {
    items.push(item(
      'contact-evidence',
      `${contacts.length} manually recorded contact(s) exist, including ${contacts.map((contact) => `${contact.name} (${contact.role})`).join(', ')}.`,
      sourceFor('Contact Research', bundle.outputFiles, 'data/contacts/contacts.json'),
      contacts.some((contact) => contact.status === 'message-sent' || contact.status === 'connected' || contact.status === 'replied') ? 'High' : 'Medium',
      ['Discovery Call', 'Proposal Support'],
    ));
  }

  if (bundle.channels.length > 0) {
    items.push(item(
      'channel-evidence',
      `${bundle.channels.length} local channel option(s) are recorded: ${bundle.channels.map((channel) => channel.channel).join(', ')}.`,
      sourceFor('Channel Research', bundle.outputFiles, 'data/channels/channels.json'),
      bundle.channels.some((channel) => channel.url.trim()) ? 'High' : 'Medium',
      ['Discovery Call', 'Research Needed'],
    ));
  }

  for (const observation of bundle.site?.observations ?? []) {
    items.push(item(
      'site-observation',
      observation.observation,
      sourceFor('Site Intelligence', bundle.outputFiles, 'data/site-intelligence/site-intelligence.json'),
      fromLowerConfidence(observation.confidence),
      ['QA Audit'],
    ));
  }

  for (const finding of bundle.site?.findings ?? []) {
    items.push(item(
      'qa-opportunity',
      finding.finding,
      sourceFor('Site Intelligence', bundle.outputFiles, 'data/site-intelligence/site-intelligence.json'),
      fromLowerConfidence(finding.confidence),
      ['QA Audit', 'Playwright Starter Pack'],
    ));
  }

  for (const uxOpportunity of bundle.site?.uxOpportunities ?? []) {
    items.push(item(
      'ux-opportunity',
      uxOpportunity.opportunity,
      sourceFor('Site Intelligence', bundle.outputFiles, 'data/site-intelligence/site-intelligence.json'),
      fromLowerConfidence(uxOpportunity.confidence),
      ['QA Audit'],
    ));
  }

  for (const complaint of bundle.pain?.complaints ?? []) {
    items.push(item(
      'pain-intelligence',
      complaint.summary,
      sourceFor('Pain Intelligence', bundle.outputFiles, 'data/pain-intelligence/pain-research.json'),
      fromLowerConfidence(complaint.confidence),
      ['QA Audit', 'Discovery Call'],
    ));
  }

  for (const automation of bundle.site?.automationOpportunities ?? []) {
    items.push(item(
      'automation-opportunity',
      `${automation.opportunity}: ${automation.coverage.join(', ')}`,
      sourceFor('Site Intelligence', bundle.outputFiles, 'data/site-intelligence/site-intelligence.json'),
      'Medium',
      ['Playwright Starter Pack', 'QA Automation Retainer'],
    ));
  }

  if (!bundle.site) {
    for (const automation of bundle.pain?.automationOpportunities ?? []) {
      items.push(item(
        'automation-opportunity',
        `${automation.title}: ${automation.coverage.join(', ')}`,
        sourceFor('Pain Intelligence', bundle.outputFiles, 'data/pain-intelligence/pain-research.json'),
        'Low',
        ['Playwright Starter Pack', 'QA Automation Retainer'],
      ));
    }
  }

  if (bundle.lighthouse) {
    items.push(item(
      'lighthouse-evidence',
      `Lighthouse homepage scores recorded: Performance ${scoreLabel(bundle.lighthouse.scores.performance)}, Accessibility ${scoreLabel(bundle.lighthouse.scores.accessibility)}, Best Practices ${scoreLabel(bundle.lighthouse.scores.bestPractices)}, SEO ${scoreLabel(bundle.lighthouse.scores.seo)}.`,
      sourceFor('Lighthouse Evidence', bundle.outputFiles, 'data/evidence/lighthouse/reports'),
      bundle.lighthouse.opportunities.length > 0 ? 'Medium' : 'High',
      ['QA Audit', 'Proposal Support'],
    ));
  }

  if (bundle.opportunity) {
    items.push(item(
      'audit-opportunity',
      bundle.opportunity.bestAuditAngle.angle,
      sourceFor('Opportunity Engine', bundle.outputFiles, 'output/opportunities'),
      confidenceFromReadiness(bundle.opportunity.confidenceScore),
      ['QA Audit', 'Proposal Support'],
    ));
    items.push(item(
      'commercial-opportunity',
      `${bundle.opportunity.bestFirstOffer} with retainer path: ${bundle.opportunity.retainerPath}`,
      sourceFor('Opportunity Engine', bundle.outputFiles, 'output/opportunities'),
      confidenceFromReadiness(bundle.opportunity.confidenceScore),
      ['Proposal Support', 'QA Automation Retainer'],
    ));
  }

  for (const gap of buildEvidenceGaps(bundle)) {
    items.push(item(
      'research-gap',
      gap,
      'local evidence readiness check',
      'High',
      ['Research Needed'],
    ));
  }

  return items;
}

function buildEvidenceGaps(bundle: EvidenceInputBundle): EvidenceGap[] {
  const gaps: EvidenceGap[] = [];
  const contacts = bundle.contacts?.contacts ?? [];
  const hasProduct = contacts.some((contact) => contact.department === 'product' || contact.role.toLowerCase().includes('product'));
  const hasEngineering = contacts.some((contact) => contact.department === 'engineering' || contact.role.toLowerCase().includes('engineering') || contact.role.toLowerCase().includes('technology'));

  if (contacts.length === 0) gaps.push('Missing Contact');
  if (!hasProduct) gaps.push('Missing Product Contact');
  if (!hasEngineering) gaps.push('Missing Engineering Contact');
  if (bundle.channels.length === 0 || !fileAvailable('Channel Research', bundle.outputFiles)) gaps.push('Missing Channel');
  if (!bundle.site || !fileAvailable('Site Intelligence', bundle.outputFiles)) gaps.push('Missing Site Evidence');
  if (!bundle.lighthouse || !fileAvailable('Lighthouse Evidence', bundle.outputFiles)) gaps.push('Missing Lighthouse Evidence');
  if (!bundle.opportunity || !fileAvailable('Opportunity Engine', bundle.outputFiles)) gaps.push('Missing Opportunity Evidence');
  if (!fileAvailable('QA Audit Pack', bundle.outputFiles)) gaps.push('Missing Audit Evidence');

  return gaps;
}

function buildOutputFiles(companyId: string): EvidenceOutputFile[] {
  const files = [
    ['Contact Research', `output/contact-research/${companyId}-contact-research.md`],
    ['Channel Research', `output/channel-research/${companyId}.md`],
    ['Pain Intelligence', `output/pain-research/${companyId}-pain-research.md`],
    ['Site Intelligence', `output/site-intelligence/${companyId}-site-intelligence.md`],
    ['Lighthouse Evidence', `output/lighthouse/${companyId}-lighthouse.md`],
    ['Opportunity Engine', `output/opportunities/${companyId}-opportunity.md`],
    ['QA Audit Pack', `output/audit-packs/${companyId}-audit-pack.md`],
  ] as const;

  return files.map(([label, relativePath]) => ({
    label,
    path: relativePath,
    available: fs.existsSync(path.join(process.cwd(), relativePath)),
  }));
}

function scoreContactCoverage(bundle: EvidenceInputBundle): number {
  const contacts = bundle.contacts?.contacts ?? [];
  if (contacts.length === 0) return 0;

  const hasProduct = contacts.some((contact) => contact.department === 'product' || contact.role.toLowerCase().includes('product'));
  const hasEngineering = contacts.some((contact) => contact.department === 'engineering' || contact.role.toLowerCase().includes('engineering') || contact.role.toLowerCase().includes('technology'));
  const base = contacts.length >= 2 ? 50 : 35;
  const product = hasProduct ? 25 : 0;
  const engineering = hasEngineering ? 25 : 0;
  return Math.min(100, base + product + engineering);
}

function scoreChannelCoverage(bundle: EvidenceInputBundle): number {
  if (bundle.channels.length === 0 || !fileAvailable('Channel Research', bundle.outputFiles)) return 0;
  const hasLinkedIn = bundle.channels.some((channel) => channel.type === 'linkedin');
  const hasNonLinkedIn = bundle.channels.some((channel) => channel.type !== 'linkedin');
  const hasRecordedUrl = bundle.channels.some((channel) => channel.url.trim());
  return Math.min(100, 50 + (hasLinkedIn ? 15 : 0) + (hasNonLinkedIn ? 20 : 0) + (hasRecordedUrl ? 15 : 0));
}

function scorePainCoverage(bundle: EvidenceInputBundle): number {
  if (!bundle.pain || !fileAvailable('Pain Intelligence', bundle.outputFiles)) return 0;
  return Math.min(100, 40 + Math.min(30, bundle.pain.complaints.length * 10) + Math.min(30, bundle.pain.qaRisks.length * 10));
}

function scoreSiteCoverage(bundle: EvidenceInputBundle): number {
  if (!bundle.site || !fileAvailable('Site Intelligence', bundle.outputFiles)) return 0;
  const observationScore = Math.min(35, bundle.site.observations.length * 10);
  const findingScore = Math.min(35, bundle.site.findings.length * 15);
  const screenshotScore = bundle.site.screenshotCapture === 'Not Available' ? 0 : 15;
  const automationScore = bundle.site.automationOpportunities.length > 0 ? 15 : 0;
  return Math.min(100, 15 + observationScore + findingScore + screenshotScore + automationScore);
}

function scoreLighthouseCoverage(bundle: EvidenceInputBundle): number {
  if (!bundle.lighthouse || !fileAvailable('Lighthouse Evidence', bundle.outputFiles)) return 0;
  const availableScores = Object.values(bundle.lighthouse.scores).filter((score) => score !== null).length;
  return Math.min(100, availableScores * 25);
}

function scoreOutput(label: string, outputFiles: EvidenceOutputFile[]): number {
  return fileAvailable(label, outputFiles) ? 100 : 0;
}

function recommendedNextAction(bundle: EvidenceInputBundle, gaps: EvidenceGap[], readinessScore: number): string {
  if (gaps.includes('Missing Contact')) return 'Manually research and approve at least one contact before outreach or proposal use.';
  if (gaps.includes('Missing Product Contact') || gaps.includes('Missing Engineering Contact')) return 'Manually verify product and engineering contact coverage before client-facing use.';
  if (gaps.includes('Missing Lighthouse Evidence')) return `Run npm run evidence:lighthouse -- --company "${bundle.target.companyName}" -- --url <public-homepage-url> before final audit packaging.`;
  if (gaps.includes('Missing Audit Evidence')) return `Run npm run audit:generate -- --company "${bundle.target.companyName}" before using this evidence externally.`;
  if (readinessScore >= 90) return 'Review evidence and approval checklist before using for discovery or QA Audit positioning.';
  return 'Review remaining gaps and confirm evidence manually before any external action.';
}

function futureEvidenceSlots(): FutureEvidenceSlot[] {
  return [
    ['playwright-evidence', 'Future slot for reviewed Playwright execution evidence.'],
    ['lighthouse-evidence', 'Implemented source for reviewed Lighthouse homepage evidence.'],
    ['screenshot', 'Future slot for manually approved screenshot evidence.'],
    ['accessibility-scan', 'Future slot for reviewed accessibility scan evidence.'],
    ['performance-snapshot', 'Future slot for reviewed performance snapshot evidence.'],
    ['manual-qa-observation', 'Future slot for manually recorded QA observations.'],
  ].map(([type, notes]) => ({
    type: type as FutureEvidenceSlot['type'],
    status: type === 'lighthouse-evidence' ? 'Implemented' : 'Not Implemented',
    notes,
  }));
}

function renderEvidenceItem(item: EvidenceItem): string {
  return `### ${item.category}

Category:
${item.category}

Description:
${item.description}

Source:
${item.source}

Confidence:
${item.confidence}

Supports:
${item.supports.join(', ')}`;
}

function item(category: EvidenceCategory, description: string, source: string, confidence: EvidenceConfidence, supports: EvidenceSupports[]): EvidenceItem {
  return {
    category,
    description,
    source,
    confidence,
    supports,
  };
}

function sourceFor(label: string, outputFiles: EvidenceOutputFile[], fallback: string): string {
  const file = outputFiles.find((outputFile) => outputFile.label === label);
  if (!file) return fallback;
  return file.available ? file.path : `${fallback} (${file.path} missing)`;
}

function fileAvailable(label: string, outputFiles: EvidenceOutputFile[]): boolean {
  return Boolean(outputFiles.find((outputFile) => outputFile.label === label)?.available);
}

function confidenceFromReadiness(score: number): EvidenceConfidence {
  if (score >= 85) return 'High';
  if (score >= 70) return 'Medium';
  return 'Low';
}

function fromLowerConfidence(confidence: string): EvidenceConfidence {
  if (confidence === 'high') return 'High';
  if (confidence === 'medium') return 'Medium';
  return 'Low';
}

function scoreLabel(score: number | null): string {
  if (score === null) return 'Not Available';
  return `${Math.round(score * 100)}/100`;
}

function sortEvidencePriority(left: EvidenceReport, right: EvidenceReport): number {
  return right.readinessScore - left.readinessScore
    || right.opportunityScore - left.opportunityScore
    || left.gapCount - right.gapCount
    || left.companyName.localeCompare(right.companyName);
}

function portfolioBullets(report: EvidenceReport): string {
  return bullets([
    `Company: ${report.companyName}`,
    `Readiness Score: ${report.readinessScore}/100`,
    `Opportunity Score: ${report.opportunityScore}/100`,
    `Confidence: ${report.confidence}`,
    `Gap Count: ${report.gapCount}`,
    `Recommended Next Action: ${report.recommendedNextAction}`,
  ]);
}

function safetyNotes(): string[] {
  return [
    'Evidence Collection Engine only. This is not browser automation, penetration testing, vulnerability scanning, screenshot automation, Playwright execution, or Lighthouse execution.',
    'Do not invent bugs, vulnerabilities, incidents, outages, screenshots, customer quotes, complaints, findings, or metrics.',
    'All evidence originates from existing local Studio data and generated Studio outputs.',
    'No APIs, scraping, credentials, external databases, outreach, invoices, contracts, or payment instructions are used.',
    'Human approval is required before using evidence externally.',
  ];
}

function findTarget(company: string): EvidenceTarget | undefined {
  const normalized = normalize(company);
  return loadEvidenceTargets().find((target) => matchesNormalized(normalize(target.companyId), normalized) || matchesNormalized(normalize(target.companyName), normalized));
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function bullets(items: string[]): string {
  if (items.length === 0) return '- Not enough evidence yet.';
  return items.map((item) => `- ${item}`).join('\n');
}

function matchesNormalized(left: string, right: string): boolean {
  return left === right || left.includes(right) || right.includes(left);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}
