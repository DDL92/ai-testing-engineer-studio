import fs = require('fs');
import path = require('path');
import { chromium, type ConsoleMessage, type Page, type Response } from '@playwright/test';
import { ChannelRecord } from '../channelResearch/types';
import { CompanyContactRecord } from '../leadResearch/types';
import { loadLighthouseReport } from '../lighthouseEvidence/lighthouseRules';
import { buildOpportunity } from '../opportunityEngine/opportunityEngineRules';
import { PainResearchRecord } from '../painIntelligence/types';
import { buildRevenueIntelligenceReport } from '../revenueIntelligence/revenueIntelligenceRules';
import { SiteIntelligenceRecord } from '../siteIntelligence/types';
import {
  ConsoleEvidenceReport,
  DynamicEvidenceReadinessDecision,
  DynamicEvidenceStatus,
  DynamicEvidenceSummary,
  DynamicEvidenceTarget,
  DynamicLighthouseEvidenceReport,
  EvidenceCategory,
  EvidenceConfidence,
  EvidenceGap,
  EvidenceInputBundle,
  EvidenceItem,
  EvidenceOutputFile,
  EvidencePortfolio,
  EvidenceReport,
  EvidenceSignal,
  EvidenceSupports,
  EvidenceTarget,
  FlowEvidenceItem,
  FlowEvidenceReport,
  FutureEvidenceSlot,
  NetworkEvidenceReport,
  NetworkEvidenceSignal,
  PageEvidenceReport,
  ScreenshotEvidenceItem,
  ScreenshotEvidenceReport,
} from './types';

const targetsPath = path.join(process.cwd(), 'data', 'evidence', 'evidence.json');
const contactsPath = path.join(process.cwd(), 'data', 'contacts', 'contacts.json');
const channelsPath = path.join(process.cwd(), 'data', 'channels', 'channels.json');
const painPath = path.join(process.cwd(), 'data', 'pain-intelligence', 'pain-research.json');
const sitePath = path.join(process.cwd(), 'data', 'site-intelligence', 'site-intelligence.json');
const outputDir = path.join(process.cwd(), 'output', 'evidence');
const dynamicStateDir = path.join(outputDir, '.state');
const screenshotsDir = path.join(outputDir, 'screenshots');
const dynamicLighthouseDir = path.join(outputDir, 'lighthouse');
const navigationTimeoutMs = 25_000;

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

export function getDynamicEvidenceTarget(): DynamicEvidenceTarget {
  const revenue = buildRevenueIntelligenceReport();
  const topLead = revenue.topLead;

  if (!topLead) {
    return {
      companyId: 'no-unified-top-lead',
      companyName: 'No unified top lead',
      website: '',
      source: 'Revenue Intelligence',
      generatedAt: new Date().toISOString(),
    };
  }

  return {
    companyId: topLead.companyId,
    companyName: topLead.companyName,
    website: normalizePublicUrl(topLead.website),
    source: 'Revenue Intelligence',
    generatedAt: new Date().toISOString(),
  };
}

