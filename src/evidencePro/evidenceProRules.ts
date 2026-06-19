import fs = require('fs');
import path = require('path');
import { chromium, type BrowserContext, type ConsoleMessage, type Request, type Response, type Video } from '@playwright/test';
import { buildLeadRotationDecision } from '../leadRotation/rotationRules';
import {
  DependencySignal,
  EvidenceProDashboard,
  EvidenceProReport,
  EvidenceProTarget,
  GroupedEvidenceSignal,
  PageWeightMetrics,
  PerformanceMetrics,
} from './types';

export const evidenceProOutputDir = path.join(process.cwd(), 'output', 'evidence-pro');
const evidenceRoot = path.join(process.cwd(), 'output', 'evidence');
const harDir = path.join(evidenceRoot, 'har');
const traceDir = path.join(evidenceRoot, 'traces');
const videoDir = path.join(evidenceRoot, 'videos');
const screenshotDir = path.join(evidenceRoot, 'screenshots');
const stateDir = path.join(evidenceProOutputDir, '.state');
const statePath = path.join(stateDir, 'evidence-pro.json');
const slowRequestMs = 1_500;
const cacheMs = 60 * 60 * 1000;

const safetyRules = [
  'Evidence Pro performs a passive public-page desktop observation only.',
  'No forms, login, account creation, payments, client repositories, deployments, credentials, or private systems are used.',
  'Signals are observations and potential areas to review; no bug, outage, vulnerability, or business impact is claimed.',
  'Artifacts remain local and require human review before client use.',
];

interface RequestObservation {
  url: string;
  method: string;
  resourceType: string;
  statusCode: number | null;
  durationMs: number | null;
  responseBytes: number;
  failed: boolean;
  failureText: string;
}

interface ConsoleObservation {
  type: string;
  text: string;
  timestamp: string;
}

