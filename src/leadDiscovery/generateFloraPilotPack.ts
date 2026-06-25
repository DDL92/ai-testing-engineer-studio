import fs = require('fs');
import path = require('path');
import { DeliveryLeadCandidate } from './deliveryLeadTypes';
import { VerificationBatch, VerificationQueueItem } from './verificationTypes';

interface DeliveryBatch {
  generatedAt: string;
  sourceCandidates: number;
  deliveryCandidates: DeliveryLeadCandidate[];
  safetyRules: string[];
}

interface EnrichmentBatch {
  generatedAt: string;
  totalCandidates: number;
  enrichedCandidates: Array<{ clientId: string; overallScore: number }>;
  safetyRules: string[];
}

interface PilotPackResult {
  generatedAt: string;
  outputPaths: string[];
  verificationCandidates: number;
  deliveryCandidates: number;
}

const verificationPath = path.join(process.cwd(), 'output', 'lead-discovery', 'verification', 'verification-summary.md');
const verificationQueuePath = path.join(process.cwd(), 'output', 'lead-discovery', 'verification', 'flora_and_fauna_foods_001-verification-queue.md');
const deliveryPath = path.join(process.cwd(), 'output', 'lead-discovery', 'delivery-candidates', 'delivery-candidates.json');
const enrichedPath = path.join(process.cwd(), 'output', 'lead-discovery', 'enriched-leads', 'enriched-leads.json');
const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'pilots', 'flora-and-fauna-foods');

const outputPaths = {
  summary: path.join(outputDir, 'pilot-summary.md'),
  offer: path.join(outputDir, 'pilot-offer.md'),
  preview: path.join(outputDir, 'candidate-preview.md'),
  process: path.join(outputDir, 'verification-process.md'),
  report: path.join(outputDir, 'client-facing-report.md'),
};

export function generateFloraPilotPack(now = new Date()): PilotPackResult {
  const generatedAt = now.toISOString();
  const deliveryBatch = readJson<DeliveryBatch>(deliveryPath);
  const enrichmentBatch = readJson<EnrichmentBatch>(enrichedPath);
  const verificationCandidates = readVerificationCandidates();
  const floraDelivery = deliveryBatch.deliveryCandidates.filter((candidate) => (
    candidate.clientId === 'flora_and_fauna_foods_001'
    && !candidate.excluded
    && candidate.overallScore >= 6
    && candidate.sourceQuality !== 'low'
  ));
  const floraEnriched = enrichmentBatch.enrichedCandidates.filter((candidate) => candidate.clientId === 'flora_and_fauna_foods_001');

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPaths.summary, renderPilotSummary(generatedAt, floraDelivery, verificationCandidates, floraEnriched), 'utf8');
  fs.writeFileSync(outputPaths.offer, renderPilotOffer(), 'utf8');
  fs.writeFileSync(outputPaths.preview, renderCandidatePreview(verificationCandidates), 'utf8');
  fs.writeFileSync(outputPaths.process, renderVerificationProcess(), 'utf8');
  fs.writeFileSync(outputPaths.report, renderClientFacingReport(generatedAt, floraDelivery, verificationCandidates), 'utf8');

  return {
    generatedAt,
    outputPaths: Object.values(outputPaths).map((filePath) => path.relative(process.cwd(), filePath)),
    verificationCandidates: verificationCandidates.length,
    deliveryCandidates: floraDelivery.length,
  };
}