export async function collectPageEvidence(): Promise<PageEvidenceReport> {
  const target = getDynamicEvidenceTarget();
  ensureDynamicDirs();

  if (!target.website) {
    const report = pageFailureReport(target, 'No public website is recorded for the Revenue Intelligence top lead.');
    writePageEvidence(report);
    return report;
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  try {
    const result = await gotoPublicPage(page, target.website);
    const title = await safeTitle(page);
    const report: PageEvidenceReport = {
      generatedAt: new Date().toISOString(),
      target,
      requestedUrl: target.website,
      finalUrl: page.url(),
      statusCode: result.response?.status() ?? null,
      title,
      evidenceStatus: pageEvidenceStatus(result.response, title, result.error),
      notes: [
        result.error ? `Observed navigation signal: ${result.error}` : 'Public page navigation completed.',
        title ? 'Page title observed.' : 'Page title was not observed.',
        'Public-page observation only. No private or authenticated flows were tested.',
      ],
    };
    writePageEvidence(report);
    return report;
  } finally {
    await context.close();
    await browser.close();
  }
}

export async function collectFlowEvidence(): Promise<FlowEvidenceReport> {
  const target = getDynamicEvidenceTarget();
  ensureDynamicDirs();

  if (!target.website) {
    const report: FlowEvidenceReport = {
      generatedAt: new Date().toISOString(),
      target,
      flows: [],
      evidenceStatus: 'FAIL',
      notes: ['No public website is recorded for the Revenue Intelligence top lead.'],
    };
    writeFlowEvidence(report);
    return report;
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1366, height: 768 } });

  try {
    const discoverPage = await context.newPage();
    const urls = await discoverCandidateFlowUrls(discoverPage, target.website);
    await discoverPage.close();
    const flows: FlowEvidenceItem[] = [];

    for (const candidate of urls.slice(0, 7)) {
      const page = await context.newPage();
      const result = await gotoPublicPage(page, candidate.url);
      const title = await safeTitle(page);
      flows.push({
        flowName: candidate.flowName,
        url: page.url() || candidate.url,
        statusCode: result.response?.status() ?? null,
        title,
        status: flowStatus(result.response, title, result.error),
        notes: [
          result.error ? `Observed navigation signal: ${result.error}` : 'Candidate public flow loaded.',
          'Candidate public flow only. No private, authenticated, checkout, payment, or account action was performed.',
        ],
      });
      await page.close();
    }

    const report: FlowEvidenceReport = {
      generatedAt: new Date().toISOString(),
      target,
      flows,
      evidenceStatus: aggregateStatus(flows.map((flow) => flow.status)),
      notes: [
        `${flows.length} candidate public flow(s) reviewed.`,
        'Flow labels are inferred from public links and should be manually reviewed before external use.',
      ],
    };
    writeFlowEvidence(report);
    return report;
  } finally {
    await context.close();
    await browser.close();
  }
}

export async function collectConsoleEvidence(): Promise<ConsoleEvidenceReport> {
  const target = getDynamicEvidenceTarget();
  ensureDynamicDirs();
  const signals: EvidenceSignal[] = [];

  if (!target.website) {
    const report = buildConsoleReport(target, signals, ['No public website is recorded for the Revenue Intelligence top lead.']);
    writeConsoleEvidence(report);
    return report;
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });

  try {
    const page = await context.newPage();
    page.on('console', (message) => {
      const level = consoleLevel(message);
      if (!level) return;
      signals.push({
        level,
        source: 'observed console signal',
        message: trimSignal(message.text()),
        url: page.url(),
      });
    });
    await gotoPublicPage(page, target.website);
    await page.waitForLoadState('domcontentloaded', { timeout: 10_000 }).catch(() => undefined);
    await page.close();
  } finally {
    await context.close();
    await browser.close();
  }

  const report = buildConsoleReport(target, signals, [
    `${signals.length} observed console signal(s) recorded.`,
    'Signals are observations only and are not bug, outage, vulnerability, revenue, or customer-impact claims.',
  ]);
  writeConsoleEvidence(report);
  return report;
}

export async function collectNetworkEvidence(): Promise<NetworkEvidenceReport> {
  const target = getDynamicEvidenceTarget();
  ensureDynamicDirs();
  const signals: NetworkEvidenceSignal[] = [];

  if (!target.website) {
    const report = buildNetworkReport(target, signals, ['No public website is recorded for the Revenue Intelligence top lead.']);
    writeNetworkEvidence(report);
    return report;
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });

  try {
    const page = await context.newPage();
    page.on('response', (response) => {
      const status = response.status();
      if (status < 400) return;
      signals.push({
        level: status >= 500 ? 'ERROR' : 'WARNING',
        method: response.request().method(),
        url: response.url(),
        statusCode: status,
        message: `Observed network signal: HTTP ${status}`,
      });
    });
    page.on('requestfailed', (request) => {
      signals.push({
        level: 'ERROR',
        method: request.method(),
        url: request.url(),
        statusCode: null,
        message: `Observed network signal: ${request.failure()?.errorText ?? 'request failed'}`,
      });
    });
    await gotoPublicPage(page, target.website);
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
    await page.close();
  } finally {
    await context.close();
    await browser.close();
  }

  const report = buildNetworkReport(target, dedupeNetworkSignals(signals), [
    `${signals.length} observed network signal(s) recorded before de-duplication.`,
    'Signals are observations only and are not bug, outage, vulnerability, revenue, or customer-impact claims.',
  ]);
  writeNetworkEvidence(report);
  return report;
}

