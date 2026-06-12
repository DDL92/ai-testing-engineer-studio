import fs = require('fs');
import path = require('path');
import { chromium, ConsoleMessage, Page } from '@playwright/test';
import {
  AllowedPageType,
  EvidenceConfidence,
  EvidenceOpportunity,
  LeadRecordForPlaywright,
  PageObservation,
  PlaywrightEvidenceReport,
  PlaywrightEvidenceSummary,
  PlaywrightEvidenceTarget,
} from './types';

const targetsPath = path.join(process.cwd(), 'data', 'playwright-evidence', 'playwright-targets.json');
const leadsPath = path.join(process.cwd(), 'data', 'leads.json');
const outputDir = path.join(process.cwd(), 'output', 'playwright-runner');
const reportsDir = path.join(process.cwd(), 'data', 'evidence', 'playwright', 'reports');
const observationsDir = path.join(process.cwd(), 'data', 'evidence', 'playwright', 'observations');
const screenshotsDir = path.join(process.cwd(), 'data', 'evidence', 'playwright', 'screenshots');

const maxPagesAllowed = 5;
const maxNavigationDepth = 1;

const forbiddenUrlPatterns = [
  /\/login\b/i,
  /\/log-in\b/i,
  /\/signin\b/i,
  /\/sign-in\b/i,
  /\/auth\b/i,
  /\/account\b/i,
  /\/dashboard\b/i,
  /\/admin\b/i,
  /\/portal\b/i,
  /\/checkout\b/i,
  /\/cart\b/i,
  /\/payment\b/i,
  /\/billing\b/i,
  /\/register\b/i,
  /\/create-account\b/i,
];

export async function runPlaywrightEvidence(company: string): Promise<PlaywrightEvidenceReport> {
  const target = findTarget(company);
  if (!target) {
    throw new Error(`Company not found in data/playwright-evidence/playwright-targets.json: ${company}`);
  }

  const lead = findLead(target);
  if (!lead?.website) {
    throw new Error(`No public website recorded for ${target.companyName}`);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    ignoreHTTPSErrors: true,
  });

  try {
    const page = await context.newPage();
    const plannedUrls = await planPublicUrls(page, lead.website);
    const observations: PageObservation[] = [];

    for (const plannedUrl of plannedUrls.slice(0, maxPagesAllowed)) {
      const observationPage = await context.newPage();
      observations.push(await observePage(observationPage, target.companyId, plannedUrl));
      await observationPage.close();
    }

    const report = buildReport(target, lead.website, observations);
    writePlaywrightEvidenceReport(report);
    return report;
  } finally {
    await context.close();
    await browser.close();
  }
}

export function buildPlaywrightEvidenceSummary(): PlaywrightEvidenceSummary {
  const reports = loadExistingReports();
  return {
    generatedAt: new Date().toISOString(),
    reports,
  };
}

export function writePlaywrightSummary(summary: PlaywrightEvidenceSummary): string[] {
  fs.mkdirSync(outputDir, { recursive: true });
  const outputs = [
    ['playwright-summary.md', renderPlaywrightSummary(summary)],
    ['playwright-findings.md', renderPlaywrightFindings(summary)],
    ['playwright-observations.md', renderPlaywrightObservations(summary)],
    ['playwright-readiness.md', renderPlaywrightReadiness(summary)],
  ] as const;

  return outputs.map(([fileName, content]) => {
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, content, 'utf8');
    return outputPath;
  });
}

export function renderPlaywrightEvidenceReport(report: PlaywrightEvidenceReport): string {
  return `# Playwright Evidence: ${report.companyName}

## Summary

${bullets([
    `Company: ${report.companyName}`,
    `Website: ${report.website}`,
    `Pages Reviewed: ${report.pagesReviewed}`,
    `Screenshots Captured: ${report.screenshotsCaptured}`,
    `Console Observations: ${report.consoleObservationCount}`,
    `Evidence Confidence: ${report.evidenceConfidence}`,
    `Max Pages Allowed: ${report.maxPagesAllowed}`,
    `Max Navigation Depth: ${report.maxNavigationDepth}`,
  ])}

## Pages Reviewed

${report.observations.map(renderPageObservation).join('\n\n')}

## Safety Notes

${bullets(report.safetyNotes)}
`;
}

