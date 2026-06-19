import { chromium, devices, type Browser, type Page } from '@playwright/test';
import type { DemoCheck, LighthouseResult, SiteAudit } from './demoTypes';

const NAVIGATION_TIMEOUT_MS = 12_000;

export function lighthouseAvailability(): LighthouseResult {
  try {
    require.resolve('lighthouse');
    return {
      status: 'available',
      explanation: 'Lighthouse is installed. Scores are collected only when a current-site audit runs.',
      performance: null,
      accessibility: null,
      bestPractices: null,
      seo: null,
    };
  } catch {
    return {
      status: 'unavailable',
      explanation: 'Lighthouse was not installed, so it was not added in order to keep this sprint dependency-free.',
      performance: null,
      accessibility: null,
      bestPractices: null,
      seo: null,
    };
  }
}

export function skippedSiteAudit(leadId: string, url: string | null, reason: string): SiteAudit {
  const now = new Date().toISOString();
  const status = url ? 'UNKNOWN' : 'NOT_APPLICABLE';
  return {
    leadId,
    auditedUrl: url,
    startedAt: now,
    completedAt: now,
    reachable: url ? null : false,
    finalUrl: null,
    checks: {
      urlLoads: check(status, reason),
      protocol: check(status, reason),
      pageTitle: check(status, reason),
      metaDescription: check(status, reason),
      viewportMeta: check(status, reason),
      visibleNavigation: check(status, reason),
      visibleContactLink: check(status, reason),
      visibleConversionCta: check(status, reason),
      desktopHorizontalOverflow: check(status, reason),
      mobileHorizontalOverflow: check(status, reason),
      obviousEmptyPage: check(status, reason),
      obviousBrokenImages: check(status, reason),
      headingStructure: check(status, reason),
      basicFormPresence: check(status, reason),
    },
    consoleErrors: [],
    failedRequests: [],
    desktopObservations: [reason],
    mobileObservations: [reason],
    evidenceLimitations: [reason],
    lighthouse: {
      ...lighthouseAvailability(),
      status: 'skipped',
      explanation: `${reason} Lighthouse was not run.`,
    },
    manualReviewRequired: true,
  };
}

export async function auditCurrentWebsite(leadId: string, url: string): Promise<SiteAudit> {
  const startedAt = new Date().toISOString();
  const consoleErrors = new Set<string>();
  const failedRequests = new Set<string>();
  let browser: Browser | undefined;

  try {
    browser = await chromium.launch({ headless: true });
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const desktop = await desktopContext.newPage();
    observePage(desktop, consoleErrors, failedRequests);
    const response = await desktop.goto(url, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS });
    await desktop.waitForLoadState('load', { timeout: 3_000 }).catch(() => undefined);
    const desktopSignals = await collectSignals(desktop);

    const mobileContext = await browser.newContext({ ...devices['iPhone 13'] });
    const mobile = await mobileContext.newPage();
    observePage(mobile, consoleErrors, failedRequests);
    await mobile.goto(desktop.url() || url, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS });
    await mobile.waitForLoadState('load', { timeout: 3_000 }).catch(() => undefined);
    const mobileSignals = await collectSignals(mobile);

    const reachable = Boolean(response?.ok());
    const finalUrl = desktop.url() || null;
    const checks: Record<string, DemoCheck> = {
      urlLoads: check(reachable ? 'PASS' : 'FAIL', response ? `HTTP ${response.status()}` : 'No document response was received.'),
      protocol: check(finalUrl ? 'PASS' : 'UNKNOWN', finalUrl ? `Final protocol: ${new URL(finalUrl).protocol}` : 'Final URL was not available.'),
      pageTitle: booleanCheck(desktopSignals.titlePresent, 'A page title is present.', 'A page title was not found.'),
      metaDescription: booleanCheck(desktopSignals.metaDescriptionPresent, 'A meta description is present.', 'A meta description was not found.'),
      viewportMeta: booleanCheck(desktopSignals.viewportPresent, 'A viewport meta tag is present.', 'A viewport meta tag was not found.'),
      visibleNavigation: booleanCheck(desktopSignals.navigationVisible, 'Visible navigation was found.', 'Visible navigation was not found.'),
      visibleContactLink: booleanCheck(desktopSignals.contactVisible, 'A visible contact link was found.', 'A visible contact link was not found.'),
      visibleConversionCta: booleanCheck(desktopSignals.conversionVisible, 'A visible conversion CTA was found.', 'A visible booking, reservation, or contact CTA was not found.'),
      desktopHorizontalOverflow: booleanCheck(!desktopSignals.horizontalOverflow, 'No desktop horizontal overflow was detected.', 'Desktop horizontal overflow was detected.'),
      mobileHorizontalOverflow: booleanCheck(!mobileSignals.horizontalOverflow, 'No mobile horizontal overflow was detected.', 'Mobile horizontal overflow was detected.'),
      obviousEmptyPage: booleanCheck(!desktopSignals.obviousEmpty, 'The page contains visible content.', 'The page appears empty.'),
      obviousBrokenImages: booleanCheck(!desktopSignals.brokenImages, 'No obviously broken images were found.', 'One or more obviously broken images were found.'),
      headingStructure: check(desktopSignals.h1Count === 1 ? 'PASS' : 'FAIL', `Visible H1 count: ${desktopSignals.h1Count}.`),
      basicFormPresence: check(desktopSignals.formPresent ? 'PASS' : 'NOT_APPLICABLE', desktopSignals.formPresent ? 'A form is present.' : 'No form was found; this is recorded without treating it as a defect.'),
    };

    await desktopContext.close();
    await mobileContext.close();

    return {
      leadId,
      auditedUrl: url,
      startedAt,
      completedAt: new Date().toISOString(),
      reachable,
      finalUrl,
      checks,
      consoleErrors: [...consoleErrors],
      failedRequests: [...failedRequests],
      desktopObservations: summarizeSignals(desktopSignals),
      mobileObservations: summarizeSignals(mobileSignals),
      evidenceLimitations: [
        'This was a conservative read-only inspection; no forms, logins, bookings, payments, or destructive controls were used.',
        'No claim of full accessibility, SEO, performance, or visual-quality compliance is made.',
        'Current-site screenshots were inspected during the browser session but not persisted because the demo pack output is intentionally limited.',
      ],
      lighthouse: await collectLighthouse(finalUrl),
      manualReviewRequired: true,
    };
  } catch (error) {
    return {
      ...skippedSiteAudit(leadId, url, 'The current website was inaccessible or the browser audit could not complete.'),
      startedAt,
      completedAt: new Date().toISOString(),
      reachable: false,
      checks: {
        ...skippedSiteAudit(leadId, url, 'The current website was inaccessible or the browser audit could not complete.').checks,
        urlLoads: check('UNKNOWN', errorMessage(error)),
      },
      evidenceLimitations: [errorMessage(error)],
    };
  } finally {
    await browser?.close().catch(() => undefined);
  }
}