export async function collectScreenshotEvidence(): Promise<ScreenshotEvidenceReport> {
  const target = getDynamicEvidenceTarget();
  ensureDynamicDirs();
  const viewports: Array<Omit<ScreenshotEvidenceItem, 'path' | 'exists' | 'status' | 'notes'>> = [
    { viewport: 'desktop', width: 1366, height: 768 },
    { viewport: 'tablet', width: 820, height: 1180 },
    { viewport: 'mobile', width: 390, height: 844 },
  ];
  const screenshots: ScreenshotEvidenceItem[] = [];

  if (!target.website) {
    const report: ScreenshotEvidenceReport = {
      generatedAt: new Date().toISOString(),
      target,
      screenshots: [],
      evidenceStatus: 'FAIL',
      notes: ['No public website is recorded for the Revenue Intelligence top lead.'],
    };
    writeScreenshotEvidence(report);
    return report;
  }

  const browser = await chromium.launch({ headless: true });

  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        ignoreHTTPSErrors: true,
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await context.newPage();
      const result = await gotoPublicPage(page, target.website);
      await page.waitForLoadState('domcontentloaded', { timeout: 10_000 }).catch(() => undefined);
      const relativePath = path.join('output', 'evidence', 'screenshots', `${target.companyId}-${viewport.viewport}.png`);
      const absolutePath = path.join(process.cwd(), relativePath);
      await page.screenshot({ path: absolutePath, fullPage: true });
      const exists = fs.existsSync(absolutePath);
      screenshots.push({
        ...viewport,
        path: relativePath,
        exists,
        status: exists && !result.error ? 'PASS' : exists ? 'WARNING' : 'FAIL',
        notes: [
          result.error ? `Observed navigation signal before screenshot: ${result.error}` : 'Screenshot captured after public page load.',
          'Screenshot is a public-page observation only.',
        ],
      });
      await context.close();
    }
  } finally {
    await browser.close();
  }

  const report: ScreenshotEvidenceReport = {
    generatedAt: new Date().toISOString(),
    target,
    screenshots,
    evidenceStatus: aggregateStatus(screenshots.map((screenshot) => screenshot.status)),
    notes: [`${screenshots.filter((screenshot) => screenshot.exists).length}/${viewports.length} screenshot(s) captured.`],
  };
  writeScreenshotEvidence(report);
  return report;
}

export async function collectLighthouseEvidence(): Promise<DynamicLighthouseEvidenceReport> {
  const target = getDynamicEvidenceTarget();
  ensureDynamicDirs();

  if (!target.website) {
    const report = lighthouseFailureReport(target, 'No public website is recorded for the Revenue Intelligence top lead.');
    writeDynamicLighthouseEvidence(report);
    return report;
  }

  try {
    const [{ default: lighthouse, generateReport }, chromeLauncher] = await Promise.all([
      import('lighthouse'),
      import('chrome-launcher'),
    ]);
    const chrome = await chromeLauncher.launch({
      chromeFlags: [
        '--headless=new',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-default-browser-check',
        '--no-sandbox',
      ],
      logLevel: 'error',
    });

    try {
      const runnerResult = await lighthouse(target.website, {
        port: chrome.port,
        logLevel: 'error',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        channel: 'ai-testing-engineer-studio',
      });

      if (!runnerResult) {
        throw new Error('Lighthouse did not return a result.');
      }

      const lhr = runnerResult.lhr;
      const rawReportPath = path.join('output', 'evidence', 'lighthouse', `${target.companyId}-lhr.json`);
      const htmlReportPath = path.join('output', 'evidence', 'lighthouse', `${target.companyId}.html`);
      fs.writeFileSync(path.join(process.cwd(), rawReportPath), JSON.stringify(lhr, null, 2), 'utf8');
      fs.writeFileSync(path.join(process.cwd(), htmlReportPath), generateReport(lhr, 'html'), 'utf8');

      const report: DynamicLighthouseEvidenceReport = {
        generatedAt: new Date().toISOString(),
        target,
        requestedUrl: target.website,
        finalUrl: lhr.finalDisplayedUrl || lhr.finalUrl || target.website,
        scores: {
          performance: lhr.categories.performance?.score ?? null,
          accessibility: lhr.categories.accessibility?.score ?? null,
          bestPractices: lhr.categories['best-practices']?.score ?? null,
          seo: lhr.categories.seo?.score ?? null,
        },
        rawReportPath,
        htmlReportPath,
        evidenceStatus: Object.values(lhr.categories).length > 0 ? 'PASS' : 'WARNING',
        failureReason: null,
        notes: [
          'Lighthouse completed against the public page.',
          'Scores are recorded as observed Lighthouse scores only and are not business, revenue, or customer-impact claims.',
        ],
      };
      writeDynamicLighthouseEvidence(report);
      return report;
    } finally {
      chrome.kill();
    }
  } catch (error) {
    const report = lighthouseFailureReport(target, errorMessage(error));
    writeDynamicLighthouseEvidence(report);
    return report;
  }
}