function readJson<T>(filePath: string): T {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required input not found: ${path.relative(process.cwd(), filePath)}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function readVerificationCandidates(): VerificationQueueItem[] {
  if (!fs.existsSync(verificationPath) || !fs.existsSync(verificationQueuePath)) {
    throw new Error('Verification outputs not found. Run npm run leads:verify first.');
  }
  const queueMarkdown = fs.readFileSync(verificationQueuePath, 'utf8');
  const blocks = queueMarkdown.split(/\n## \d+\. /).slice(1);
  return blocks.map((block, index) => {
    const title = firstLine(block);
    return {
      id: valueAfter(block, 'Verification ID') || `verification-${String(index + 1).padStart(4, '0')}`,
      clientId: 'flora_and_fauna_foods_001',
      clientName: 'Flora and Fauna Foods',
      vertical: 'catering_leads',
      url: valueAfter(block, 'URL'),
      title,
      snippet: '',
      estimatedLeadType: valueAfter(block, 'Estimated lead type'),
      estimatedLocation: valueAfter(block, 'Estimated location'),
      estimatedRecencyDays: numberOrNull(valueAfter(block, 'Estimated recency').replace(' days', '')),
      estimatedBudgetSignal: valueAfter(block, 'Budget signal'),
      sourceQuality: valueAfter(block, 'Source quality') === 'medium' ? 'medium' : 'high',
      overallScore: Number(valueAfter(block, 'Score')) || 0,
      deliveryQueue: 'interest_verification',
      suggestedMessage: valueAfter(block, 'Suggested soft intro'),
      salesContext: valueAfter(block, 'Sales context'),
      approvalStatus: 'pending_daniel_review',
      manualReviewRequired: true,
      notes: 'Pilot preview item. No contact data included.',
    };
  });
}

function renderPilotSummary(
  generatedAt: string,
  deliveryCandidates: DeliveryLeadCandidate[],
  verificationCandidates: VerificationQueueItem[],
  enrichedCandidates: Array<{ overallScore: number }>,
): string {
  return `# Flora and Fauna Foods Pilot Summary

Generated: ${generatedAt}

## Company

Flora and Fauna Foods

## Pilot Objective

Generate high-quality, recent, interest-verification candidates for:

- weddings
- corporate events
- private dinners
- charity events

## Target Region

- New York
- New Jersey
- Pennsylvania

## Services

- food service
- bar service
- rentals

## System Status

- discovery engine operational
- scoring operational
- verification preparation operational
- human approval workflow operational

## Current Metrics

- Delivery candidates: ${deliveryCandidates.length}
- Verification candidates: ${verificationCandidates.length}
- Average delivery score: ${average(deliveryCandidates.map((candidate) => candidate.overallScore)).toFixed(1)}
- Average enriched score: ${average(enrichedCandidates.map((candidate) => candidate.overallScore)).toFixed(1)}
- Top sources: ${topSources(deliveryCandidates).join(', ') || 'none'}

## Disclaimer

This pilot workflow still requires human review and approval before any lead contact. No outreach, contact extraction, scraping, browser automation, calls, emails, DMs, or forms are performed by this system.
`;
}

function renderPilotOffer(): string {
  return `# Pilot Offer - Flora and Fauna Foods

## Suggested Pilot

5-10 Interest-Verified Leads

## Definition

People willing to receive information and cold calls from Flora and Fauna Foods.

## Suggested Timeline

7-14 days

## Suggested Pilot Price

$300-$700

## Suggested Monthly Packages

- 20 verified leads/month
- 40 verified leads/month
- 75+ verified leads/month

## Important

There is no guarantee of closed sales. The goal is high-quality, high-intent opportunities that Flora and Fauna Foods can review and verify through a human-approved process.
`;
}

function renderCandidatePreview(candidates: VerificationQueueItem[]): string {
  const preview = candidates.slice(0, 10);
  return `# Candidate Preview

This preview includes up to 10 verification candidates. It intentionally excludes contact information and personal data.

| Source | Estimated event type | Estimated location | Lead tier | Overall score | Source quality | Verification status |
| --- | --- | --- | --- | ---: | --- | --- |
${preview.map((candidate) => `| ${cell(hostFor(candidate.url))} | ${cell(candidate.estimatedLeadType)} | ${cell(candidate.estimatedLocation)} | interest_verification | ${candidate.overallScore.toFixed(1)} | ${candidate.sourceQuality} | ${candidate.approvalStatus} |`).join('\n') || '| No candidates | Not available | Not available | Not available | 0.0 | Not available | Not available |'}

No contact information, emails, phone numbers, or private personal data are included.
`;
}

function renderVerificationProcess(): string {
  return `# Verification Process

## Workflow

Discovery
↓
Enrichment
↓
Quality filtering
↓
Verification preparation
↓
Daniel review
↓
Approval
↓
Human-approved verification
↓
Interest-Verified Lead
↓
Delivery to Flora

## Operating Rules

- No scraping
- No automated outreach
- No automatic messaging
- No contact extraction
- Human approval required before any contact

The system prepares evidence, scoring, context, and suggested soft introductions. Daniel reviews and approves before any human-led verification step.
`;
}

function renderClientFacingReport(
  generatedAt: string,
  deliveryCandidates: DeliveryLeadCandidate[],
  verificationCandidates: VerificationQueueItem[],
): string {
  return `# Flora and Fauna Foods Pilot Report

Generated: ${generatedAt}

## Executive Summary

The pilot system is designed to help Flora and Fauna Foods identify recent, relevant catering opportunities in New York, New Jersey, Pennsylvania, and the Tri-State area. It reduces manual searching by generating candidates, filtering duplicates, scoring fit, and preparing a review-ready verification queue.

## What Problem Is Solved

Finding high-intent catering opportunities manually is slow and inconsistent. This system creates a repeatable pipeline that surfaces candidate opportunities, scores them, and prepares the next review step without requiring Flora's team to search, clean, or organize lead lists manually.

## How The System Works

The system generates discovery queries, runs bounded public search, stores public result candidates, enriches them with deterministic rules, removes duplicates, filters weak results, and prepares a verification queue for human approval.

## Why Recency Matters

Recent intent signals are more likely to represent active event planning. The pilot prioritizes candidates with recency signals around upcoming events, planning windows, and current vendor needs.

## Why Intent Matters

The system prioritizes language and source context related to catering, weddings, corporate events, food service, bar service, rentals, and relevant locations. This helps focus review time on opportunities with a stronger fit.

## How Interest Verification Works

Interest verification is a human-approved step. The system prepares soft introduction language and sales context, but Daniel must approve each candidate before any manual contact. A lead becomes interest-verified only after the person or organization is willing to receive information from Flora and Fauna Foods.

## Expected Outcomes

- Delivery candidates currently available: ${deliveryCandidates.length}
- Interest verification candidates currently prepared: ${verificationCandidates.length}
- A practical pilot target of 5-10 interest-verified leads over 7-14 days
- A repeatable workflow that can support monthly packages after the pilot

## Next Steps

1. Review this pilot package.
2. Confirm the pilot definition and acceptance criteria.
3. Approve the verification workflow.
4. Run the 7-14 day pilot.
5. Review results and decide on monthly lead volume.

No closed-sale outcome is guaranteed. The pilot focuses on high-quality, high-intent opportunities and a controlled human-approved verification workflow.
`;
}

function firstLine(value: string): string {
  return value.split('\n')[0].trim();
}

function valueAfter(block: string, label: string): string {
  const pattern = new RegExp(`- ${label}: (.*)`);
  const match = pattern.exec(block);
  return match ? match[1].trim() : '';
}

function numberOrNull(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function topSources(candidates: DeliveryLeadCandidate[]): string[] {
  const counts = candidates.reduce<Record<string, number>>((acc, candidate) => {
    const host = hostFor(candidate.url);
    acc[host] = (acc[host] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 5)
    .map(([host, count]) => `${host} (${count})`);
}

function hostFor(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

function cell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

function main(): void {
  try {
    const result = generateFloraPilotPack();
    console.log(`Flora pilot package generated: ${result.outputPaths.join(', ')}`);
    console.log(`Verification candidates included: ${result.verificationCandidates}`);
    console.log('Client-facing package only. No outreach, contact extraction, scraping, browser automation, network requests, email, DM, calls, or forms were performed.');
  } catch (error) {
    console.error('Flora Pilot Pack: FAILED');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) main();