export async function collectEvidencePro(force = false): Promise<EvidenceProReport> {
  const target = currentTarget();
  const cached = loadEvidenceProReport();
  if (!force && cached && sameTarget(cached.target, target) && Date.now() - Date.parse(cached.generatedAt) < cacheMs && artifactsStillExist(cached)) {
    writeEvidenceProOutputs(cached);
    return cached;
  }

  ensureDirectories();
  const artifactStem = `${target.companyId}-desktop`;
  const harPath = path.join(harDir, `${artifactStem}.har`);
  const tracePath = path.join(traceDir, `${artifactStem}.zip`);
  const videoPath = path.join(videoDir, `${artifactStem}.webm`);
  const screenshotPath = path.join(screenshotDir, `${target.companyId}-evidence-pro-desktop.png`);
  const requests: RequestObservation[] = [];
  const consoleTimeline: ConsoleObservation[] = [];
  const requestStarted = new Map<Request, number>();
  let finalUrl = target.website;
  let statusCode: number | null = null;
  let performance: PerformanceMetrics = emptyPerformance();
  let rawVideoPath: string | null = null;
  let video: Video | null = null;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
    recordHar: { path: harPath, mode: 'full', content: 'omit' },
    recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } },
  });
  await context.addInitScript(() => {
    (window as Window & { __evidenceProLcp?: number }).__evidenceProLcp = undefined;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const latest = entries[entries.length - 1];
      if (latest) (window as Window & { __evidenceProLcp?: number }).__evidenceProLcp = latest.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: false });

  try {
    attachObservers(context, requests, consoleTimeline, requestStarted);
    const page = await context.newPage();
    const response = await page.goto(target.website, { waitUntil: 'load', timeout: 35_000 });
    statusCode = response?.status() ?? null;
    finalUrl = page.url();
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await page.waitForTimeout(750);
    performance = await collectPerformanceFromPage(page);
    video = page.video();
    await context.tracing.stop({ path: tracePath });
  } catch (error) {
    try {
      await context.tracing.stop({ path: tracePath });
    } catch {
      // A partial trace may be unavailable after a browser-level failure.
    }
    consoleTimeline.push({
      type: 'collection',
      text: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  } finally {
    await context.close();
    await browser.close();
  }

  if (video) {
    try {
      rawVideoPath = await video.path();
    } catch {
      rawVideoPath = null;
    }
  }

  if (rawVideoPath && fs.existsSync(rawVideoPath) && rawVideoPath !== videoPath) {
    fs.renameSync(rawVideoPath, videoPath);
  }
  await collectActionableLighthouse(target);

  const report = buildEvidenceProReport({
    target,
    generatedAt: new Date().toISOString(),
    requestedUrl: target.website,
    finalUrl,
    statusCode,
    requests,
    consoleTimeline,
    performance,
    harPath: existsPath(harPath),
    tracePath: existsPath(tracePath),
    videoPath: existsPath(videoPath),
    screenshotPath: existsPath(screenshotPath),
  });
  saveState(report);
  writeEvidenceProOutputs(report);
  return report;
}

export function buildEvidenceProReport(input: {
  target: EvidenceProTarget;
  generatedAt: string;
  requestedUrl: string;
  finalUrl: string;
  statusCode: number | null;
  requests: RequestObservation[];
  consoleTimeline: ConsoleObservation[];
  performance: PerformanceMetrics;
  harPath: string | null;
  tracePath: string | null;
  videoPath: string | null;
  screenshotPath: string | null;
}): EvidenceProReport {
  const failedRequests = input.requests.filter((request) => request.failed || (request.statusCode !== null && request.statusCode >= 400));
  const redirects = input.requests.filter((request) => request.statusCode !== null && request.statusCode >= 300 && request.statusCode < 400);
  const slowRequests = input.requests.filter((request) => (request.durationMs ?? 0) >= slowRequestMs);
  const pageWeight = pageWeightMetrics(input.requests);
  const dependencies = dependencySignals(input.requests, input.finalUrl || input.requestedUrl);
  const groupedSignals = groupSignals(input.consoleTimeline, failedRequests);
  const lighthousePaths = existingLighthousePaths(input.target.companyId);
  const availableArtifacts = [input.harPath, input.tracePath, input.videoPath, input.screenshotPath].filter(Boolean).length;
  const status = availableArtifacts === 4 && input.statusCode !== null && lighthousePaths.length > 0 ? 'READY'
    : availableArtifacts > 0 ? 'PARTIAL' : 'NOT AVAILABLE';

  return {
    generatedAt: input.generatedAt,
    target: input.target,
    requestedUrl: input.requestedUrl,
    finalUrl: input.finalUrl,
    statusCode: input.statusCode,
    status,
    har: {
      path: toRepoPath(input.harPath),
      requestCount: input.requests.length,
      failedRequests: failedRequests.length,
      redirects: redirects.length,
      slowRequests: slowRequests.length,
    },
    trace: {
      path: toRepoPath(input.tracePath),
      navigationSteps: [
        `Opened ${input.requestedUrl}`,
        `Observed final URL ${input.finalUrl || 'not available'}`,
        'Captured a full-page desktop screenshot.',
        'Recorded console and network timelines during passive load.',
      ],
      screenshotCount: input.screenshotPath ? 1 : 0,
      consoleTimelineCount: input.consoleTimeline.length,
    },
    video: {
      path: toRepoPath(input.videoPath),
      viewport: '1280x720 desktop recording',
      durationMs: null,
    },
    performance: input.performance,
    pageWeight,
    dependencies,
    groupedSignals,
    screenshotPaths: input.screenshotPath ? [toRepoPath(input.screenshotPath) as string] : [],
    lighthousePaths,
    collectionNotes: [
      'One passive desktop homepage navigation was used for a consistent evidence session.',
      pageWeight.pageSizeBytes > 0 ? 'Page-weight values use observed transferred response bytes when available.' : 'Page-weight transfer sizes were not available from observed responses.',
      input.performance.largestContentfulPaintMs === null ? 'Largest Contentful Paint was not available in the browser performance buffer.' : 'Largest Contentful Paint was observed from the browser performance buffer.',
    ],
    safetyRules,
  };
}

export function loadEvidenceProReport(): EvidenceProReport | null {
  if (!fs.existsSync(statePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf8')) as EvidenceProReport;
  } catch {
    return null;
  }
}

export function buildEvidenceProDashboard(): EvidenceProDashboard {
  const report = loadEvidenceProReport();
  if (!report) {
    return {
      evidencePackageStatus: 'NOT AVAILABLE',
      performanceStatus: 'NOT AVAILABLE',
      traceStatus: 'NOT AVAILABLE',
      videoStatus: 'NOT AVAILABLE',
    };
  }
  return {
    evidencePackageStatus: report.status,
    performanceStatus: report.performance.domContentLoadedMs !== null ? 'CAPTURED' : 'NOT AVAILABLE',
    traceStatus: report.trace.path ? 'CAPTURED' : 'NOT AVAILABLE',
    videoStatus: report.video.path ? 'CAPTURED' : 'NOT AVAILABLE',
  };
}

export function writeEvidenceProOutputs(report: EvidenceProReport): string[] {
  fs.mkdirSync(evidenceProOutputDir, { recursive: true });
  const outputs = [
    ['har-evidence.md', renderHarEvidence(report)],
    ['trace-evidence.md', renderTraceEvidence(report)],
    ['video-evidence.md', renderVideoEvidence(report)],
    ['performance-metrics.md', renderPerformanceMetrics(report)],
    ['page-weight-metrics.md', renderPageWeightMetrics(report)],
    ['dependency-signals.md', renderDependencySignals(report)],
    ['grouped-errors.md', renderGroupedErrors(report)],
    ['evidence-package.md', renderEvidencePackage(report)],
    ['executive-evidence-summary.md', renderExecutiveEvidenceSummary(report)],
    ['evidence-pro-summary.md', renderEvidenceProSummary(report)],
  ] as const;
  return outputs.map(([fileName, body]) => {
    const outputPath = path.join(evidenceProOutputDir, fileName);
    fs.writeFileSync(outputPath, body, 'utf8');
    return outputPath;
  });
}

export function renderHarEvidence(report: EvidenceProReport): string {
  return document(report, 'HAR Evidence', bullets([
    `HAR Status: ${report.har.path ? 'CAPTURED' : 'NOT AVAILABLE'}`,
    `HAR Path: ${report.har.path ?? 'Not available'}`,
    `Request Count: ${report.har.requestCount}`,
    `Failed Requests: ${report.har.failedRequests}`,
    `Redirects: ${report.har.redirects}`,
    `Slow Requests (>= ${slowRequestMs} ms): ${report.har.slowRequests}`,
  ]));
}

export function renderTraceEvidence(report: EvidenceProReport): string {
  return document(report, 'Trace Evidence', [
    bullets([
      `Trace Status: ${report.trace.path ? 'CAPTURED' : 'NOT AVAILABLE'}`,
      `Trace Path: ${report.trace.path ?? 'Not available'}`,
      `Screenshots Captured: ${report.trace.screenshotCount}`,
      `Console Timeline Signals: ${report.trace.consoleTimelineCount}`,
    ]),
    '',
    '## Navigation Steps',
    '',
    numbered(report.trace.navigationSteps),
  ].join('\n'));
}

export function renderVideoEvidence(report: EvidenceProReport): string {
  return document(report, 'Video Evidence', bullets([
    `Video Status: ${report.video.path ? 'CAPTURED' : 'NOT AVAILABLE'}`,
    `Video Path: ${report.video.path ?? 'Not available'}`,
    `Viewport: ${report.video.viewport}`,
    'Recording contains passive desktop navigation only.',
  ]));
}

export function renderPerformanceMetrics(report: EvidenceProReport): string {
  return document(report, 'Performance Metrics', metricTable([
    ['DOMContentLoaded', milliseconds(report.performance.domContentLoadedMs)],
    ['Load Event', milliseconds(report.performance.loadEventMs)],
    ['First Paint', milliseconds(report.performance.firstPaintMs)],
    ['Largest Contentful Paint', milliseconds(report.performance.largestContentfulPaintMs)],
  ]));
}

export function renderPageWeightMetrics(report: EvidenceProReport): string {
  return document(report, 'Page Weight Metrics', metricTable([
    ['Page Size', bytes(report.pageWeight.pageSizeBytes)],
    ['JavaScript Size', bytes(report.pageWeight.javascriptBytes)],
    ['CSS Size', bytes(report.pageWeight.cssBytes)],
    ['Image Size', bytes(report.pageWeight.imageBytes)],
    ['Request Count', String(report.pageWeight.requestCount)],
  ]));
}

export function renderDependencySignals(report: EvidenceProReport): string {
  return document(report, 'Dependency Signals', report.dependencies.length > 0 ? [
    '| Host | Requests | Resource Types | Observation |',
    '| --- | ---: | --- | --- |',
    ...report.dependencies.map((item) => `| ${escapeTable(item.host)} | ${item.requestCount} | ${escapeTable(item.resourceTypes.join(', '))} | ${escapeTable(item.description)} |`),
  ].join('\n') : 'No third-party dependency signals were observed.');
}

export function renderGroupedErrors(report: EvidenceProReport): string {
  return document(report, 'Grouped Observed Signals', report.groupedSignals.length > 0 ? [
    '| Source | Language | Signal | Count | Examples |',
    '| --- | --- | --- | ---: | --- |',
    ...report.groupedSignals.map((item) => `| ${item.source} | ${item.level} | ${escapeTable(item.signature)} | ${item.count} | ${escapeTable(item.examples.join(' / '))} |`),
  ].join('\n') : 'No grouped console or network signals were observed during the passive load.');
}

export function renderEvidencePackage(report: EvidenceProReport): string {
  const lighthouse = lighthouseScoreLines(report.target.companyId);
  return document(report, 'Professional Evidence Package', [
    '## Executive Summary',
    '',
    bullets([
      `Company: ${report.target.companyName}`,
      `Evidence Package Status: ${report.status}`,
      `Public URL Reviewed: ${report.finalUrl}`,
      `HTTP Status Observed: ${report.statusCode ?? 'Not available'}`,
    ]),
    '',
    '## Screenshots',
    '',
    bullets(report.screenshotPaths.length > 0 ? report.screenshotPaths : ['Not available']),
    '',
    '## Lighthouse',
    '',
    bullets(report.lighthousePaths.length > 0 ? report.lighthousePaths : ['Not available for the actionable lead']),
    ...(lighthouse.length > 0 ? ['', ...lighthouse] : []),
    '',
    '## Performance Metrics',
    '',
    metricTable([
      ['DOMContentLoaded', milliseconds(report.performance.domContentLoadedMs)],
      ['Load Event', milliseconds(report.performance.loadEventMs)],
      ['First Paint', milliseconds(report.performance.firstPaintMs)],
      ['Largest Contentful Paint', milliseconds(report.performance.largestContentfulPaintMs)],
    ]),
    '',
    '## Dependency Signals',
    '',
    report.dependencies.length > 0 ? bullets(report.dependencies.map((item) => `${item.host}: ${item.requestCount} observed request(s).`)) : '- None observed.',
    '',
    '## Observed Signals',
    '',
    report.groupedSignals.length > 0 ? bullets(report.groupedSignals.map((item) => `${item.level}: ${item.signature} (${item.count})`)) : '- No grouped signals observed.',
    '',
    '## Recommended Areas To Review',
    '',
    bullets(recommendedAreas(report)),
  ].join('\n'));
}

export function renderExecutiveEvidenceSummary(report: EvidenceProReport): string {
  const lighthouse = lighthouseScoreLines(report.target.companyId);
  return document(report, 'Executive Evidence Summary', bullets([
    `${report.target.companyName} public homepage evidence was collected as a passive, reproducible desktop session.`,
    `${report.har.requestCount} requests and ${bytes(report.pageWeight.pageSizeBytes)} of observed page transfer were recorded.`,
    `${report.dependencies.length} third-party dependency host(s) were observed without classifying them as issues.`,
    `${report.groupedSignals.length} grouped console/network signal(s) are available as potential areas to review.`,
    lighthouse.length > 0 ? `Lighthouse observations: ${lighthouse.join('; ')}.` : 'Actionable-lead Lighthouse scores were not available.',
    'The package supports a manual QA Audit review and does not confirm defects or business impact.',
  ]));
}

export function renderEvidenceProSummary(report: EvidenceProReport): string {
  return document(report, 'Evidence Pro Summary', bullets([
    `Company: ${report.target.companyName}`,
    `Evidence Package Status: ${report.status}`,
    `HAR: ${report.har.path ? 'CAPTURED' : 'NOT AVAILABLE'}`,
    `Trace: ${report.trace.path ? 'CAPTURED' : 'NOT AVAILABLE'}`,
    `Video: ${report.video.path ? 'CAPTURED' : 'NOT AVAILABLE'}`,
    `Performance: ${report.performance.domContentLoadedMs !== null ? 'CAPTURED' : 'NOT AVAILABLE'}`,
    `Page Weight: ${bytes(report.pageWeight.pageSizeBytes)}`,
    `Dependency Signals: ${report.dependencies.length}`,
    `Grouped Signals: ${report.groupedSignals.length}`,
  ]));
}

function attachObservers(
  context: BrowserContext,
  requests: RequestObservation[],
  consoleTimeline: ConsoleObservation[],
  requestStarted: Map<Request, number>,
): void {
  context.on('page', (page) => {
    page.on('console', (message: ConsoleMessage) => {
      if (message.type() === 'error' || message.type() === 'warning') {
        consoleTimeline.push({ type: message.type(), text: truncate(message.text()), timestamp: new Date().toISOString() });
      }
    });
    page.on('request', (request) => requestStarted.set(request, Date.now()));
    page.on('response', async (response: Response) => {
      const request = response.request();
      const headerSize = responseSize(response);
      let bodySize = 0;
      try {
        bodySize = (await response.body()).byteLength;
      } catch {
        bodySize = 0;
      }
      requests.push({
        url: response.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        statusCode: response.status(),
        durationMs: duration(requestStarted.get(request)),
        responseBytes: headerSize || bodySize,
        failed: false,
        failureText: '',
      });
    });
    page.on('requestfailed', (request) => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        statusCode: null,
        durationMs: duration(requestStarted.get(request)),
        responseBytes: 0,
        failed: true,
        failureText: request.failure()?.errorText ?? 'Request failed',
      });
    });
  });
}