export function buildDynamicEvidenceSummary(): DynamicEvidenceSummary {
  const target = getDynamicEvidenceTarget();
  return {
    generatedAt: new Date().toISOString(),
    target,
    page: readDynamicState<PageEvidenceReport>('page-evidence.json'),
    flows: readDynamicState<FlowEvidenceReport>('flow-evidence.json'),
    console: readDynamicState<ConsoleEvidenceReport>('console-evidence.json'),
    network: readDynamicState<NetworkEvidenceReport>('network-evidence.json'),
    screenshots: readDynamicState<ScreenshotEvidenceReport>('screenshot-evidence.json'),
    lighthouse: readDynamicState<DynamicLighthouseEvidenceReport>('lighthouse-evidence.json'),
  };
}

export function writeEvidenceSummaryOutput(summary = buildDynamicEvidenceSummary()): string[] {
  ensureDynamicDirs();
  const outputPath = path.join(outputDir, 'evidence-summary.md');
  fs.writeFileSync(outputPath, renderDynamicEvidenceSummary(summary), 'utf8');
  return [outputPath];
}

export function buildEvidenceReadinessDecision(summary = buildDynamicEvidenceSummary()): DynamicEvidenceReadinessDecision {
  const blockers: string[] = [];
  const pageReady = summary.page?.evidenceStatus === 'PASS';
  const screenshotsReady = (summary.screenshots?.screenshots.filter((screenshot) => screenshot.exists).length ?? 0) >= 3;
  const flowsReady = (summary.flows?.flows.length ?? 0) > 0 && summary.flows?.evidenceStatus !== 'FAIL';
  const lighthouseReady = summary.lighthouse?.evidenceStatus === 'PASS';

  if (!summary.page) blockers.push('Page evidence has not been collected.');
  else if (!pageReady) blockers.push(`Page evidence is ${summary.page.evidenceStatus}.`);
  if (!summary.flows) blockers.push('Flow evidence has not been collected.');
  else if (!flowsReady) blockers.push(`Candidate public flow evidence is ${summary.flows.evidenceStatus}.`);
  if (!summary.screenshots) blockers.push('Screenshot evidence has not been collected.');
  else if (!screenshotsReady) blockers.push('Desktop, tablet, and mobile screenshots are not all available.');
  if (!summary.lighthouse) blockers.push('Lighthouse evidence has not been collected.');
  else if (!lighthouseReady) blockers.push(`Lighthouse evidence is ${summary.lighthouse.evidenceStatus}.`);

  const status = pageReady && screenshotsReady && flowsReady && lighthouseReady
    ? 'READY'
    : pageReady && screenshotsReady
      ? 'PARTIAL'
      : 'NOT READY';

  return {
    generatedAt: new Date().toISOString(),
    target: summary.target,
    status,
    commercialReadiness: status === 'READY' ? 'Commercially Ready' : status === 'PARTIAL' ? 'Needs Manual Review' : 'Not Commercially Ready',
    goNoGo: status === 'READY' ? 'GO' : status === 'PARTIAL' ? 'PARTIAL' : 'NO GO',
    evidenceStatus: status,
    pageStatus: summary.page?.evidenceStatus ?? 'MISSING',
    flowStatus: summary.flows?.evidenceStatus ?? 'MISSING',
    screenshotStatus: summary.screenshots?.evidenceStatus ?? 'MISSING',
    lighthouseStatus: summary.lighthouse?.evidenceStatus ?? 'MISSING',
    blockers,
    safetyNotes: dynamicSafetyNotes(),
  };
}

export function writeEvidenceReadinessDecisionOutput(decision = buildEvidenceReadinessDecision()): string[] {
  ensureDynamicDirs();
  writeDynamicState('evidence-readiness.json', decision);
  const outputPath = path.join(outputDir, 'evidence-readiness.md');
  fs.writeFileSync(outputPath, renderEvidenceReadinessDecision(decision), 'utf8');
  return [outputPath];
}

export function isValidScreenshotEvidencePath(value: string): boolean {
  if (!value.endsWith('.png')) return false;
  if (value.includes('..') || path.isAbsolute(value)) return false;
  const normalizedPath = value.split(path.sep).join('/');
  return normalizedPath.startsWith('output/evidence/screenshots/');
}

