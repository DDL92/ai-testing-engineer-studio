import fs = require('fs');
import http = require('http');
import path = require('path');
import { chromium, devices, type Browser, type Page } from '@playwright/test';
import type { DemoCheck, DemoValidation } from './demoTypes';

interface ValidationRun {
  validation: DemoValidation;
  failures: string[];
}

export async function validateAndCaptureDemo(
  leadId: string,
  outputDir: string,
  correctionPass: (failures: string[]) => void,
): Promise<DemoValidation> {
  let result = await runValidation(leadId, outputDir, false);
  const correctable = result.failures.filter((failure) => (
    ['navigation', 'footer', 'oneH1', 'desktopHorizontalOverflow', 'mobileHorizontalOverflow', 'missingLocalAssets'].includes(failure)
  ));

  if (correctable.length > 0) {
    correctionPass(correctable);
    result = await runValidation(leadId, outputDir, true);
  }

  return result.validation;
}

async function runValidation(leadId: string, outputDir: string, corrected: boolean): Promise<ValidationRun> {
  const indexPath = path.join(outputDir, 'index.html');
  const screenshotsDir = path.join(outputDir, 'screenshots');
  fs.mkdirSync(screenshotsDir, { recursive: true });
  const server = await startServer(outputDir);
  let browser: Browser | undefined;
  const checks: Record<string, DemoCheck> = {};
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];

  try {
    browser = await chromium.launch({ headless: true });
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const desktop = await desktopContext.newPage();
    observe(desktop, consoleErrors, failedRequests);
    const desktopResponse = await desktop.goto(server.url, { waitUntil: 'load', timeout: 15_000 });
    const desktopSignals = await signals(desktop);
    await desktop.screenshot({ path: path.join(screenshotsDir, 'desktop.png'), fullPage: true });

    const mobileContext = await browser.newContext({ ...devices['iPhone 13'] });
    const mobile = await mobileContext.newPage();
    observe(mobile, consoleErrors, failedRequests);
    const mobileResponse = await mobile.goto(server.url, { waitUntil: 'load', timeout: 15_000 });
    const mobileSignals = await signals(mobile);
    await mobile.screenshot({ path: path.join(screenshotsDir, 'mobile.png'), fullPage: true });

    const html = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';
    checks.indexHtmlExists = bool(fs.existsSync(indexPath), 'index.html exists.', 'index.html is missing.');
    checks.pageLoads = bool(Boolean(desktopResponse?.ok() && mobileResponse?.ok()), 'The demo loaded at desktop and mobile sizes.', 'The demo did not load successfully.');
    checks.title = bool(desktopSignals.titlePresent, 'The page title exists.', 'The page title is missing.');
    checks.oneH1 = bool(desktopSignals.h1Count === 1, `One H1 exists.`, `Expected one H1; found ${desktopSignals.h1Count}.`);
    checks.primaryCta = bool(desktopSignals.primaryCta, 'A primary CTA exists.', 'The primary CTA is missing.');
    checks.navigation = bool(desktopSignals.navigation, 'Semantic navigation exists.', 'Semantic navigation is missing.');
    checks.footer = bool(desktopSignals.footer, 'A semantic footer exists.', 'A semantic footer is missing.');
    checks.desktopHorizontalOverflow = bool(!desktopSignals.horizontalOverflow, 'No desktop horizontal overflow was detected.', 'Desktop horizontal overflow was detected.');
    checks.mobileHorizontalOverflow = bool(!mobileSignals.horizontalOverflow, 'No mobile horizontal overflow was detected.', 'Mobile horizontal overflow was detected.');
    checks.missingLocalAssets = bool(desktopSignals.missingLocalAssets.length === 0, 'No missing local assets were found.', `Missing local assets: ${desktopSignals.missingLocalAssets.join(', ')}`);
    checks.consoleErrors = bool(consoleErrors.length === 0, 'No demo console errors were recorded.', consoleErrors.join(' | '));
    checks.failedLocalRequests = bool(failedRequests.length === 0, 'No local resource requests failed.', failedRequests.join(' | '));
    checks.desktopScreenshot = bool(fs.existsSync(path.join(screenshotsDir, 'desktop.png')), 'Desktop screenshot exists.', 'Desktop screenshot is missing.');
    checks.mobileScreenshot = bool(fs.existsSync(path.join(screenshotsDir, 'mobile.png')), 'Mobile screenshot exists.', 'Mobile screenshot is missing.');
    checks.reducedMotion = bool(/prefers-reduced-motion/i.test(html), 'A prefers-reduced-motion rule exists.', 'The prefers-reduced-motion rule is missing.');
    checks.viewportMeta = bool(/<meta[^>]+name=["']viewport["']/i.test(html), 'A viewport meta tag exists.', 'The viewport meta tag is missing.');
    checks.manualReviewRequired = { status: 'PASS', detail: 'Manual review remains required.' };

    await desktopContext.close();
    await mobileContext.close();
  } catch (error) {
    checks.pageLoads = { status: 'FAIL', detail: errorMessage(error) };
  } finally {
    await browser?.close().catch(() => undefined);
    await server.close();
  }

  const failures = Object.entries(checks)
    .filter(([, value]) => value.status === 'FAIL')
    .map(([key]) => key);
  return {
    failures,
    validation: {
      leadId,
      validatedAt: new Date().toISOString(),
      correctionPasses: corrected ? 1 : 0,
      checks,
      overallStatus: failures.length > 0 ? 'FAIL' : 'PASS',
      manualReviewRequired: true,
    },
  };
}

async function startServer(rootDir: string): Promise<{ url: string; close: () => Promise<void> }> {
  const root = path.resolve(rootDir);
  const server = http.createServer((request, response) => {
    const requestPath = request.url === '/' ? '/index.html' : (request.url ?? '/index.html');
    let decoded: string;
    try {
      decoded = decodeURIComponent(requestPath.split('?')[0]);
    } catch {
      response.writeHead(400).end('Bad request');
      return;
    }
    const requestedFile = path.resolve(root, `.${decoded}`);
    if (requestedFile !== root && !requestedFile.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    if (!fs.existsSync(requestedFile) || !fs.statSync(requestedFile).isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }
    const extension = path.extname(requestedFile);
    const contentType = extension === '.html' ? 'text/html; charset=utf-8' : extension === '.png' ? 'image/png' : 'application/octet-stream';
    response.writeHead(200, { 'content-type': contentType });
    fs.createReadStream(requestedFile).pipe(response);
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Temporary demo server did not provide a port.');
  return {
    url: `http://127.0.0.1:${address.port}/`,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
}

async function signals(page: Page) {
  return page.evaluate(() => {
    const localUrls = Array.from(document.querySelectorAll('[src], link[href]'))
      .map((element) => element.getAttribute('src') ?? element.getAttribute('href'))
      .filter((value): value is string => Boolean(value))
      .filter((value) => !/^(https?:|data:|#|mailto:|tel:)/i.test(value));
    const missingLocalAssets = localUrls.filter((value) => {
      try {
        const url = new URL(value, window.location.href);
        const entry = performance.getEntriesByName(url.href)[0] as PerformanceResourceTiming | undefined;
        return entry ? entry.transferSize === 0 && entry.decodedBodySize === 0 : false;
      } catch {
        return true;
      }
    });
    return {
      titlePresent: document.title.trim().length > 0,
      h1Count: document.querySelectorAll('h1').length,
      primaryCta: Boolean(document.querySelector('[data-primary-cta]')),
      navigation: Boolean(document.querySelector('nav')),
      footer: Boolean(document.querySelector('footer')),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      missingLocalAssets,
    };
  });
}

function observe(page: Page, consoleErrors: string[], failedRequests: string[]): void {
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => {
    if (new URL(request.url()).hostname === '127.0.0.1') {
      failedRequests.push(`${request.url()} — ${request.failure()?.errorText ?? 'failed'}`);
    }
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && new URL(response.url()).hostname === '127.0.0.1') {
      failedRequests.push(`${response.status()} ${response.url()}`);
    }
  });
}

function bool(value: boolean, pass: string, fail: string): DemoCheck {
  return { status: value ? 'PASS' : 'FAIL', detail: value ? pass : fail };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown demo validation failure.';
}
