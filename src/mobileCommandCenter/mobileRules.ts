import fs = require('fs');
import path = require('path');
import { buildPwaDashboardData, DashboardLink } from '../dashboard/dashboardDataBuilder';
import {
  MobileLink,
  MobileQueueItem,
  MobileReviewItem,
  MobileReviewPackage,
  MobileState,
} from './types';

const outputDir = path.join(process.cwd(), 'output', 'mobile');
const mobileStatePath = path.join(process.cwd(), 'data', 'mobile', 'mobile-state.json');

const safety = [
  'Read only.',
  'Review focused.',
  'Approval focused.',
  'No outreach, emails, proposals, invoices, payment requests, lead data changes, proposal data changes, APIs, credentials, or external actions are performed.',
];

export function buildMobileReviewPackage(): MobileReviewPackage {
  const dashboard = buildPwaDashboardData();
  const center = dashboard.mobileCommandCenter;

  return {
    generatedAt: dashboard.generatedAt,
    mode: 'read-only-review',
    reviewCenter: [
      item('Audits Ready', String(center.reviewCenter.auditsReady), center.auditCenter.links),
      item('Proposals Ready', String(center.reviewCenter.proposalsReady), center.proposalCenter.proposalPdfs),
      item('Evidence Ready', String(center.reviewCenter.evidenceReady), center.auditCenter.links.filter((link) => link.href.includes('/evidence/') || link.href.includes('/lighthouse/') || link.href.includes('/playwright-runner/'))),
      item('Follow-Ups Ready', String(center.reviewCenter.followUpsReady), center.followUpCenter.links),
    ],
    revenueCenter: [
      item('Best Audit Opportunity', center.revenueCenter.bestAuditOpportunity),
      item('Best Starter Pack Opportunity', center.revenueCenter.bestStarterPackOpportunity),
      item('Best Retainer Opportunity', center.revenueCenter.bestRetainerOpportunity),
      item('Highest Revenue Priority', center.revenueCenter.highestRevenuePriority),
    ],
    actionQueue: center.actionQueue.map((action) => ({
      priority: action.priority,
      title: action.title,
      reason: action.whyItMatters,
      impact: action.estimatedImpact,
      recommendedAction: action.nextStep,
    })),
    auditCenter: [
      item('Audit Reports Available', String(center.auditCenter.auditReportsAvailable), center.auditCenter.links.filter((link) => link.href.includes('/client-audit-reports/'))),
      item('Unified Audits Available', String(center.auditCenter.unifiedAuditsAvailable), center.auditCenter.links.filter((link) => link.href.includes('/unified-audits/'))),
      item('Evidence Available', String(center.auditCenter.evidenceAvailable), center.auditCenter.links.filter((link) => link.href.includes('/evidence/') || link.href.includes('/lighthouse/') || link.href.includes('/playwright-runner/'))),
      item('Audit Readiness', center.auditCenter.auditReadiness, center.auditCenter.links),
    ],
    proposalCenter: [
      item('Proposal PDFs', center.proposalCenter.proposalPdfs.length > 0 ? `${center.proposalCenter.proposalPdfs.length} files` : 'None', center.proposalCenter.proposalPdfs),
      item('Proposal Status', center.proposalCenter.proposalStatus.join(' | ') || 'None'),
      item('Retainer Candidates', center.proposalCenter.retainerCandidates.join(' | ') || 'None'),
    ],
    followUpCenter: [
      item('Follow-Ups Due', String(center.followUpCenter.followUpsDue), center.followUpCenter.links),
      item('Outreach Status', center.followUpCenter.outreachStatus, center.followUpCenter.links),
      item('Contact Status', center.followUpCenter.contactStatus, center.followUpCenter.links),
    ],
    safety,
  };
}

export function writeMobileReviewOutputs(review: MobileReviewPackage): string[] {
  const outputs = [
    ['mobile-review.md', renderMobileReview(review)],
    ['mobile-summary.md', renderMobileSummary(review)],
    ['mobile-queue.md', renderMobileQueue(review)],
    ['mobile-priorities.md', renderMobilePriorities(review)],
    ['mobile-health.md', renderMobileHealth(review)],
  ] as const;
  updateMobileState(review.generatedAt);
  return outputs.map(([fileName, body]) => writeOutput(fileName, body));
}

export function writeMobileSummaryOutput(review: MobileReviewPackage): string {
  updateMobileState(review.generatedAt);
  return writeOutput('mobile-summary.md', renderMobileSummary(review));
}

export function writeMobileQueueOutput(review: MobileReviewPackage): string {
  updateMobileState(review.generatedAt);
  return writeOutput('mobile-queue.md', renderMobileQueue(review));
}

