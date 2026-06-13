import fs = require('fs');
import path = require('path');
import type { Flags, Result } from 'lighthouse/types/lh.js';
import {
  LighthouseCategoryId,
  LighthouseEvidenceReport,
  LighthouseEvidenceSummary,
  LighthouseOpportunity,
  LighthouseScores,
  LighthouseTarget,
} from './types';

const outputDir = path.join(process.cwd(), 'output', 'lighthouse');
const evidenceDir = path.join(process.cwd(), 'data', 'evidence', 'lighthouse');
const reportsDir = path.join(evidenceDir, 'reports');
const rawDir = path.join(evidenceDir, 'raw');
const evidenceTargetsPath = path.join(process.cwd(), 'data', 'evidence', 'evidence.json');
const opportunityTargetsPath = path.join(process.cwd(), 'data', 'opportunities', 'opportunities.json');
const auditTargetsPath = path.join(process.cwd(), 'data', 'audit-packs', 'audit-packs.json');

const allowedCategories: LighthouseCategoryId[] = ['performance', 'accessibility', 'best-practices', 'seo'];

export async function runLighthouseEvidence(company: string, url: string): Promise<LighthouseEvidenceReport> {
  const target = findTarget(company) ?? {
    companyId: slugify(company),
    companyName: company,
  };
  const normalizedUrl = normalizePublicUrl(url);
  ensurePublicHomepageUrl(normalizedUrl);
  ensureDirectories();

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
    const flags: Flags = {
      port: chrome.port,
      logLevel: 'error',
      onlyCategories: [...allowedCategories],
      channel: 'ai-testing-engineer-studio',
    };
    const runnerResult = await lighthouse(normalizedUrl, flags);

    if (!runnerResult) {
      throw new Error(`Lighthouse did not return a result for ${normalizedUrl}`);
    }

    const lhr = runnerResult.lhr;
    const rawLhrPath = path.join(rawDir, `${target.companyId}-lighthouse-lhr.json`);
    const htmlReportPath = path.join(rawDir, `${target.companyId}-lighthouse.html`);
    const markdownReportPath = path.join(outputDir, `${target.companyId}-lighthouse.md`);
    const structuredReportPath = path.join(reportsDir, `${target.companyId}-lighthouse-evidence.json`);

    fs.writeFileSync(rawLhrPath, JSON.stringify(lhr, null, 2), 'utf8');
    fs.writeFileSync(htmlReportPath, generateReport(lhr, 'html'), 'utf8');

    const report = buildReport(target, normalizedUrl, lhr, rawLhrPath, htmlReportPath, markdownReportPath);

    fs.writeFileSync(markdownReportPath, renderLighthouseReport(report), 'utf8');
    fs.writeFileSync(structuredReportPath, JSON.stringify(report, null, 2), 'utf8');

    return report;
  } finally {
    chrome.kill();
  }
}

export function buildLighthouseSummary(): LighthouseEvidenceSummary {
  return {
    generatedAt: new Date().toISOString(),
    reports: loadExistingReports(),
  };
}

export function writeLighthouseSummary(summary: LighthouseEvidenceSummary): string[] {
  fs.mkdirSync(outputDir, { recursive: true });
  const outputs = [
    ['lighthouse-summary.md', renderLighthouseSummary(summary)],
    ['lighthouse-priorities.md', renderLighthousePriorities(summary)],
    ['lighthouse-comparison.md', renderLighthouseComparison(summary)],
  ] as const;

  return outputs.map(([fileName, content]) => {
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, content, 'utf8');
    return outputPath;
  });
}

export function loadLighthouseReport(companyId: string): LighthouseEvidenceReport | undefined {
  return loadExistingReports().find((report) => report.companyId === companyId);
}

export function lighthouseReportExists(companyId: string): boolean {
  return fs.existsSync(path.join(reportsDir, `${companyId}-lighthouse-evidence.json`));
}

