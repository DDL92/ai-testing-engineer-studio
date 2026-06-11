import fs = require('fs');
import path = require('path');
import { chromium, request } from '@playwright/test';
import { auditOutputDir } from '../config/paths';
import { AuditResult, DetectedButton, DetectedForm, DetectedNavigationLink, InternalLinkStatus } from '../types/audit';
import { isInternalLink } from '../utils/url';

export async function runAudit(targetUrl: string, options: { outputDir?: string } = {}): Promise<AuditResult> {
  const outputDir = options.outputDir ?? auditOutputDir;
  const screenshotDir = path.join(outputDir, 'screenshots');
  const screenshotPath = path.join(screenshotDir, 'homepage.png');
  fs.mkdirSync(screenshotDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const consoleErrors: string[] = [];
  const failedNetworkRequests: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  page.on('requestfailed', (requestEvent) => {
    failedNetworkRequests.push(`${requestEvent.method()} ${requestEvent.url()} - ${requestEvent.failure()?.errorText ?? 'failed'}`);
  });

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => undefined);

  await page.screenshot({ path: screenshotPath, fullPage: true });

  const pageTitle = await page.title();
  const finalUrl = page.url();
  const bodyText = (await page.locator('body').innerText().catch(() => '')).trim();
  const forms = await detectForms(page);
  const buttons = await detectButtons(page);
  const navigationLinks = await detectNavigationLinks(page, finalUrl);
  const metadata = await page.evaluate(() => ({
    description: document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ?? '',
    language: document.documentElement.lang || 'not declared',
  }));

  const internalLinkStatuses = await sampleInternalLinkStatuses(finalUrl, navigationLinks);
  await browser.close();

  const result: AuditResult = {
    targetUrl,
    finalUrl,
    pageTitle,
    timestamp: new Date().toISOString(),
    screenshot: path.relative(process.cwd(), screenshotPath),
    visibleBodyContent: {
      hasVisibleBody: bodyText.length > 0,
      textSample: bodyText.slice(0, 600),
      characterCount: bodyText.length,
    },
    forms,
    buttons,
    navigationLinks,
    consoleErrors,
    failedNetworkRequests,
    metadata: {
      ...metadata,
      viewport: '1440x1000',
    },
    internalLinkStatuses,
    findings: [],
  };

  result.findings = buildFindings(result);
  fs.mkdirSync(outputDir, { recursive: true });
  return result;
}

async function detectForms(page: import('@playwright/test').Page): Promise<DetectedForm[]> {
  return page.locator('form').evaluateAll((forms) => forms.slice(0, 20).map((form) => ({
    name: form.getAttribute('name') || form.getAttribute('aria-label') || 'Unnamed form',
    method: form.getAttribute('method') || 'GET',
    action: form.getAttribute('action') || 'current page',
    inputCount: form.querySelectorAll('input, textarea, select').length,
    submitButtonCount: form.querySelectorAll('button[type="submit"], input[type="submit"]').length,
  })));
}

async function detectButtons(page: import('@playwright/test').Page): Promise<DetectedButton[]> {
  return page.locator('button, input[type="button"], input[type="submit"]').evaluateAll((buttons) => buttons.slice(0, 40).map((button) => ({
    text: ((button.textContent || button.getAttribute('value') || button.getAttribute('aria-label') || 'Unlabeled button').trim()).slice(0, 120),
    type: button.getAttribute('type') || 'button',
  })));
}

async function detectNavigationLinks(page: import('@playwright/test').Page, finalUrl: string): Promise<DetectedNavigationLink[]> {
  const links = await page.locator('a[href]').evaluateAll((anchors) => anchors.slice(0, 80).map((anchor) => ({
    text: ((anchor.textContent || anchor.getAttribute('aria-label') || 'Unlabeled link').trim()).slice(0, 120),
    href: (anchor as HTMLAnchorElement).href,
  })));

  return links.map((link) => ({
    ...link,
    isInternal: isInternalLink(finalUrl, link.href),
  }));
}

async function sampleInternalLinkStatuses(finalUrl: string, links: DetectedNavigationLink[]): Promise<InternalLinkStatus[]> {
  const api = await request.newContext();
  const uniqueInternalLinks = Array.from(new Set(links.filter((link) => link.isInternal).map((link) => link.href))).slice(0, 10);

  const statuses: InternalLinkStatus[] = [];
  for (const url of uniqueInternalLinks) {
    try {
      const response = await api.get(url, { timeout: 10000, maxRedirects: 3 });
      statuses.push({ url, status: response.status(), ok: response.ok() });
    } catch (error) {
      statuses.push({ url, status: null, ok: false, error: error instanceof Error ? error.message : 'Unknown request error' });
    }
  }

  await api.dispose();
  return statuses;
}

function buildFindings(result: AuditResult): AuditResult['findings'] {
  const findings: AuditResult['findings'] = [];

  if (!result.visibleBodyContent.hasVisibleBody) {
    findings.push({ severity: 'high', title: 'No visible body content detected', details: 'The page may be blank, blocked, or dependent on scripts that did not render during the audit.' });
  }

  if (result.consoleErrors.length > 0) {
    findings.push({ severity: 'medium', title: 'Console errors detected', details: `${result.consoleErrors.length} browser console error(s) were captured.` });
  }

  if (result.failedNetworkRequests.length > 0) {
    findings.push({ severity: 'medium', title: 'Failed network requests detected', details: `${result.failedNetworkRequests.length} failed request(s) were captured during page load.` });
  }

  const brokenLinks = result.internalLinkStatuses.filter((link) => !link.ok);
  if (brokenLinks.length > 0) {
    findings.push({ severity: 'medium', title: 'Internal link issues detected', details: `${brokenLinks.length} sampled internal link(s) returned an error or non-2xx status.` });
  }

  if (result.forms.length > 0) {
    findings.push({ severity: 'info', title: 'Forms are present', details: 'Forms are good candidates for Playwright regression and validation coverage.' });
  }

  if (findings.length === 0) {
    findings.push({ severity: 'low', title: 'No blocking issues in quick audit', details: 'The homepage loaded with visible content and no captured console/network failures in this limited pass.' });
  }

  return findings;
}