export function renderPlaywrightSummary(summary: PlaywrightEvidenceSummary): string {
  return `# Playwright Summary

Generated: ${summary.generatedAt}

${summary.reports.length === 0 ? 'No local Playwright evidence records are available yet. Run the approved `evidence:playwright-run` commands after browser execution is available.\n' : ''}

| Company | Pages Reviewed | Screenshots Captured | Console Observations | QA Opportunities | Automation Opportunities | Evidence Confidence |
| --- | --- | --- | --- | --- | --- | --- |
${summary.reports.map((report) => `| ${report.companyName} | ${report.pagesReviewed} | ${report.screenshotsCaptured} | ${report.consoleObservationCount} | ${countOpportunities(report, 'qa')} | ${countOpportunities(report, 'automation')} | ${report.evidenceConfidence} |`).join('\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderPlaywrightFindings(summary: PlaywrightEvidenceSummary): string {
  const opportunities = summary.reports.flatMap((report) => report.observations.flatMap((observation) => [
    ...observation.qaOpportunities.map((opportunity) => ({ report, opportunity })),
    ...observation.automationOpportunities.map((opportunity) => ({ report, opportunity })),
  ]));

  return `# Playwright Findings

Findings are framed as potential opportunities only. No confirmed bugs, vulnerabilities, incidents, or outages are claimed.

${opportunities.length > 0 ? opportunities.map(({ report, opportunity }) => `## ${report.companyName}

${bullets([
    `Type: ${opportunity.type}`,
    `Description: ${opportunity.description}`,
    `Evidence: ${opportunity.evidence}`,
    `Confidence: ${opportunity.confidence}`,
  ])}`).join('\n\n') : '- No opportunities recorded.'}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderPlaywrightObservations(summary: PlaywrightEvidenceSummary): string {
  return `# Playwright Observations

${summary.reports.length > 0 ? summary.reports.map((report) => `## ${report.companyName}

${report.observations.map((observation) => bullets([
    `Page Type: ${observation.pageType}`,
    `URL: ${observation.finalUrl}`,
    `HTTP Status: ${observation.httpStatus ?? 'Not Available'}`,
    `Title: ${observation.title || 'Not Available'}`,
    `Visible CTA Count: ${observation.visibleCtaCount}`,
    `Navigation Links: ${observation.navigationLinks.length}`,
    `Console Errors Observed: ${observation.consoleErrors.length}`,
    `Console Warnings Observed: ${observation.consoleWarnings.length}`,
    `Screenshot Capture: ${observation.screenshotCapture}`,
  ])).join('\n\n')}`).join('\n\n') : '- No local Playwright observations are available yet.'}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderPlaywrightReadiness(summary: PlaywrightEvidenceSummary): string {
  return `# Playwright Runner Readiness

${summary.reports.length === 0 ? 'No local Playwright evidence records are available yet. Browser execution must complete before company readiness can be summarized.\n' : ''}

| Company | Evidence Exists | Public Pages Reviewed | Screenshot Status | Readiness |
| --- | --- | --- | --- | --- |
${summary.reports.map((report) => `| ${report.companyName} | Yes | ${report.pagesReviewed} | ${report.screenshotsCaptured > 0 ? 'Captured' : 'Not Available'} | ${report.pagesReviewed > 0 ? 'Ready for manual review' : 'Needs rerun'} |`).join('\n')}

## Integration Notes

${bullets([
    'Outputs can be consumed by future Evidence Engine updates.',
    'Outputs can support future Opportunity Engine confidence checks.',
    'Outputs can support future QA Audit Pack evidence sections.',
  ])}

## Safety Notes

${bullets(safetyNotes())}
`;
}

function writePlaywrightEvidenceReport(report: PlaywrightEvidenceReport): void {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.mkdirSync(observationsDir, { recursive: true });
  fs.mkdirSync(screenshotsDir, { recursive: true });

  fs.writeFileSync(path.join(outputDir, `${report.companyId}-playwright-evidence.md`), renderPlaywrightEvidenceReport(report), 'utf8');
  fs.writeFileSync(path.join(reportsDir, `${report.companyId}-playwright-evidence.json`), JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(path.join(observationsDir, `${report.companyId}-observations.json`), JSON.stringify(report.observations, null, 2), 'utf8');
}

async function planPublicUrls(page: Page, homepageUrl: string): Promise<string[]> {
  const urls = [normalizeUrl(homepageUrl)];
  const homepage = urls[0];

  try {
    await page.goto(homepage, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    const discovered = await page.locator('a[href]').evaluateAll((links) => {
      return links.map((link) => ({
        href: (link as HTMLAnchorElement).href,
        text: (link.textContent ?? '').trim(),
      }));
    });
    const sameOrigin = new URL(homepage).origin;
    const ranked = discovered
      .filter((link) => link.href.startsWith(sameOrigin))
      .filter((link) => isAllowedUrl(link.href))
      .sort((left, right) => linkPriority(left.href, left.text) - linkPriority(right.href, right.text))
      .map((link) => stripHash(link.href));

    for (const url of ranked) {
      if (!urls.includes(url)) urls.push(url);
      if (urls.length >= maxPagesAllowed) break;
    }
  } catch {
    return urls;
  }

  return urls.slice(0, maxPagesAllowed);
}

async function observePage(page: Page, companyId: string, requestedUrl: string): Promise<PageObservation> {
  const consoleWarnings: string[] = [];
  const consoleErrors: string[] = [];

  page.on('console', (message: ConsoleMessage) => {
    if (message.type() === 'warning') consoleWarnings.push(truncate(message.text()));
    if (message.type() === 'error') consoleErrors.push(truncate(message.text()));
  });

  let httpStatus: number | null = null;
  let finalUrl = requestedUrl;
  let title = '';

  try {
    const response = await page.goto(requestedUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    httpStatus = response?.status() ?? null;
    finalUrl = page.url();
    title = await page.title();
  } catch {
    return failedObservation(requestedUrl, consoleWarnings, consoleErrors);
  }

  const visibleCtaCount = await countVisibleCtas(page);
  const navigationLinks = await collectNavigationLinks(page, finalUrl);
  const screenshotCapture = await captureScreenshot(page, companyId, pageTypeForUrl(finalUrl));

  const observations = [
    `Public ${pageTypeForUrl(finalUrl)} reviewed without form submission or account access.`,
    `HTTP response status observed: ${httpStatus ?? 'Not Available'}.`,
    `Visible CTA count observed: ${visibleCtaCount}.`,
    `Navigation links observed: ${navigationLinks.length}.`,
    consoleErrors.length > 0 ? 'Console errors observed.' : 'No console errors observed during passive page load.',
    consoleWarnings.length > 0 ? 'Console warnings observed.' : 'No console warnings observed during passive page load.',
  ];

  return {
    pageType: pageTypeForUrl(finalUrl),
    requestedUrl,
    finalUrl,
    title,
    httpStatus,
    visibleCtaCount,
    navigationLinks,
    consoleWarnings: consoleWarnings.slice(0, 10),
    consoleErrors: consoleErrors.slice(0, 10),
    screenshotCapture,
    observations,
    qaOpportunities: buildQaOpportunities(finalUrl, httpStatus, visibleCtaCount, consoleErrors),
    automationOpportunities: buildAutomationOpportunities(finalUrl, navigationLinks, visibleCtaCount),
    confidence: httpStatus && httpStatus < 400 ? 'High' : 'Medium',
  };
}

function buildReport(target: PlaywrightEvidenceTarget, website: string, observations: PageObservation[]): PlaywrightEvidenceReport {
  const screenshotsCaptured = observations.filter((observation) => observation.screenshotCapture !== 'Not Available').length;
  const consoleObservationCount = observations.reduce((sum, observation) => sum + observation.consoleErrors.length + observation.consoleWarnings.length, 0);
  const hasErrors = observations.some((observation) => observation.consoleErrors.length > 0 || (observation.httpStatus !== null && observation.httpStatus >= 400));

  return {
    companyId: target.companyId,
    companyName: target.companyName,
    website,
    generatedAt: new Date().toISOString(),
    pagesReviewed: observations.length,
    maxPagesAllowed,
    maxNavigationDepth,
    screenshotsCaptured,
    consoleObservationCount,
    evidenceConfidence: observations.length === 0 ? 'Low' : hasErrors ? 'Medium' : 'High',
    observations,
    safetyNotes: safetyNotes(),
  };
}

function buildQaOpportunities(finalUrl: string, httpStatus: number | null, visibleCtaCount: number, consoleErrors: string[]): EvidenceOpportunity[] {
  const opportunities: EvidenceOpportunity[] = [];

  if (httpStatus === null || httpStatus >= 400) {
    opportunities.push({
      type: 'Potential QA Opportunity',
      description: 'Review public page availability and response handling.',
      evidence: `Observed HTTP status: ${httpStatus ?? 'Not Available'} for ${finalUrl}.`,
      confidence: 'Medium',
    });
  }

  if (visibleCtaCount === 0) {
    opportunities.push({
      type: 'Potential UX Opportunity',
      description: 'Review public page CTA clarity.',
      evidence: `No visible CTA buttons or CTA-style links were counted on ${finalUrl}.`,
      confidence: 'Low',
    });
  }

  if (consoleErrors.length > 0) {
    opportunities.push({
      type: 'Potential QA Opportunity',
      description: 'Review console errors observed during passive public page load.',
      evidence: `${consoleErrors.length} console error(s) observed on ${finalUrl}.`,
      confidence: 'Medium',
    });
  }

  return opportunities;
}

function buildAutomationOpportunities(finalUrl: string, navigationLinks: string[], visibleCtaCount: number): EvidenceOpportunity[] {
  return [
    {
      type: 'Potential Automation Opportunity',
      description: 'Create future smoke coverage for public page load and navigation visibility.',
      evidence: `${navigationLinks.length} navigation link(s) and ${visibleCtaCount} CTA candidate(s) observed on ${finalUrl}.`,
      confidence: 'Medium',
    },
  ];
}

function failedObservation(requestedUrl: string, consoleWarnings: string[], consoleErrors: string[]): PageObservation {
  return {
    pageType: pageTypeForUrl(requestedUrl),
    requestedUrl,
    finalUrl: requestedUrl,
    title: '',
    httpStatus: null,
    visibleCtaCount: 0,
    navigationLinks: [],
    consoleWarnings,
    consoleErrors,
    screenshotCapture: 'Not Available',
    observations: ['Public page observation could not complete. Manual review required before using externally.'],
    qaOpportunities: [{
      type: 'Potential QA Opportunity',
      description: 'Review public page availability manually.',
      evidence: `Playwright could not complete passive navigation to ${requestedUrl}.`,
      confidence: 'Low',
    }],
    automationOpportunities: [],
    confidence: 'Low',
  };
}

async function countVisibleCtas(page: Page): Promise<number> {
  const selectors = [
    'a:visible',
    'button:visible',
    '[role="button"]:visible',
  ];
  const texts = await page.locator(selectors.join(',')).evaluateAll((elements) => {
    const ctaPattern = /demo|contact|pricing|book|schedule|start|get started|try|learn more|request|sign up/i;
    return elements
      .map((element) => (element.textContent ?? '').trim())
      .filter((text) => ctaPattern.test(text));
  });
  return texts.length;
}

async function collectNavigationLinks(page: Page, finalUrl: string): Promise<string[]> {
  const origin = new URL(finalUrl).origin;
  const links = await page.locator('nav a[href], header a[href], footer a[href]').evaluateAll((elements) => {
    return elements.map((element) => (element as HTMLAnchorElement).href);
  });

  return Array.from(new Set(links
    .filter((href) => href.startsWith(origin))
    .filter(isAllowedUrl)
    .map(stripHash)))
    .slice(0, 25);
}

async function captureScreenshot(page: Page, companyId: string, pageType: AllowedPageType): Promise<string> {
  try {
    fs.mkdirSync(screenshotsDir, { recursive: true });
    const screenshotPath = path.join(screenshotsDir, `${companyId}-${slugify(pageType)}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true, timeout: 10_000 });
    return path.relative(process.cwd(), screenshotPath);
  } catch {
    return 'Not Available';
  }
}

