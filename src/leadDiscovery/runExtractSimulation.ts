import fs = require('fs');
import path = require('path');
import { runtimeOutputPath } from '../runtimePaths';
import {
  evaluateTavilyExtractCandidate,
  tavilyExtractFutureIntegrationPath,
  tavilyExtractSafetyRules,
} from './tavilyExtractAdapter';
import { TavilyExtractInputCandidate, TavilyExtractSimulationResult } from './tavilyExtractTypes';

const outputDir = runtimeOutputPath('lead-discovery', 'extract');
const markdownPath = path.join(outputDir, 'extract-simulation.md');
const jsonPath = path.join(outputDir, 'extract-simulation.json');

export function runExtractSimulation(now = new Date()): TavilyExtractSimulationResult {
  const scenarios = mockCandidates().map(evaluateTavilyExtractCandidate);
  const allowedCount = scenarios.filter((scenario) => scenario.allowed).length;
  const blockedCount = scenarios.length - allowedCount;
  const result: TavilyExtractSimulationResult = {
    generatedAt: now.toISOString(),
    status: allowedCount === 3 && blockedCount === 3 ? 'pass' : 'fail',
    expectedAllowedCount: 3,
    expectedBlockedCount: 3,
    allowedCount,
    blockedCount,
    scenarios,
    safetyRules: tavilyExtractSafetyRules,
    futureIntegrationPath: tavilyExtractFutureIntegrationPath,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  fs.writeFileSync(markdownPath, renderMarkdown(result), 'utf8');
  return result;
}

function mockCandidates(): TavilyExtractInputCandidate[] {
  return [
    {
      candidateId: 'extract-sim-success-public-request',
      clientId: 'flora_and_fauna_foods_001',
      sourceUrl: 'https://community.example.com/events/need-catering-for-gala',
      sourceType: 'public_forum',
      title: 'Need catering recommendations for a nonprofit gala',
      snippet: 'Organizer is looking for catering quotes for 120 guests next month.',
      query: 'need catering recommendations gala',
      leadLikeClassification: 'lead_like',
      buyerSignals: ['looking for catering quotes', 'event date next month'],
      buyerSignalCount: 2,
      buyerSignalStrength: 'strong',
      riskLevel: 'low',
      relevance: 'relevant',
      sampleOnly: true,
    },
    {
      candidateId: 'extract-sim-blocked-vendor',
      clientId: 'flora_and_fauna_foods_001',
      sourceUrl: 'https://vendor.example.com/catering-platform/pricing',
      sourceType: 'vendor',
      title: 'Catering vendor platform pricing',
      snippet: 'Software vendor landing page for caterers.',
      query: 'catering vendor pricing',
      leadLikeClassification: 'possibly_lead_like',
      buyerSignals: ['pricing'],
      buyerSignalCount: 1,
      buyerSignalStrength: 'weak',
      riskLevel: 'medium',
      relevance: 'vendor',
      sampleOnly: true,
    },
    {
      candidateId: 'extract-sim-blocked-directory',
      clientId: 'flora_and_fauna_foods_001',
      sourceUrl: 'https://directory.example.com/new-york-caterers',
      sourceType: 'directory',
      title: 'Top New York caterers directory',
      snippet: 'Directory list of catering companies.',
      query: 'new york caterers',
      leadLikeClassification: 'directory',
      buyerSignals: [],
      buyerSignalCount: 0,
      riskLevel: 'low',
      relevance: 'directory',
      sampleOnly: true,
    },
    {
      candidateId: 'extract-sim-blocked-login',
      clientId: 'costa_retreats_001',
      sourceUrl: 'https://social.example.com/login/group-trip-request',
      sourceType: 'private_login',
      title: 'Group trip request behind login',
      snippet: 'Private social post requires authentication.',
      query: 'group trip costa rica retreat recommendation',
      leadLikeClassification: 'lead_like',
      buyerSignals: ['group trip request'],
      buyerSignalCount: 1,
      buyerSignalStrength: 'medium',
      riskLevel: 'high',
      requiresLogin: true,
      relevance: 'relevant',
      sampleOnly: true,
    },
    {
      candidateId: 'extract-sim-event-page',
      clientId: 'flora_and_fauna_foods_001',
      sourceUrl: 'https://events.example.org/spring-fundraiser-food-vendors',
      sourceType: 'public_event_board',
      title: 'Spring fundraiser accepting food vendor proposals',
      snippet: 'Public event page requests catering proposals for a fundraiser.',
      query: 'accepting catering proposals fundraiser',
      leadLikeClassification: 'lead_like',
      buyerSignals: ['accepting proposals', 'fundraiser catering'],
      buyerSignalCount: 2,
      buyerSignalStrength: 'strong',
      riskLevel: 'low',
      relevance: 'relevant',
      sampleOnly: true,
    },
    {
      candidateId: 'extract-sim-forum-page',
      clientId: 'costa_retreats_001',
      sourceUrl: 'https://forum.example.net/travel/family-looking-for-costa-rica-villa',
      sourceType: 'public_forum',
      title: 'Family looking for Costa Rica villa and itinerary help',
      snippet: 'Public forum thread asks for recommendations for a family reunion trip.',
      query: 'looking for costa rica villa itinerary help family reunion',
      leadLikeClassification: 'possibly_lead_like',
      buyerSignals: ['looking for villa', 'itinerary help', 'family reunion'],
      buyerSignalCount: 3,
      buyerSignalStrength: 'strong',
      riskLevel: 'low',
      relevance: 'relevant',
      sampleOnly: true,
    },
  ];
}

function renderMarkdown(result: TavilyExtractSimulationResult): string {
  return `# Tavily Extract Simulation

Generated: ${result.generatedAt}
Status: ${result.status.toUpperCase()}

## Summary

- Expected allowed: ${result.expectedAllowedCount}
- Actual allowed: ${result.allowedCount}
- Expected blocked: ${result.expectedBlockedCount}
- Actual blocked: ${result.blockedCount}
- Tavily credits used: 0

## Scenarios

| Scenario | Source type | Allowed | Blocked reason | Sample only | Expected value |
| --- | --- | --- | --- | --- | --- |
${result.scenarios.map((scenario) => `| ${scenario.candidateId} | ${scenario.sourceType} | ${scenario.allowed ? 'yes' : 'no'} | ${scenario.blockedReason ?? 'none'} | ${scenario.sampleOnly ? 'yes' : 'no'} | ${scenario.expectedExtractionValue} |`).join('\n')}

## Safety Rules

${result.safetyRules.map((rule) => `- ${rule}`).join('\n')}

## Future Integration Path

${result.futureIntegrationPath.map((step, index) => `${index + 1}. ${step}`).join('\n')}
`;
}

if (require.main === module) {
  const result = runExtractSimulation();
  console.log(`Extract simulation generated: ${path.relative(process.cwd(), markdownPath)}`);
  console.log(`Simulation status: ${result.status}`);
  console.log(`Allowed: ${result.allowedCount}; blocked: ${result.blockedCount}`);
  console.log('No Tavily Extract, provider, network, scraping, browser, login, contact extraction, or outreach ran.');
  if (result.status !== 'pass') process.exitCode = 1;
}