export function renderLighthouseReport(report: LighthouseEvidenceReport): string {
  return `# Lighthouse Evidence: ${report.companyName}

## Executive Summary

${bullets([
    `Company: ${report.companyName}`,
    `Performance: ${scoreLabel(report.scores.performance)}`,
    `Accessibility: ${scoreLabel(report.scores.accessibility)}`,
    `Best Practices: ${scoreLabel(report.scores.bestPractices)}`,
    `SEO: ${scoreLabel(report.scores.seo)}`,
  ])}

## Evidence Details

${bullets([
    `Requested URL: ${report.requestedUrl}`,
    `Final URL: ${report.finalUrl}`,
    `Generated At: ${report.generatedAt}`,
    `Lighthouse Fetch Time: ${report.fetchTime}`,
    `Lighthouse Version: ${report.lighthouseVersion}`,
    `Form Factor: ${report.formFactor}`,
    `Raw LHR: ${report.rawLhrPath}`,
    `HTML Report: ${report.htmlReportPath}`,
  ])}

## Opportunities

${renderOpportunities(report.opportunities)}

## Safety Notes

${bullets(report.safetyNotes)}
`;
}

export function renderLighthouseSummary(summary: LighthouseEvidenceSummary): string {
  return `# Lighthouse Summary

Generated: ${summary.generatedAt}

${summary.reports.length === 0 ? 'No local Lighthouse evidence records are available yet. Run `npm run evidence:lighthouse -- --company PushPress -- --url https://www.pushpress.com` first.\n' : ''}

| Company | Performance | Accessibility | Best Practices | SEO | Final URL |
| --- | --- | --- | --- | --- | --- |
${summary.reports.map((report) => `| ${report.companyName} | ${scoreLabel(report.scores.performance)} | ${scoreLabel(report.scores.accessibility)} | ${scoreLabel(report.scores.bestPractices)} | ${scoreLabel(report.scores.seo)} | ${report.finalUrl} |`).join('\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderLighthousePriorities(summary: LighthouseEvidenceSummary): string {
  const ranked = [...summary.reports].sort((left, right) => averageScore(left.scores) - averageScore(right.scores) || left.companyName.localeCompare(right.companyName));
  const opportunities = ranked.flatMap((report) => report.opportunities.map((opportunity) => ({ report, opportunity })));

  return `# Lighthouse Priorities

Findings are framed as potential opportunities only. No confirmed production issue, bug, or vulnerability is claimed.

${opportunities.length > 0 ? opportunities.map(({ report, opportunity }) => `## ${report.companyName}

${bullets([
    `Type: ${opportunity.type}`,
    `Description: ${opportunity.description}`,
    `Evidence: ${opportunity.evidence}`,
    `Confidence: ${opportunity.confidence}`,
  ])}`).join('\n\n') : '- No potential Lighthouse opportunities recorded.'}

## Portfolio Order

${ranked.map((report, index) => `${index + 1}. ${report.companyName} - average score ${scoreLabel(averageScore(report.scores) / 100)}`).join('\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderLighthouseComparison(summary: LighthouseEvidenceSummary): string {
  return `# Lighthouse Comparison

| Category | Lowest Score | Highest Score |
| --- | --- | --- |
| Performance | ${extremeScore(summary.reports, 'performance', 'lowest')} | ${extremeScore(summary.reports, 'performance', 'highest')} |
| Accessibility | ${extremeScore(summary.reports, 'accessibility', 'lowest')} | ${extremeScore(summary.reports, 'accessibility', 'highest')} |
| Best Practices | ${extremeScore(summary.reports, 'bestPractices', 'lowest')} | ${extremeScore(summary.reports, 'bestPractices', 'highest')} |
| SEO | ${extremeScore(summary.reports, 'seo', 'lowest')} | ${extremeScore(summary.reports, 'seo', 'highest')} |

## Company Scores

${summary.reports.map((report) => `## ${report.companyName}

${bullets([
    `Performance: ${scoreLabel(report.scores.performance)}`,
    `Accessibility: ${scoreLabel(report.scores.accessibility)}`,
    `Best Practices: ${scoreLabel(report.scores.bestPractices)}`,
    `SEO: ${scoreLabel(report.scores.seo)}`,
  ])}`).join('\n\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

function buildReport(target: LighthouseTarget, requestedUrl: string, lhr: Result, rawLhrPath: string, htmlReportPath: string, markdownReportPath: string): LighthouseEvidenceReport {
  const scores = scoresFromLhr(lhr);

  return {
    companyId: target.companyId,
    companyName: target.companyName,
    requestedUrl,
    finalUrl: lhr.finalDisplayedUrl || lhr.finalUrl || requestedUrl,
    generatedAt: new Date().toISOString(),
    lighthouseVersion: lhr.lighthouseVersion,
    fetchTime: lhr.fetchTime,
    formFactor: lhr.configSettings.formFactor,
    scores,
    opportunities: buildOpportunities(target.companyName, scores),
    rawLhrPath: path.relative(process.cwd(), rawLhrPath),
    htmlReportPath: path.relative(process.cwd(), htmlReportPath),
    markdownReportPath: path.relative(process.cwd(), markdownReportPath),
    safetyNotes: safetyNotes(),
  };
}

function scoresFromLhr(lhr: Result): LighthouseScores {
  return {
    performance: normalizeScore(lhr.categories.performance?.score),
    accessibility: normalizeScore(lhr.categories.accessibility?.score),
    bestPractices: normalizeScore(lhr.categories['best-practices']?.score),
    seo: normalizeScore(lhr.categories.seo?.score),
  };
}

function buildOpportunities(companyName: string, scores: LighthouseScores): LighthouseOpportunity[] {
  return [
    opportunity(companyName, 'performance', 'Potential Performance Opportunity', scores.performance, 0.9),
    opportunity(companyName, 'accessibility', 'Potential Accessibility Opportunity', scores.accessibility, 0.9),
    opportunity(companyName, 'best-practices', 'Potential Best Practice Opportunity', scores.bestPractices, 0.9),
    opportunity(companyName, 'seo', 'Potential SEO Opportunity', scores.seo, 0.9),
  ].filter((item): item is LighthouseOpportunity => Boolean(item));
}

function opportunity(companyName: string, category: LighthouseCategoryId, type: LighthouseOpportunity['type'], score: number | null, threshold: number): LighthouseOpportunity | undefined {
  if (score === null || score >= threshold) return undefined;
  const displayedCategory = displayCategory(category);

  return {
    type,
    category,
    description: `Review ${displayedCategory.toLowerCase()} improvements for the public homepage.`,
    evidence: `${companyName} ${displayedCategory} Lighthouse score was ${scoreLabel(score)} on the public homepage.`,
    confidence: score < 0.5 ? 'High' : score < 0.75 ? 'Medium' : 'Low',
  };
}

function loadExistingReports(): LighthouseEvidenceReport[] {
  if (!fs.existsSync(reportsDir)) return [];
  const targets = loadTargets();

  return fs.readdirSync(reportsDir)
    .filter((fileName) => fileName.endsWith('-lighthouse-evidence.json'))
    .map((fileName) => readJson<LighthouseEvidenceReport>(path.join(reportsDir, fileName)))
    .sort((left, right) => {
      return targetPriority(left.companyId, targets) - targetPriority(right.companyId, targets)
        || left.companyName.localeCompare(right.companyName);
    });
}

function findTarget(company: string): LighthouseTarget | undefined {
  const normalized = normalize(company);
  return loadTargets().find((target) => matchesNormalized(normalize(target.companyId), normalized) || matchesNormalized(normalize(target.companyName), normalized));
}

function loadTargets(): LighthouseTarget[] {
  return [
    ...readJson<LighthouseTarget[]>(evidenceTargetsPath, []),
    ...readJson<LighthouseTarget[]>(opportunityTargetsPath, []),
    ...readJson<LighthouseTarget[]>(auditTargetsPath, []),
  ].filter((target, index, targets) => targets.findIndex((candidate) => candidate.companyId === target.companyId) === index);
}

function targetPriority(companyId: string, targets: LighthouseTarget[]): number {
  const index = targets.findIndex((target) => target.companyId === companyId);
  return index >= 0 ? index : 999;
}

function ensureDirectories(): void {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.mkdirSync(rawDir, { recursive: true });
}

function normalizePublicUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid --url value: ${value}`);
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Lighthouse evidence only supports public http/https URLs.');
  }

  url.hash = '';
  return url.toString();
}

function ensurePublicHomepageUrl(value: string): void {
  const url = new URL(value);
  const forbiddenPatterns = [
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

  if (forbiddenPatterns.some((pattern) => pattern.test(`${url.pathname}${url.search}`))) {
    throw new Error('Refusing to run Lighthouse against login, account, checkout, payment, or authenticated-looking URLs.');
  }

  if (url.pathname !== '/' && url.pathname !== '') {
    throw new Error('Refusing to run Lighthouse against non-homepage URLs. Sprint 62 is limited to public homepages only.');
  }
}

function normalizeScore(score: number | null | undefined): number | null {
  return typeof score === 'number' ? score : null;
}

function averageScore(scores: LighthouseScores): number {
  const values = Object.values(scores).filter((score): score is number => score !== null);
  if (values.length === 0) return 0;
  return Math.round((values.reduce((sum, score) => sum + score, 0) / values.length) * 100);
}

function scoreLabel(score: number | null): string {
  if (score === null) return 'Not Available';
  return `${Math.round(score * 100)}/100`;
}

function displayCategory(category: LighthouseCategoryId): string {
  if (category === 'best-practices') return 'Best Practices';
  if (category === 'seo') return 'SEO';
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function extremeScore(reports: LighthouseEvidenceReport[], key: keyof LighthouseScores, mode: 'lowest' | 'highest'): string {
  const scored = reports.filter((report) => report.scores[key] !== null);
  if (scored.length === 0) return 'Not Available';
  const sorted = scored.sort((left, right) => {
    const leftScore = left.scores[key] ?? 0;
    const rightScore = right.scores[key] ?? 0;
    return mode === 'lowest' ? leftScore - rightScore : rightScore - leftScore;
  });
  const selected = sorted[0];
  return `${selected.companyName} (${scoreLabel(selected.scores[key])})`;
}

function renderOpportunities(opportunities: LighthouseOpportunity[]): string {
  if (opportunities.length === 0) return '- No potential Lighthouse opportunities recorded.';
  return opportunities.map((opportunity) => bullets([
    `Type: ${opportunity.type}`,
    `Description: ${opportunity.description}`,
    `Evidence: ${opportunity.evidence}`,
    `Confidence: ${opportunity.confidence}`,
  ])).join('\n\n');
}

function safetyNotes(): string[] {
  return [
    'Lighthouse evidence collection only.',
    'Homepage/public URL only.',
    'No authentication, login, account creation, payments, form submission, crawling, scraping, credential use, vulnerability scanning, or penetration testing.',
    'Only Performance, Accessibility, Best Practices, and SEO scores are captured.',
    'Scores are stored from the real Lighthouse result and are not invented.',
    'Opportunities are potential opportunities only unless separately validated by reviewed evidence.',
  ];
}

function readJson<T>(filePath: string, fallback?: T): T {
  if (!fs.existsSync(filePath)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing JSON file: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw && fallback !== undefined) return fallback;
  return JSON.parse(raw) as T;
}

function bullets(items: string[]): string {
  if (items.length === 0) return '- None recorded.';
  return items.map((item) => `- ${item}`).join('\n');
}

function matchesNormalized(left: string, right: string): boolean {
  return left === right || left.includes(right) || right.includes(left);
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}