async function collectPerformanceFromPage(page: import('@playwright/test').Page): Promise<PerformanceMetrics> {
  return page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const paints = performance.getEntriesByType('paint');
    const firstPaint = paints.find((entry) => entry.name === 'first-paint');
    const lcp = (window as Window & { __evidenceProLcp?: number }).__evidenceProLcp;
    return {
      domContentLoadedMs: navigation ? Math.round(navigation.domContentLoadedEventEnd) : null,
      loadEventMs: navigation ? Math.round(navigation.loadEventEnd) : null,
      firstPaintMs: firstPaint ? Math.round(firstPaint.startTime) : null,
      largestContentfulPaintMs: lcp ? Math.round(lcp) : null,
    };
  });
}

function pageWeightMetrics(requests: RequestObservation[]): PageWeightMetrics {
  const sum = (types: string[]) => requests.filter((request) => types.includes(request.resourceType)).reduce((total, request) => total + request.responseBytes, 0);
  return {
    pageSizeBytes: requests.reduce((total, request) => total + request.responseBytes, 0),
    javascriptBytes: sum(['script']),
    cssBytes: sum(['stylesheet']),
    imageBytes: sum(['image']),
    requestCount: requests.length,
  };
}

function dependencySignals(requests: RequestObservation[], pageUrl: string): DependencySignal[] {
  let firstPartyHost = '';
  try {
    firstPartyHost = new URL(pageUrl).hostname.replace(/^www\./, '');
  } catch {
    return [];
  }
  const groups = new Map<string, RequestObservation[]>();
  for (const request of requests) {
    try {
      const host = new URL(request.url).hostname.replace(/^www\./, '');
      if (!host || host === firstPartyHost || host.endsWith(`.${firstPartyHost}`)) continue;
      groups.set(host, [...(groups.get(host) ?? []), request]);
    } catch {
      // Ignore malformed request URLs.
    }
  }
  return [...groups.entries()]
    .map(([host, items]) => ({
      host,
      requestCount: items.length,
      resourceTypes: [...new Set(items.map((item) => item.resourceType))].sort(),
      description: `Observed dependency signal: public page requested external assets from ${host}.`,
    }))
    .sort((left, right) => right.requestCount - left.requestCount || left.host.localeCompare(right.host));
}