function ensureDynamicDirs(): void {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(dynamicStateDir, { recursive: true });
  fs.mkdirSync(screenshotsDir, { recursive: true });
  fs.mkdirSync(dynamicLighthouseDir, { recursive: true });
}

function writePageEvidence(report: PageEvidenceReport): string[] {
  writeDynamicState('page-evidence.json', report);
  const outputPath = path.join(outputDir, 'page-evidence.md');
  fs.writeFileSync(outputPath, renderPageEvidence(report), 'utf8');
  return [outputPath];
}

function writeFlowEvidence(report: FlowEvidenceReport): string[] {
  writeDynamicState('flow-evidence.json', report);
  const outputPath = path.join(outputDir, 'flow-evidence.md');
  fs.writeFileSync(outputPath, renderFlowEvidence(report), 'utf8');
  return [outputPath];
}

function writeConsoleEvidence(report: ConsoleEvidenceReport): string[] {
  writeDynamicState('console-evidence.json', report);
  const outputPath = path.join(outputDir, 'console-evidence.md');
  fs.writeFileSync(outputPath, renderConsoleEvidence(report), 'utf8');
  return [outputPath];
}

function writeNetworkEvidence(report: NetworkEvidenceReport): string[] {
  writeDynamicState('network-evidence.json', report);
  const outputPath = path.join(outputDir, 'network-evidence.md');
  fs.writeFileSync(outputPath, renderNetworkEvidence(report), 'utf8');
  return [outputPath];
}

function writeScreenshotEvidence(report: ScreenshotEvidenceReport): string[] {
  writeDynamicState('screenshot-evidence.json', report);
  const outputPath = path.join(outputDir, 'screenshot-evidence.md');
  fs.writeFileSync(outputPath, renderScreenshotEvidence(report), 'utf8');
  return [outputPath];
}

function writeDynamicLighthouseEvidence(report: DynamicLighthouseEvidenceReport): string[] {
  writeDynamicState('lighthouse-evidence.json', report);
  const outputPath = path.join(outputDir, 'lighthouse-evidence.md');
  fs.writeFileSync(outputPath, renderDynamicLighthouseEvidence(report), 'utf8');
  return [outputPath];
}