async function collectSignals(page: Page) {
  return page.evaluate(() => {
    const visible = (element: Element): boolean => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
    };
    const links = Array.from(document.querySelectorAll('a, button')).filter(visible);
    const conversion = /\b(book|booking|reserve|reservation|contact|inquiry|enquire|schedule|appointment)\b/i;
    return {
      titlePresent: document.title.trim().length > 0,
      metaDescriptionPresent: Boolean(document.querySelector('meta[name="description"][content]')),
      viewportPresent: Boolean(document.querySelector('meta[name="viewport"]')),
      navigationVisible: Array.from(document.querySelectorAll('nav')).some(visible),
      contactVisible: links.some((element) => /\bcontact\b/i.test(element.textContent ?? '')),
      conversionVisible: links.some((element) => conversion.test(`${element.textContent ?? ''} ${element.getAttribute('href') ?? ''}`)),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      obviousEmpty: (document.body.innerText ?? '').trim().length < 40,
      brokenImages: Array.from(document.images).some((image) => image.complete && image.naturalWidth === 0),
      h1Count: Array.from(document.querySelectorAll('h1')).filter(visible).length,
      formPresent: Boolean(document.querySelector('form')),
    };
  });
}

async function collectLighthouse(url: string | null): Promise<LighthouseResult> {
  const availability = lighthouseAvailability();
  if (!url || availability.status === 'unavailable') return availability;

  let lighthouseBrowser: Browser | undefined;
  try {
    const port = 9_222 + Math.floor(Math.random() * 500);
    lighthouseBrowser = await chromium.launch({
      headless: true,
      args: [`--remote-debugging-port=${port}`],
    });
    const { default: lighthouse } = await import('lighthouse');
    const result = await lighthouse(url, {
      port,
      output: 'json',
      logLevel: 'silent',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    });
    const categories = result?.lhr.categories;
    const score = (key: string): number | null => {
      const value = categories?.[key]?.score;
      return typeof value === 'number' ? Math.round(value * 100) : null;
    };
    return {
      status: 'completed',
      explanation: 'Lighthouse used the already-installed local dependency.',
      performance: score('performance'),
      accessibility: score('accessibility'),
      bestPractices: score('best-practices'),
      seo: score('seo'),
    };
  } catch (error) {
    return {
      ...availability,
      status: 'failed',
      explanation: `Lighthouse was available but could not complete: ${errorMessage(error)}`,
    };
  } finally {
    await lighthouseBrowser?.close().catch(() => undefined);
  }
}

function observePage(page: Page, consoleErrors: Set<string>, failedRequests: Set<string>): void {
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.add(message.text());
  });
  page.on('requestfailed', (request) => {
    const type = request.resourceType();
    if (['document', 'script', 'stylesheet', 'image'].includes(type)) {
      failedRequests.add(`${type}: ${request.url()} — ${request.failure()?.errorText ?? 'request failed'}`);
    }
  });
  page.on('response', (response) => {
    const type = response.request().resourceType();
    if (response.status() >= 400 && ['document', 'script', 'stylesheet', 'image'].includes(type)) {
      failedRequests.add(`${type}: ${response.status()} ${response.url()}`);
    }
  });
}

function summarizeSignals(signals: Awaited<ReturnType<typeof collectSignals>>): string[] {
  return [
    `Visible H1 count: ${signals.h1Count}.`,
    `Horizontal overflow detected: ${signals.horizontalOverflow ? 'yes' : 'no'}.`,
    `Visible navigation detected: ${signals.navigationVisible ? 'yes' : 'no'}.`,
    `Visible conversion CTA detected: ${signals.conversionVisible ? 'yes' : 'no'}.`,
  ];
}

function booleanCheck(value: boolean, pass: string, fail: string): DemoCheck {
  return check(value ? 'PASS' : 'FAIL', value ? pass : fail);
}

function check(status: DemoCheck['status'], detail: string): DemoCheck {
  return { status, detail };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown audit failure.';
}