function loadExistingReports(): PlaywrightEvidenceReport[] {
  if (!fs.existsSync(reportsDir)) return [];
  return fs.readdirSync(reportsDir)
    .filter((fileName) => fileName.endsWith('-playwright-evidence.json'))
    .map((fileName) => readJson<PlaywrightEvidenceReport>(path.join(reportsDir, fileName)))
    .sort((left, right) => targetPriority(left.companyId) - targetPriority(right.companyId) || left.companyName.localeCompare(right.companyName));
}

function targetPriority(companyId: string): number {
  return readJson<PlaywrightEvidenceTarget[]>(targetsPath).find((target) => target.companyId === companyId)?.priority ?? 999;
}

function findTarget(company: string): PlaywrightEvidenceTarget | undefined {
  const normalized = normalize(company);
  return readJson<PlaywrightEvidenceTarget[]>(targetsPath).find((target) => normalize(target.companyId) === normalized || normalize(target.companyName).includes(normalized) || normalized.includes(normalize(target.companyName)));
}

function findLead(target: PlaywrightEvidenceTarget): LeadRecordForPlaywright | undefined {
  const targetTokens = companyTokens(target.companyName);
  return readJson<LeadRecordForPlaywright[]>(leadsPath).find((lead) => {
    const leadTokens = companyTokens(lead.companyName);
    return normalize(lead.id) === normalize(target.companyId)
      || normalize(lead.companyName) === normalize(target.companyName)
      || targetTokens.some((token) => leadTokens.includes(token));
  });
}

