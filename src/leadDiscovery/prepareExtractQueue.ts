import fs = require('fs');
import path = require('path');
import { runtimeOutputPath } from '../runtimePaths';
import { SearchCandidate, SearchCandidateBatch } from './searchCandidateTypes';
import {
  evaluateTavilyExtractCandidate,
  getTavilyExtractAdapterStatus,
  tavilyExtractFutureIntegrationPath,
  tavilyExtractSafetyRules,
} from './tavilyExtractAdapter';
import {
  TavilyExtractInputCandidate,
  TavilyExtractQueueBatch,
  TavilyExtractSourceType,
} from './tavilyExtractTypes';

const searchCandidatesPath = runtimeOutputPath('lead-discovery', 'search-candidates', 'search-candidates.json');
const outputDir = runtimeOutputPath('lead-discovery', 'extract');
const markdownPath = path.join(outputDir, 'extract-queue.md');
const jsonPath = path.join(outputDir, 'extract-queue.json');

export function prepareExtractQueue(now = new Date()): TavilyExtractQueueBatch {
  const sourceCandidates = readSearchCandidates().candidates;
  const reviewed = sourceCandidates.map(toExtractInput);
  const candidates = reviewed.map(evaluateTavilyExtractCandidate);
  const allowedCount = candidates.filter((candidate) => candidate.allowed).length;
  const batch: TavilyExtractQueueBatch = {
    generatedAt: now.toISOString(),
    adapterStatus: getTavilyExtractAdapterStatus(),
    totalCandidatesReviewed: sourceCandidates.length,
    queueCount: allowedCount,
    allowedCount,
    blockedCount: candidates.length - allowedCount,
    candidates,
    safetyRules: tavilyExtractSafetyRules,
    futureIntegrationPath: tavilyExtractFutureIntegrationPath,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify(batch, null, 2)}\n`, 'utf8');
  fs.writeFileSync(markdownPath, renderMarkdown(batch), 'utf8');
  return batch;
}

function readSearchCandidates(): SearchCandidateBatch {
  if (!fs.existsSync(searchCandidatesPath)) {
    return {
      generatedAt: new Date().toISOString(),
      maxQueriesPerClient: 0,
      maxCandidatesPerQuery: 0,
      totalClients: 0,
      totalQueriesExecuted: 0,
      totalCandidates: 0,
      candidates: [],
      sourceResults: [],
      safetyRules: [],
    };
  }
  return JSON.parse(fs.readFileSync(searchCandidatesPath, 'utf8')) as SearchCandidateBatch;
}

function toExtractInput(candidate: SearchCandidate): TavilyExtractInputCandidate {
  return {
    candidateId: candidate.id,
    clientId: candidate.clientId,
    clientName: candidate.clientName,
    vertical: candidate.vertical,
    sourceUrl: candidate.url,
    sourceType: sourceTypeFor(candidate),
    title: candidate.title,
    snippet: candidate.snippet,
    query: candidate.query,
    leadLikeClassification: candidate.leadLikeClassification,
    buyerSignals: candidate.buyerSignals,
    buyerSignalCount: candidate.buyerSignalCount,
    buyerSignalStrength: candidate.buyerSignalStrength,
    riskLevel: candidate.riskLevel,
    requiresLogin: candidate.manualReviewRequired && loginLikeUrl(candidate.url),
    contactExtractionNeeded: false,
    relevance: relevanceFor(candidate),
    sampleOnly: false,
  };
}

function sourceTypeFor(candidate: SearchCandidate): TavilyExtractSourceType {
  if (candidate.leadLikeClassification === 'directory') return 'directory';
  if (candidate.leadLikeClassification === 'article') return 'article';
  if (candidate.sourceCategory === 'public_directory') return 'directory';
  if (candidate.sourceCategory === 'public_job_board') return 'job_post';
  if (vendorLike(candidate)) return 'vendor';
  if (staffingLike(candidate)) return 'staffing';
  return candidate.sourceCategory;
}

function relevanceFor(candidate: SearchCandidate): TavilyExtractInputCandidate['relevance'] {
  if (candidate.leadLikeClassification === 'directory') return 'directory';
  if (candidate.leadLikeClassification === 'article') return 'article';
  if (candidate.sourceCategory === 'public_job_board') return 'job_post';
  if (vendorLike(candidate)) return 'vendor';
  if (staffingLike(candidate)) return 'staffing';
  if (!['lead_like', 'possibly_lead_like'].includes(candidate.leadLikeClassification)) return 'low';
  return 'relevant';
}

function vendorLike(candidate: SearchCandidate): boolean {
  const text = normalizedText(candidate);
  return text.includes('vendor directory') || text.includes('top vendors') || text.includes('best vendors') || text.includes('pricing page');
}

function staffingLike(candidate: SearchCandidate): boolean {
  const text = normalizedText(candidate);
  return text.includes('hiring') || text.includes('job post') || text.includes('staffing') || text.includes('recruiting');
}

function loginLikeUrl(rawUrl: string): boolean {
  return rawUrl.toLowerCase().includes('/login') || rawUrl.toLowerCase().includes('/signin');
}

function normalizedText(candidate: SearchCandidate): string {
  return `${candidate.url} ${candidate.title} ${candidate.snippet} ${candidate.query}`.toLowerCase();
}

function renderMarkdown(batch: TavilyExtractQueueBatch): string {
  return `# Tavily Extract Queue

Generated: ${batch.generatedAt}

## Summary

- Adapter status: ${batch.adapterStatus.status}
- Live extraction enabled: ${batch.adapterStatus.liveExtractionEnabled ? 'yes' : 'no'}
- Provider calls allowed: ${batch.adapterStatus.providerCallsAllowed ? 'yes' : 'no'}
- Network calls allowed: ${batch.adapterStatus.networkCallsAllowed ? 'yes' : 'no'}
- Tavily credits used: ${batch.adapterStatus.creditsUsed}
- Search candidates reviewed: ${batch.totalCandidatesReviewed}
- Queue count: ${batch.queueCount}
- Allowed extraction candidates: ${batch.allowedCount}
- Blocked extraction candidates: ${batch.blockedCount}

## Queue

| Candidate | Client | Source type | Allowed | Risk | Blocked reason | Expected value |
| --- | --- | --- | --- | --- | --- | --- |
${batch.candidates.map((candidate) => `| ${candidate.candidateId} | ${candidate.clientId} | ${candidate.sourceType} | ${candidate.allowed ? 'yes' : 'no'} | ${candidate.riskLevel} | ${candidate.blockedReason ?? 'none'} | ${candidate.expectedExtractionValue} |`).join('\n') || '| none | none | none | no | low | no candidates reviewed | none |'}

## Safe Extraction Policy

${batch.safetyRules.map((rule) => `- ${rule}`).join('\n')}

## Future Integration Path

${batch.futureIntegrationPath.map((step, index) => `${index + 1}. ${step}`).join('\n')}
`;
}

if (require.main === module) {
  const batch = prepareExtractQueue();
  console.log(`Extract queue generated: ${path.relative(process.cwd(), markdownPath)}`);
  console.log(`Allowed extraction candidates: ${batch.allowedCount}`);
  console.log(`Blocked extraction candidates: ${batch.blockedCount}`);
  console.log('No Tavily Extract, provider, network, scraping, browser, login, contact extraction, or outreach ran.');
}
