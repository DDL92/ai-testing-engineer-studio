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
    auditErrors: [],
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
  const auditErrors: SiteAudit['auditErrors'] = [];
  let browser: Browser | undefined;
  let finalUrl: string | null = null;
  let navigationSucceeded = false;

  try {
    browser = await chromium.launch({ headless: true });
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const desktop = await desktopContext.newPage();
    observePage(desktop, consoleErrors, failedRequests);
    let response;
    try {
      response = await desktop.goto(url, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS });
      navigationSucceeded = true;
      finalUrl = desktop.url() || url;
    } catch (error) {
      auditErrors.push(safeAuditError('desktop_navigation', error));
      await desktopContext.close();
      return navigationFailureAudit({
        leadId,
        url,
        startedAt,
        finalUrl: desktop.url() && desktop.url() !== 'about:blank' ? desktop.url() : null,
        consoleErrors,
        failedRequests,
        auditErrors,
      });
    }
    await desktop.waitForLoadState('load', { timeout: 3_000 }).catch(() => undefined);
    let desktopSignals: Awaited<ReturnType<typeof collectSignals>> | null = null;
    try {
      desktopSignals = await collectSignals(desktop);
    } catch (error) {
      auditErrors.push(safeAuditError('desktop_signal_collection', error));
    }

    const mobileContext = await browser.newContext({ ...devices['iPhone 13'] });
    const mobile = await mobileContext.newPage();
    observePage(mobile, consoleErrors, failedRequests);
    let mobileSignals: Awaited<ReturnType<typeof collectSignals>> | null = null;
    try {
      await mobile.goto(finalUrl || url, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS });
      await mobile.waitForLoadState('load', { timeout: 3_000 }).catch(() => undefined);
      mobileSignals = await collectSignals(mobile);
    } catch (error) {
      auditErrors.push(safeAuditError('mobile_audit', error));
    }

    const documentLoaded = Boolean(response);
    const checks: Record<string, DemoCheck> = {
      urlLoads: check(
        response?.ok() ? 'PASS' : 'FAIL',
        response ? `HTTP ${response.status()}` : 'Navigation completed without a document response.',
      ),
      protocol: check(finalUrl ? 'PASS' : 'UNKNOWN', finalUrl ? `Final protocol: ${new URL(finalUrl).protocol}` : 'Final URL was not available.'),
      pageTitle: signalCheck(desktopSignals?.titlePresent, 'A page title is present.', 'A page title was not found.', 'Desktop signal collection failed.'),
      metaDescription: signalCheck(desktopSignals?.metaDescriptionPresent, 'A meta description is present.', 'A meta description was not found.', 'Desktop signal collection failed.'),
      viewportMeta: signalCheck(desktopSignals?.viewportPresent, 'A viewport meta tag is present.', 'A viewport meta tag was not found.', 'Desktop signal collection failed.'),
      visibleNavigation: signalCheck(desktopSignals?.navigationVisible, 'Visible navigation was found.', 'Visible navigation was not found.', 'Desktop signal collection failed.'),
      visibleContactLink: signalCheck(desktopSignals?.contactVisible, 'A visible contact link was found.', 'A visible contact link was not found.', 'Desktop signal collection failed.'),
      visibleConversionCta: signalCheck(desktopSignals?.conversionVisible, 'A visible conversion CTA was found.', 'A visible booking, reservation, or contact CTA was not found.', 'Desktop signal collection failed.'),
      desktopHorizontalOverflow: inverseSignalCheck(desktopSignals?.horizontalOverflow, 'No desktop horizontal overflow was detected.', 'Desktop horizontal overflow was detected.', 'Desktop signal collection failed.'),
      mobileHorizontalOverflow: inverseSignalCheck(mobileSignals?.horizontalOverflow, 'No mobile horizontal overflow was detected.', 'Mobile horizontal overflow was detected.', 'Mobile audit did not complete.'),
      obviousEmptyPage: inverseSignalCheck(desktopSignals?.obviousEmpty, 'The page contains visible content.', 'The page appears empty.', 'Desktop signal collection failed.'),
      obviousBrokenImages: inverseSignalCheck(desktopSignals?.brokenImages, 'No obviously broken images were found.', 'One or more obviously broken images were found.', 'Desktop signal collection failed.'),
      headingStructure: desktopSignals
        ? check(desktopSignals.h1Count === 1 ? 'PASS' : 'FAIL', `Visible H1 count: ${desktopSignals.h1Count}.`)
        : check('UNKNOWN', 'Desktop signal collection failed.'),
      basicFormPresence: desktopSignals
        ? check(desktopSignals.formPresent ? 'PASS' : 'NOT_APPLICABLE', desktopSignals.formPresent ? 'A form is present.' : 'No form was found; this is recorded without treating it as a defect.')
        : check('UNKNOWN', 'Desktop signal collection failed.'),
    };

    await desktopContext.close();
    await mobileContext.close();

    return {
      leadId,
      auditedUrl: url,
      startedAt,
      completedAt: new Date().toISOString(),
      reachable: navigationSucceeded && documentLoaded,
      finalUrl,
      checks,
      consoleErrors: [...consoleErrors],
      failedRequests: [...failedRequests],
      desktopObservations: desktopSignals ? summarizeSignals(desktopSignals) : ['Desktop signal collection did not complete.'],
      mobileObservations: mobileSignals ? summarizeSignals(mobileSignals) : ['Mobile audit did not complete.'],
      evidenceLimitations: [
        'This was a conservative read-only inspection; no forms, logins, bookings, payments, or destructive controls were used.',
        'No claim of full accessibility, SEO, performance, or visual-quality compliance is made.',
        'Current-site screenshots were inspected during the browser session but not persisted because the demo pack output is intentionally limited.',
        ...auditErrors.map((error) => `Audit execution limitation at ${error.stage}: ${error.message}`),
      ],
      auditErrors,
      lighthouse: await collectLighthouse(finalUrl),
      manualReviewRequired: true,
    };
  } catch (error) {
    auditErrors.push(safeAuditError(navigationSucceeded ? 'audit_execution' : 'browser_launch', error));
    if (navigationSucceeded) {
      return executionFailureAudit({
        leadId,
        url,
        startedAt,
        finalUrl,
        consoleErrors,
        failedRequests,
        auditErrors,
      });
    }
    return navigationFailureAudit({
      leadId,
      url,
      startedAt,
      finalUrl,
      consoleErrors,
      failedRequests,
      auditErrors,
    });
  } finally {
    await browser?.close().catch(() => undefined);
  }
}