function renderPageObservation(observation: PageObservation): string {
  return `### ${observation.pageType}

${bullets([
    `Requested URL: ${observation.requestedUrl}`,
    `Final URL: ${observation.finalUrl}`,
    `Page Title: ${observation.title || 'Not Available'}`,
    `HTTP Response Status: ${observation.httpStatus ?? 'Not Available'}`,
    `Visible CTA Count: ${observation.visibleCtaCount}`,
    `Navigation Links: ${observation.navigationLinks.length}`,
    `Console Warnings Observed: ${observation.consoleWarnings.length}`,
    `Console Errors Observed: ${observation.consoleErrors.length}`,
    `Screenshot Capture: ${observation.screenshotCapture}`,
    `Evidence Confidence: ${observation.confidence}`,
  ])}

#### Basic Page Observations

${bullets(observation.observations)}

#### Navigation Links

${bullets(observation.navigationLinks)}

#### QA Opportunities

${renderOpportunities(observation.qaOpportunities)}

#### Automation Opportunities

${renderOpportunities(observation.automationOpportunities)}`;
}

function renderOpportunities(opportunities: EvidenceOpportunity[]): string {
  if (opportunities.length === 0) return '- No potential opportunities recorded.';
  return opportunities.map((opportunity) => bullets([
    `Type: ${opportunity.type}`,
    `Description: ${opportunity.description}`,
    `Evidence: ${opportunity.evidence}`,
    `Confidence: ${opportunity.confidence}`,
  ])).join('\n\n');
}