function groupSignals(consoleTimeline: ConsoleObservation[], failures: RequestObservation[]): GroupedEvidenceSignal[] {
  const raw = [
    ...consoleTimeline.map((item) => ({ source: 'console' as const, text: item.text })),
    ...failures.map((item) => ({ source: 'network' as const, text: `${item.statusCode ?? item.failureText} ${safePath(item.url)}` })),
  ];
  const groups = new Map<string, { source: 'console' | 'network'; values: string[] }>();
  for (const item of raw) {
    const signature = normalizeSignal(item.text);
    const key = `${item.source}:${signature}`;
    groups.set(key, { source: item.source, values: [...(groups.get(key)?.values ?? []), item.text] });
  }
  return [...groups.entries()].map(([key, group]): GroupedEvidenceSignal => ({
    source: group.source,
    level: group.source === 'network' ? 'potential area to review' : 'observed signal',
    signature: key.slice(key.indexOf(':') + 1),
    count: group.values.length,
    examples: [...new Set(group.values)].slice(0, 3),
  })).sort((left, right) => right.count - left.count || left.signature.localeCompare(right.signature));
}

function currentTarget(): EvidenceProTarget {
  const actionable = buildLeadRotationDecision().actionableLead;
  if (!actionable?.website) throw new Error('No actionable lead with a public website is available.');
  return {
    companyId: actionable.companyId,
    companyName: actionable.companyName,
    website: actionable.website,
    source: 'Lead Rotation Actionable Lead',
  };
}

