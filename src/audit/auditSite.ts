import fs = require('fs');
import path = require('path');
import { chromium, Page } from '@playwright/test';
import { buildAuditFindings, buildKeyObservations, buildRiskAssessment, buildSeveritySummary, suggestedOfferForFindings } from './auditRules';
import { renderAuditReport } from './generateAuditReport';
import { AuditEvidence, AuditResult } from './types';

const viewport = { width: 1440, height: 1000 };

async function main(): Promise<void> {
  const targetUrl = parseUrl(process.argv.slice(2));
  if (!targetUrl) {
    exitWithError('Missing required --url argument. Example: npm run audit:site -- --url https://example.com');
  }

  const parsedUrl = validateUrl(targetUrl);
  const safeDomain = toSafeDomain(parsedUrl.hostname);
  const outputDir = path.join(process.cwd(), 'output', 'audits', safeDomain);
  const screenshotPath = path.join(outputDir, 'homepage.png');
  const relativeScreenshotPath = path.relative(process.cwd(), screenshotPath);

  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport });
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  try {
    await page.goto(parsedUrl.toString(), { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => undefined);

    await page.screenshot({ path: screenshotPath, fullPage: true });

    const pageTitle = await page.title();
    const finalUrl = page.url();
    const visibleElements = await captureVisibleElements(page);
    const evidence: AuditEvidence = {
      homepageScreenshotPath: relativeScreenshotPath,
      pageTitle,
      finalUrl,
      consoleErrors,
      visibleElements,
      capturedAt: new Date().toISOString(),
      viewport: `${viewport.width}x${viewport.height}`,
    };
    const findings = buildAuditFindings(evidence);
    const severitySummary = buildSeveritySummary(findings);
    const riskAssessment = buildRiskAssessment(evidence, findings);
    const suggestedService = suggestedOfferForFindings(findings, riskAssessment);
    const result: AuditResult = {
      summary: {
        targetUrl: parsedUrl.toString(),
        finalUrl,
        domain: safeDomain,
        pageTitle,
        generatedAt: evidence.capturedAt,
        findingCount: findings.length,
        highSeverityCount: severitySummary.high,
        mediumSeverityCount: severitySummary.medium,
        lowSeverityCount: severitySummary.low,
        severitySummary,
        keyObservations: buildKeyObservations(evidence, findings),
        riskAssessment,
        suggestedService,
        suggestedOffer: suggestedService.servicePath,
      },
      evidence,
      findings,
    };

    const reportPath = path.join(outputDir, 'audit-report.md');
    fs.writeFileSync(reportPath, renderAuditReport(result), 'utf8');

    console.log(`Audit report generated: ${path.relative(process.cwd(), reportPath)}`);
    console.log(`Screenshot captured: ${relativeScreenshotPath}`);
    console.log(`Findings generated: ${findings.length}`);
    console.log('No login, form submission, payment testing, or outreach was performed.');
  } finally {
    await browser.close();
  }
}

function parseUrl(args: string[]): string | undefined {
  const urlFlagIndex = args.indexOf('--url');
  if (urlFlagIndex >= 0) return args[urlFlagIndex + 1];

  const urlValue = args.find((arg) => arg.startsWith('--url='));
  if (urlValue) return urlValue.slice('--url='.length);

  return undefined;
}

function validateUrl(rawUrl: string): URL {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    exitWithError(`Invalid URL: ${rawUrl}. Use an absolute http or https URL.`);
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    exitWithError(`Unsupported URL protocol: ${parsedUrl.protocol}. Use http or https only.`);
  }

  return parsedUrl;
}

async function captureVisibleElements(page: Page): Promise<AuditEvidence['visibleElements']> {
  const navCount = await visibleCount(page, 'nav, [role="navigation"]');
  const mainCount = await visibleCount(page, 'main, [role="main"]');
  const footerCount = await visibleCount(page, 'footer, [role="contentinfo"]');
  const buttonCount = await visibleCount(page, 'button, input[type="button"], input[type="submit"]');
  const formCount = await visibleCount(page, 'form');
  const linkCount = await visibleCount(page, 'a[href]');

  return {
    hasNav: navCount > 0,
    hasMain: mainCount > 0,
    hasFooter: footerCount > 0,
    buttonCount,
    formCount,
    linkCount,
  };
}

async function visibleCount(page: Page, selector: string): Promise<number> {
  const locator = page.locator(selector);
  const count = Math.min(await locator.count(), 100);
  let visible = 0;

  for (let index = 0; index < count; index += 1) {
    const isVisible = await locator.nth(index).isVisible().catch(() => false);
    if (isVisible) visible += 1;
  }

  return visible;
}

function toSafeDomain(hostname: string): string {
  return hostname
    .replace(/^www\./, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function exitWithError(message: string): never {
  console.error(message);
  process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