function countOpportunities(report: PlaywrightEvidenceReport, kind: 'qa' | 'automation'): number {
  return report.observations.reduce((sum, observation) => {
    return sum + (kind === 'qa' ? observation.qaOpportunities.length : observation.automationOpportunities.length);
  }, 0);
}

function isAllowedUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (!['http:', 'https:'].includes(url.protocol)) return false;
  return !forbiddenUrlPatterns.some((pattern) => pattern.test(`${url.pathname}${url.search}`));
}

function pageTypeForUrl(value: string): AllowedPageType {
  const pathname = new URL(value).pathname.toLowerCase();
  if (pathname === '/' || pathname === '') return 'Homepage';
  if (pathname.includes('pricing')) return 'Pricing';
  if (pathname.includes('demo')) return 'Public Demo Page';
  if (pathname.includes('contact')) return 'Public Contact Page';
  return 'Public Marketing Pages';
}

function linkPriority(href: string, text: string): number {
  const value = `${href} ${text}`.toLowerCase();
  if (value.includes('demo')) return 1;
  if (value.includes('contact')) return 2;
  if (value.includes('pricing')) return 3;
  if (value.includes('book') || value.includes('schedule')) return 4;
  if (value.includes('signup') || value.includes('sign-up')) return 5;
  return 20;
}

function safetyNotes(): string[] {
  return [
    'Public pages only.',
    'Maximum 5 pages per company.',
    'Maximum 1 navigation depth.',
    'No forms submitted.',
    'No login automation.',
    'No account creation.',
    'No payment flows, checkout flows, bookings, authenticated areas, private dashboards, or customer portals.',
    'No scraping, aggressive crawling, credentials, authenticated APIs, outreach, emails, or messages.',
    'Observations are potential opportunities only unless explicit reviewed evidence exists.',
  ];
}

function readJson<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  return JSON.parse(raw) as T;
}

function normalizeUrl(value: string): string {
  const url = new URL(value);
  return stripHash(url.toString());
}

function stripHash(value: string): string {
  const url = new URL(value);
  url.hash = '';
  return url.toString();
}

function truncate(value: string): string {
  return value.length > 500 ? `${value.slice(0, 500)}...` : value;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function companyTokens(value: string): string[] {
  return value.toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4)
    .filter((token) => !['fitness', 'company'].includes(token));
}

function bullets(items: string[]): string {
  if (items.length === 0) return '- None recorded.';
  return items.map((item) => `- ${item}`).join('\n');
}