async function collectActionableLighthouse(target: EvidenceProTarget): Promise<void> {
  const rawPath = path.join(evidenceRoot, 'lighthouse', `${target.companyId}-lhr.json`);
  const htmlPath = path.join(evidenceRoot, 'lighthouse', `${target.companyId}.html`);
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
      const result = await lighthouse(target.website, {
        port: chrome.port,
        logLevel: 'error',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        channel: 'ai-testing-engineer-studio-evidence-pro',
      });
      if (!result) return;
      fs.writeFileSync(rawPath, JSON.stringify(result.lhr, null, 2), 'utf8');
      fs.writeFileSync(htmlPath, generateReport(result.lhr, 'html'), 'utf8');
    } finally {
      await chrome.kill();
    }
  } catch {
    // Package status remains PARTIAL when actionable-lead Lighthouse is unavailable.
  }
}

function existingLighthousePaths(companyId: string): string[] {
  const candidates = [
    path.join(evidenceRoot, 'lighthouse', `${companyId}-lhr.json`),
    path.join(evidenceRoot, 'lighthouse', `${companyId}.html`),
    path.join(process.cwd(), 'output', 'lighthouse', `${companyId}-lighthouse.md`),
  ];
  return candidates.filter(fs.existsSync).map((item) => path.relative(process.cwd(), item).split(path.sep).join('/'));
}