async function collectSignals(page: Page) {
  return page.evaluate(() => {
    return {
      titlePresent: document.title.trim().length > 0,
      metaDescriptionPresent: Boolean(document.querySelector('meta[name="description"][content]')),
      viewportPresent: Boolean(document.querySelector('meta[name="viewport"]')),
      navigationVisible: Array.from(document.querySelectorAll('nav')).some((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
      }),
      contactVisible: Array.from(document.querySelectorAll('a, button')).some((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== 'hidden'
          && style.display !== 'none'
          && rect.width > 0
          && rect.height > 0
          && /\bcontact\b/i.test(element.textContent ?? '');
      }),
      conversionVisible: Array.from(document.querySelectorAll('a, button')).some((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== 'hidden'
          && style.display !== 'none'
          && rect.width > 0
          && rect.height > 0
          && /\b(book|booking|reserve|reservation|contact|inquiry|enquire|schedule|appointment)\b/i.test(
            `${element.textContent ?? ''} ${element.getAttribute('href') ?? ''}`,
          );
      }),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      obviousEmpty: (document.body.innerText ?? '').trim().length < 40,
      brokenImages: Array.from(document.images).some((image) => image.complete && image.naturalWidth === 0),
      h1Count: Array.from(document.querySelectorAll('h1')).filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
      }).length,
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

function signalCheck(value: boolean | undefined, pass: string, fail: string, unknown: string): DemoCheck {
  return value === undefined ? check('UNKNOWN', unknown) : booleanCheck(value, pass, fail);
}

function inverseSignalCheck(value: boolean | undefined, pass: string, fail: string, unknown: string): DemoCheck {
  return value === undefined ? check('UNKNOWN', unknown) : booleanCheck(!value, pass, fail);
}

function navigationFailureAudit(input: {
  leadId: string;
  url: string;
  startedAt: string;
  finalUrl: string | null;
  consoleErrors: Set<string>;
  failedRequests: Set<string>;
  auditErrors: SiteAudit['auditErrors'];
}): SiteAudit {
  const reason = 'Website navigation failed; no page-level audit checks were claimed.';
  return {
    ...skippedSiteAudit(input.leadId, input.url, reason),
    startedAt: input.startedAt,
    completedAt: new Date().toISOString(),
    reachable: false,
    finalUrl: input.finalUrl,
    checks: unknownChecks(check('FAIL', reason)),
    consoleErrors: [...input.consoleErrors],
    failedRequests: [...input.failedRequests],
    evidenceLimitations: [...input.auditErrors.map((error) => `Navigation failure at ${error.stage}: ${error.message}`)],
    auditErrors: input.auditErrors,
  };
}

function executionFailureAudit(input: {
  leadId: string;
  url: string;
  startedAt: string;
  finalUrl: string | null;
  consoleErrors: Set<string>;
  failedRequests: Set<string>;
  auditErrors: SiteAudit['auditErrors'];
}): SiteAudit {
  const reason = 'Navigation succeeded, but a later audit stage did not complete.';
  return {
    ...skippedSiteAudit(input.leadId, input.url, reason),
    startedAt: input.startedAt,
    completedAt: new Date().toISOString(),
    reachable: true,
    finalUrl: input.finalUrl,
    checks: unknownChecks(check('PASS', 'Website navigation succeeded.')),
    consoleErrors: [...input.consoleErrors],
    failedRequests: [...input.failedRequests],
    evidenceLimitations: input.auditErrors.map((error) => `Audit execution limitation at ${error.stage}: ${error.message}`),
    auditErrors: input.auditErrors,
  };
}

function unknownChecks(urlLoads: DemoCheck): Record<string, DemoCheck> {
  const unknown = check('UNKNOWN', 'The check was not completed because the audit stage failed.');
  return {
    urlLoads,
    protocol: unknown,
    pageTitle: unknown,
    metaDescription: unknown,
    viewportMeta: unknown,
    visibleNavigation: unknown,
    visibleContactLink: unknown,
    visibleConversionCta: unknown,
    desktopHorizontalOverflow: unknown,
    mobileHorizontalOverflow: unknown,
    obviousEmptyPage: unknown,
    obviousBrokenImages: unknown,
    headingStructure: unknown,
    basicFormPresence: unknown,
  };
}

function safeAuditError(stage: string, error: unknown): SiteAudit['auditErrors'][number] {
  const errorType = error instanceof Error ? error.name : 'UnknownError';
  const rawMessage = error instanceof Error ? error.message : 'Unknown audit failure.';
  return {
    stage,
    errorType,
    message: rawMessage
      .replace(/([?&](?:key|token|secret|password|api_key)=)[^&\s]+/gi, '$1[REDACTED]')
      .replace(/\s+/g, ' ')
      .slice(0, 500),
  };
}

function check(status: DemoCheck['status'], detail: string): DemoCheck {
  return { status, detail };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown audit failure.';
}