export function renderMobileReview(review: MobileReviewPackage): string {
  return `# Mobile Review

Generated: ${review.generatedAt}

## Review Center

${renderItems(review.reviewCenter)}

## Revenue Center

${renderItems(review.revenueCenter)}

## Action Queue

${renderQueue(review.actionQueue)}

## Audit Center

${renderItems(review.auditCenter)}

## Proposal Center

${renderItems(review.proposalCenter)}

## Follow-Up Center

${renderItems(review.followUpCenter)}

## Safety

${bullets(review.safety)}
`;
}

export function renderMobileSummary(review: MobileReviewPackage): string {
  return `# Mobile Summary

Generated: ${review.generatedAt}

## 20-Second View

${bullets([
    `Top Priority: ${review.actionQueue[0]?.title ?? 'No priority found'}`,
    `Best Audit Opportunity: ${valueFor(review.revenueCenter, 'Best Audit Opportunity')}`,
    `Best Starter Pack Opportunity: ${valueFor(review.revenueCenter, 'Best Starter Pack Opportunity')}`,
    `Best Retainer Opportunity: ${valueFor(review.revenueCenter, 'Best Retainer Opportunity')}`,
    `Follow-Ups Due: ${valueFor(review.followUpCenter, 'Follow-Ups Due')}`,
    `Proposal PDFs: ${valueFor(review.proposalCenter, 'Proposal PDFs')}`,
  ])}

## Safety

${bullets(review.safety)}
`;
}

export function renderMobileQueue(review: MobileReviewPackage): string {
  return `# Mobile Action Queue

Generated: ${review.generatedAt}

${renderQueue(review.actionQueue)}

## Safety

${bullets(review.safety)}
`;
}

export function renderMobilePriorities(review: MobileReviewPackage): string {
  return `# Mobile Priorities

Generated: ${review.generatedAt}

## Revenue Priorities

${renderItems(review.revenueCenter)}

## Review Priorities

${renderItems(review.reviewCenter)}

## Top Actions

${renderQueue(review.actionQueue.slice(0, 5))}
`;
}

export function renderMobileHealth(review: MobileReviewPackage): string {
  return `# Mobile Health

Generated: ${review.generatedAt}

${bullets([
    'Mobile review package generated.',
    `Action Queue Items: ${review.actionQueue.length}`,
    `Audit Links: ${review.auditCenter.reduce((sum, item) => sum + item.links.length, 0)}`,
    `Proposal Links: ${review.proposalCenter.reduce((sum, item) => sum + item.links.length, 0)}`,
    `Follow-Up Links: ${review.followUpCenter.reduce((sum, item) => sum + item.links.length, 0)}`,
    'Status: Read-only review mode.',
  ])}

## Safety

${bullets(review.safety)}
`;
}

function item(label: string, value: string, links: DashboardLink[] = []): MobileReviewItem {
  return {
    label,
    value,
    links: links.map((link) => ({ label: link.label, href: link.href })),
  };
}

function renderItems(items: MobileReviewItem[]): string {
  return items.map((reviewItem) => `### ${reviewItem.label}

${bullets([
    `Status: ${reviewItem.value}`,
    `Links: ${reviewItem.links.length > 0 ? '' : 'None available'}`,
  ])}
${renderLinks(reviewItem.links)}`).join('\n\n');
}

function renderQueue(queue: MobileQueueItem[]): string {
  if (queue.length === 0) return '- No mobile actions found.';
  return queue.map((action) => `### Priority ${action.priority}

${bullets([
    `Action: ${action.title}`,
    `Reason: ${action.reason}`,
    `Impact: ${action.impact}`,
    `Recommended Action: ${action.recommendedAction}`,
  ])}`).join('\n\n');
}

function renderLinks(links: MobileLink[]): string {
  if (links.length === 0) return '';
  return links.map((link) => `- [${link.label}](${mobileReportHref(link.href)})`).join('\n');
}

function mobileReportHref(href: string): string {
  if (href.startsWith('../output/')) return `../${href.slice('../output/'.length)}`;
  return href;
}

function valueFor(items: MobileReviewItem[], label: string): string {
  return items.find((item) => item.label === label)?.value ?? 'Not available';
}

function writeOutput(fileName: string, body: string): string {
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, fileName);
  fs.writeFileSync(outputPath, body, 'utf8');
  return outputPath;
}

function updateMobileState(generatedAt: string): void {
  fs.mkdirSync(path.dirname(mobileStatePath), { recursive: true });
  const current = readJson<MobileState>(mobileStatePath, {
    version: 1,
    mode: 'read-only-review',
    lastGeneratedAt: null,
    notes: [],
  });
  fs.writeFileSync(mobileStatePath, `${JSON.stringify({ ...current, lastGeneratedAt: generatedAt }, null, 2)}\n`, 'utf8');
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function bullets(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}