function lighthouseScoreLines(companyId: string): string[] {
  const reportPath = path.join(evidenceRoot, 'lighthouse', `${companyId}-lhr.json`);
  if (!fs.existsSync(reportPath)) return [];
  try {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as {
      categories?: Record<string, { score?: number | null }>;
    };
    const score = (key: string): string => {
      const value = report.categories?.[key]?.score;
      return value === null || value === undefined ? 'Not available' : `${Math.round(value * 100)}/100`;
    };
    return [
      `Performance ${score('performance')}`,
      `Accessibility ${score('accessibility')}`,
      `Best Practices ${score('best-practices')}`,
      `SEO ${score('seo')}`,
    ];
  } catch {
    return [];
  }
}

function recommendedAreas(report: EvidenceProReport): string[] {
  const recommendations = [
    report.har.failedRequests > 0 ? `Review ${report.har.failedRequests} failed request signal(s) in the HAR.` : 'No failed request signal requires review from this passive load.',
    report.har.slowRequests > 0 ? `Review ${report.har.slowRequests} request(s) observed at or above ${slowRequestMs} ms.` : 'No request exceeded the slow-request threshold.',
    report.groupedSignals.length > 0 ? 'Review grouped console and network signals for reproducibility.' : 'No grouped console/network signal requires follow-up from this session.',
    report.dependencies.length > 0 ? 'Review third-party dependency concentration and ownership boundaries.' : 'No third-party dependency signal was available.',
  ];
  return recommendations;
}