function writeDynamicState(fileName: string, value: unknown): void {
  ensureDynamicDirs();
  fs.writeFileSync(path.join(dynamicStateDir, fileName), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readDynamicState<T>(fileName: string): T | null {
  const filePath = path.join(dynamicStateDir, fileName);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

async function gotoPublicPage(page: Page, url: string): Promise<{ response: Response | null; error: string | null }> {
  try {
    const response = await page.goto(normalizePublicUrl(url), {
      waitUntil: 'domcontentloaded',
      timeout: navigationTimeoutMs,
    });
    return { response, error: null };
  } catch (error) {
    return { response: null, error: errorMessage(error) };
  }
}

async function safeTitle(page: Page): Promise<string> {
  try {
    return (await page.title()).trim();
  } catch {
    return '';
  }
}

async function discoverCandidateFlowUrls(page: Page, homepage: string): Promise<Array<{ flowName: string; url: string }>> {
  const homeUrl = normalizePublicUrl(homepage);
  const found = new Map<string, { flowName: string; url: string }>();
  found.set(homeUrl, { flowName: 'Homepage', url: homeUrl });
  await gotoPublicPage(page, homeUrl);

  const links = await page.locator('a[href]').evaluateAll((anchors) => anchors
    .map((anchor) => ({
      href: (anchor as HTMLAnchorElement).href,
      text: (anchor.textContent ?? '').trim(),
    }))
    .filter((anchor) => anchor.href));

  for (const link of links) {
    const flowName = candidateFlowName(`${link.text} ${link.href}`);
    if (!flowName) continue;
    const normalized = normalizePublicUrl(link.href);
    if (!isSameOrigin(homeUrl, normalized) || isForbiddenPublicFlow(normalized)) continue;
    found.set(normalized, { flowName, url: normalized });
  }

  const fallbackPaths = [
    ['Pricing', '/pricing'],
    ['Demo', '/demo'],
    ['Contact', '/contact'],
    ['Signup', '/signup'],
    ['Booking', '/booking'],
    ['Schedule', '/schedule'],
  ] as const;
  for (const [flowName, relativePath] of fallbackPaths) {
    if (found.size >= 7) break;
    const fallbackUrl = new URL(relativePath, homeUrl).toString();
    if (!found.has(fallbackUrl)) found.set(fallbackUrl, { flowName, url: fallbackUrl });
  }

  return Array.from(found.values());
}

function candidateFlowName(value: string): string | null {
  const normalized = value.toLowerCase();
  if (normalized.includes('pricing')) return 'Pricing';
  if (normalized.includes('demo')) return 'Demo';
  if (normalized.includes('contact')) return 'Contact';
  if (normalized.includes('signup') || normalized.includes('sign up')) return 'Signup';
  if (normalized.includes('booking') || normalized.includes('book')) return 'Booking';
  if (normalized.includes('schedule')) return 'Schedule';
  return null;
}

function isForbiddenPublicFlow(url: string): boolean {
  return [
    /\/login\b/i,
    /\/signin\b/i,
    /\/sign-in\b/i,
    /\/account\b/i,
    /\/dashboard\b/i,
    /\/admin\b/i,
    /\/checkout\b/i,
    /\/payment\b/i,
    /\/billing\b/i,
    /\/cart\b/i,
  ].some((pattern) => pattern.test(url));
}

function isSameOrigin(left: string, right: string): boolean {
  try {
    const leftUrl = new URL(left);
    const rightUrl = new URL(right);
    return leftUrl.hostname.replace(/^www\./, '') === rightUrl.hostname.replace(/^www\./, '');
  } catch {
    return false;
  }
}

function pageFailureReport(target: DynamicEvidenceTarget, reason: string): PageEvidenceReport {
  return {
    generatedAt: new Date().toISOString(),
    target,
    requestedUrl: target.website,
    finalUrl: target.website,
    statusCode: null,
    title: '',
    evidenceStatus: 'FAIL',
    notes: [reason, 'Public-page observation only.'],
  };
}

function pageEvidenceStatus(response: Response | null, title: string, error: string | null): DynamicEvidenceStatus {
  if (error) return 'FAIL';
  const status = response?.status() ?? null;
  if (status === null) return 'WARNING';
  if (status >= 500) return 'FAIL';
  if (status >= 400 || !title) return 'WARNING';
  return 'PASS';
}

function flowStatus(response: Response | null, title: string, error: string | null): DynamicEvidenceStatus {
  if (error) return 'FAIL';
  const status = response?.status() ?? null;
  if (status === null) return 'WARNING';
  if (status >= 500) return 'FAIL';
  if (status >= 400 || !title) return 'WARNING';
  return 'PASS';
}

function aggregateStatus(statuses: DynamicEvidenceStatus[]): DynamicEvidenceStatus {
  if (statuses.length === 0) return 'FAIL';
  if (statuses.some((status) => status === 'FAIL')) return statuses.some((status) => status === 'PASS') ? 'WARNING' : 'FAIL';
  if (statuses.some((status) => status === 'WARNING')) return 'WARNING';
  return 'PASS';
}

function consoleLevel(message: ConsoleMessage): EvidenceSignal['level'] | null {
  if (message.type() === 'error') return 'ERROR';
  if (message.type() === 'warning') return 'WARNING';
  return null;
}

function buildConsoleReport(target: DynamicEvidenceTarget, signals: EvidenceSignal[], notes: string[]): ConsoleEvidenceReport {
  return {
    generatedAt: new Date().toISOString(),
    target,
    signals,
    evidenceStatus: signals.some((signal) => signal.level === 'ERROR') ? 'WARNING' : 'PASS',
    notes,
  };
}

function buildNetworkReport(target: DynamicEvidenceTarget, signals: NetworkEvidenceSignal[], notes: string[]): NetworkEvidenceReport {
  return {
    generatedAt: new Date().toISOString(),
    target,
    signals,
    evidenceStatus: signals.some((signal) => signal.level === 'ERROR' || signal.level === 'WARNING') ? 'WARNING' : 'PASS',
    notes,
  };
}

function dedupeNetworkSignals(signals: NetworkEvidenceSignal[]): NetworkEvidenceSignal[] {
  const seen = new Set<string>();
  return signals.filter((signal) => {
    const key = `${signal.method}:${signal.statusCode}:${signal.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function lighthouseFailureReport(target: DynamicEvidenceTarget, reason: string): DynamicLighthouseEvidenceReport {
  return {
    generatedAt: new Date().toISOString(),
    target,
    requestedUrl: target.website,
    finalUrl: target.website,
    scores: {
      performance: null,
      accessibility: null,
      bestPractices: null,
      seo: null,
    },
    rawReportPath: null,
    htmlReportPath: null,
    evidenceStatus: 'FAIL',
    failureReason: reason,
    notes: [
      `Lighthouse did not complete: ${reason}`,
      'Failure is recorded as an observed tooling/navigation signal only.',
    ],
  };
}

function normalizePublicUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return trimmed;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function trimSignal(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, 300);
}

function dynamicSafetyNotes(): string[] {
  return [
    'Do not claim bugs, outages, vulnerabilities, revenue impact, or customer impact.',
    'Use observed signal, potential area to review, and public-page observation language.',
    'Only public pages and candidate public flows are reviewed.',
    'No private, authenticated, checkout, payment, admin, CRM, outreach, invoice, or client action is performed.',
    'Human approval is required before using evidence externally.',
  ];
}

function renderPageEvidence(report: PageEvidenceReport): string {
  return [
    '# Page Evidence',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    bullets([
      `Company: ${report.target.companyName}`,
      `URL: ${report.requestedUrl}`,
      `Final URL: ${report.finalUrl}`,
      `Status Code: ${report.statusCode ?? 'Not Available'}`,
      `Page Title: ${report.title || 'Not Available'}`,
      `Evidence Status: ${report.evidenceStatus}`,
    ]),
    '',
    '## Notes',
    bullets(report.notes),
    '',
    '## Safety Rules',
    bullets(dynamicSafetyNotes()),
    '',
  ].join('\n');
}

function renderFlowEvidence(report: FlowEvidenceReport): string {
  return [
    '# Flow Evidence',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    bullets([
      `Company: ${report.target.companyName}`,
      `Evidence Status: ${report.evidenceStatus}`,
      `Candidate Public Flows Reviewed: ${report.flows.length}`,
    ]),
    '',
    '| Candidate Public Flow | URL | Status Code | Status | Title |',
    '| --- | --- | ---: | --- | --- |',
    ...report.flows.map((flow) => `| ${escapeTable(flow.flowName)} | ${escapeTable(flow.url)} | ${flow.statusCode ?? 'N/A'} | ${flow.status} | ${escapeTable(flow.title || 'Not Available')} |`),
    '',
    '## Notes',
    bullets(report.notes),
    '',
    '## Safety Rules',
    bullets(dynamicSafetyNotes()),
    '',
  ].join('\n');
}

function renderConsoleEvidence(report: ConsoleEvidenceReport): string {
  return [
    '# Console Evidence',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    bullets([
      `Company: ${report.target.companyName}`,
      `Evidence Status: ${report.evidenceStatus}`,
      `Observed Console Signals: ${report.signals.length}`,
    ]),
    '',
    '| Level | Source | URL | Message |',
    '| --- | --- | --- | --- |',
    ...report.signals.map((signal) => `| ${signal.level} | ${escapeTable(signal.source)} | ${escapeTable(signal.url)} | ${escapeTable(signal.message)} |`),
    ...(report.signals.length === 0 ? ['| INFO | observed console signal | Not Available | No console warning/error signals observed during the public-page check. |'] : []),
    '',
    '## Notes',
    bullets(report.notes),
    '',
    '## Safety Rules',
    bullets(dynamicSafetyNotes()),
    '',
  ].join('\n');
}

function renderNetworkEvidence(report: NetworkEvidenceReport): string {
  return [
    '# Network Evidence',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    bullets([
      `Company: ${report.target.companyName}`,
      `Evidence Status: ${report.evidenceStatus}`,
      `Observed Network Signals: ${report.signals.length}`,
    ]),
    '',
    '| Level | Method | Status Code | URL | Message |',
    '| --- | --- | ---: | --- | --- |',
    ...report.signals.map((signal) => `| ${signal.level} | ${signal.method} | ${signal.statusCode ?? 'N/A'} | ${escapeTable(signal.url)} | ${escapeTable(signal.message)} |`),
    ...(report.signals.length === 0 ? ['| INFO | GET | N/A | Not Available | No 4xx, 5xx, or failed request signals observed during the public-page check. |'] : []),
    '',
    '## Notes',
    bullets(report.notes),
    '',
    '## Safety Rules',
    bullets(dynamicSafetyNotes()),
    '',
  ].join('\n');
}

function renderScreenshotEvidence(report: ScreenshotEvidenceReport): string {
  return [
    '# Screenshot Evidence',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    bullets([
      `Company: ${report.target.companyName}`,
      `Evidence Status: ${report.evidenceStatus}`,
      `Screenshots Captured: ${report.screenshots.filter((screenshot) => screenshot.exists).length}/${report.screenshots.length}`,
    ]),
    '',
    '| Viewport | Size | Path | Exists | Status |',
    '| --- | --- | --- | --- | --- |',
    ...report.screenshots.map((screenshot) => `| ${screenshot.viewport} | ${screenshot.width}x${screenshot.height} | ${escapeTable(screenshot.path)} | ${screenshot.exists ? 'Yes' : 'No'} | ${screenshot.status} |`),
    '',
    '## Notes',
    bullets(report.notes),
    '',
    '## Safety Rules',
    bullets(dynamicSafetyNotes()),
    '',
  ].join('\n');
}

function renderDynamicLighthouseEvidence(report: DynamicLighthouseEvidenceReport): string {
  return [
    '# Lighthouse Evidence',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    bullets([
      `Company: ${report.target.companyName}`,
      `Requested URL: ${report.requestedUrl || 'Not Available'}`,
      `Final URL: ${report.finalUrl || 'Not Available'}`,
      `Evidence Status: ${report.evidenceStatus}`,
      `Performance: ${dynamicScoreLabel(report.scores.performance)}`,
      `Accessibility: ${dynamicScoreLabel(report.scores.accessibility)}`,
      `Best Practices: ${dynamicScoreLabel(report.scores.bestPractices)}`,
      `SEO: ${dynamicScoreLabel(report.scores.seo)}`,
      `Raw Report: ${report.rawReportPath ?? 'Not Available'}`,
      `HTML Report: ${report.htmlReportPath ?? 'Not Available'}`,
      `Failure Reason: ${report.failureReason ?? 'None'}`,
    ]),
    '',
    '## Notes',
    bullets(report.notes),
    '',
    '## Safety Rules',
    bullets(dynamicSafetyNotes()),
    '',
  ].join('\n');
}

function renderDynamicEvidenceSummary(summary: DynamicEvidenceSummary): string {
  return [
    '# Evidence Summary',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    bullets([
      `Company: ${summary.target.companyName}`,
      `Website: ${summary.target.website || 'Not Available'}`,
      `Page Checks: ${summary.page?.evidenceStatus ?? 'MISSING'}`,
      `Flow Checks: ${summary.flows?.evidenceStatus ?? 'MISSING'}`,
      `Screenshots: ${summary.screenshots?.evidenceStatus ?? 'MISSING'}`,
      `Lighthouse: ${summary.lighthouse?.evidenceStatus ?? 'MISSING'}`,
      `Console Signals: ${summary.console?.signals.length ?? 0}`,
      `Network Signals: ${summary.network?.signals.length ?? 0}`,
    ]),
    '',
    '## Evidence Files',
    bullets([
      'output/evidence/page-evidence.md',
      'output/evidence/flow-evidence.md',
      'output/evidence/console-evidence.md',
      'output/evidence/network-evidence.md',
      'output/evidence/screenshot-evidence.md',
      'output/evidence/lighthouse-evidence.md',
    ]),
    '',
    '## Safety Rules',
    bullets(dynamicSafetyNotes()),
    '',
  ].join('\n');
}

function renderEvidenceReadinessDecision(decision: DynamicEvidenceReadinessDecision): string {
  return [
    '# Evidence Readiness',
    '',
    `Generated: ${decision.generatedAt}`,
    '',
    bullets([
      `Company: ${decision.target.companyName}`,
      `Readiness Status: ${decision.status}`,
      `Commercial Readiness: ${decision.commercialReadiness}`,
      `GO / NO GO: ${decision.goNoGo}`,
      `Evidence Status: ${decision.evidenceStatus}`,
      `Page Status: ${decision.pageStatus}`,
      `Flow Status: ${decision.flowStatus}`,
      `Screenshot Status: ${decision.screenshotStatus}`,
      `Lighthouse Status: ${decision.lighthouseStatus}`,
    ]),
    '',
    '## Blockers',
    bullets(decision.blockers.length > 0 ? decision.blockers : ['No evidence readiness blockers detected. Human approval is still required before external action.']),
    '',
    '## Safety Rules',
    bullets(decision.safetyNotes),
    '',
  ].join('\n');
}

function dynamicScoreLabel(score: number | null): string {
  if (score === null) return 'Not Available';
  return `${Math.round(score * 100)}/100`;
}

function escapeTable(value: string): string {
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