function saveState(report: EvidenceProReport): void {
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(statePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

function ensureDirectories(): void {
  [evidenceProOutputDir, stateDir, harDir, traceDir, videoDir, screenshotDir].forEach((directory) => fs.mkdirSync(directory, { recursive: true }));
}

function artifactsStillExist(report: EvidenceProReport): boolean {
  return [report.har.path, report.trace.path, report.video.path]
    .filter((item): item is string => Boolean(item))
    .every((item) => fs.existsSync(path.join(process.cwd(), item)));
}

function sameTarget(left: EvidenceProTarget, right: EvidenceProTarget): boolean {
  return left.companyId === right.companyId && left.website === right.website;
}

function responseSize(response: Response): number {
  const header = Number(response.headers()['content-length']);
  if (Number.isFinite(header) && header > 0) return header;
  const timing = response.request().timing();
  return Number.isFinite(timing.responseEnd) ? 0 : 0;
}

function duration(startedAt: number | undefined): number | null {
  return startedAt ? Date.now() - startedAt : null;
}

function existsPath(filePath: string): string | null {
  return fs.existsSync(filePath) && fs.statSync(filePath).size > 0 ? filePath : null;
}

function toRepoPath(filePath: string | null): string | null {
  return filePath ? path.relative(process.cwd(), filePath).split(path.sep).join('/') : null;
}

function normalizeSignal(value: string): string {
  return truncate(value)
    .replace(/https?:\/\/\S+/g, '<url>')
    .replace(/\b\d+\b/g, '<n>')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function safePath(value: string): string {
  try {
    const url = new URL(value);
    return `${url.hostname}${url.pathname}`;
  } catch {
    return value;
  }
}

function truncate(value: string): string {
  return String(value).replace(/\s+/g, ' ').trim().slice(0, 300);
}

function emptyPerformance(): PerformanceMetrics {
  return { domContentLoadedMs: null, loadEventMs: null, firstPaintMs: null, largestContentfulPaintMs: null };
}

function document(report: EvidenceProReport, title: string, body: string): string {
  return [
    `# ${title}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Company: ${report.target.companyName}`,
    '',
    body,
    '',
    '## Safety Rules',
    '',
    bullets(report.safetyRules),
    '',
  ].join('\n');
}

function metricTable(rows: Array<[string, string]>): string {
  return ['| Metric | Observed Value |', '| --- | --- |', ...rows.map(([label, value]) => `| ${label} | ${value} |`)].join('\n');
}

function milliseconds(value: number | null): string {
  return value === null ? 'Not available' : `${value} ms`;
}

function bytes(value: number): string {
  if (value <= 0) return 'Not available';
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(2)} MB`;
  return `${Math.round(value / 1024)} KB`;
}

function bullets(items: string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join('\n') : '- None.';
}

function numbered(items: string[]): string {
  return items.length > 0 ? items.map((item, index) => `${index + 1}. ${item}`).join('\n') : '1. None.';
}

function escapeTable(value: string): string {
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
