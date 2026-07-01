import fs = require('fs');
import path = require('path');
import { runtimeOutputPath } from '../runtimePaths';
import { getBudgetDecision } from './tavilyBudgetManager';
import { TavilyQueryAllocation, TavilyQueryAllocationClient } from './tavilyBudgetTypes';
import { SourceQualityV2BudgetRecommendations } from './sourceQualityV2Types';

const outputDir = runtimeOutputPath('lead-discovery', 'tavily-budget');
const markdownPath = path.join(outputDir, 'query-allocation.md');
const jsonPath = path.join(outputDir, 'query-allocation.json');
const sourceQualityBudgetPath = runtimeOutputPath('lead-discovery', 'source-quality-v2', 'budget-recommendations.json');

const safetyRules = [
  'Query allocation is a local plan only and does not run Tavily Search or Extract.',
  'Use basic search only; advanced search, crawl, and research are disabled.',
  'Extract credits are reserved only for filtered high-value candidates.',
  'Human approval is required before any live Tavily run.',
];

export function generateTavilyQueryAllocation(now = new Date()): TavilyQueryAllocation {
  const decision = getBudgetDecision(now);
  const sourceQuality = readSourceQualityBudgetRecommendations();
  const clients = applySourceQualityWeights(clientAllocationsFor(decision.budgetHealth), sourceQuality);
  const extractCredits = extractCreditsFor(decision.budgetHealth);
  const bufferCredits = bufferCreditsFor(decision.budgetHealth);
  const totalSearchCredits = clients.reduce((sum, client) => sum + client.searchCredits, 0);
  const allocation: TavilyQueryAllocation = {
    generatedAt: now.toISOString(),
    budgetHealth: decision.budgetHealth,
    recommendedRunMode: decision.recommendedRunMode,
    allowedToday: decision.allowedToday,
    nextAllowedRunDay: decision.nextAllowedRunDay,
    maxCreditsPerRun: decision.maxCreditsPerRun,
    totalSearchCredits,
    extractCredits,
    bufferCredits,
    estimatedTotalCredits: totalSearchCredits + extractCredits + bufferCredits,
    sourceQualityV2Applied: Boolean(sourceQuality),
    sourceQualityV2NextAction: sourceQuality?.nextBudgetAction ?? 'No Source Quality v2 recommendations found; using default allocation.',
    clients,
    safetyRules,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify(allocation, null, 2)}\n`, 'utf8');
  fs.writeFileSync(markdownPath, renderMarkdown(allocation), 'utf8');
  return allocation;
}

function readSourceQualityBudgetRecommendations(): SourceQualityV2BudgetRecommendations | null {
  if (!fs.existsSync(sourceQualityBudgetPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(sourceQualityBudgetPath, 'utf8')) as SourceQualityV2BudgetRecommendations;
  } catch {
    return null;
  }
}

function applySourceQualityWeights(
  clients: TavilyQueryAllocationClient[],
  recommendations: SourceQualityV2BudgetRecommendations | null,
): TavilyQueryAllocationClient[] {
  if (!recommendations) return clients;
  const byClient = new Map(recommendations.clientAllocations.map((allocation) => [allocation.clientId, allocation]));
  return clients.map((clientRow) => {
    const allocation = byClient.get(clientRow.clientId);
    if (!allocation) return clientRow;
    return {
      ...clientRow,
      notes: `${clientRow.notes} Source Quality v2 mix available: ${allocation.allocation.map((row) => `${row.bucket} ${row.percentage}% ${row.sourceQualitySignal}`).join('; ')}.`,
      budgetWeights: allocation.allocation.map((row) => ({
        bucket: row.bucket,
        percentage: row.percentage,
        sourceQualitySignal: row.sourceQualitySignal,
      })),
    };
  });
}

function clientAllocationsFor(health: string): TavilyQueryAllocationClient[] {
  if (health === 'paused') return [];
  if (health === 'critical') {
    return [{
      clientId: 'flora_and_fauna_foods_001',
      clientName: 'Flora and Fauna Foods',
      priority: 1,
      searchCredits: 15,
      notes: 'Critical budget: Flora only, basic search max 15 credits.',
    }];
  }
  if (health === 'warning') {
    return [
      client('flora_and_fauna_foods_001', 'Flora and Fauna Foods', 1, 25),
      client('lzt_costa_rica_001', 'LZT Costa Rica', 2, 5),
      client('costa_retreats_001', 'Costa Retreats', 3, 5),
    ];
  }
  return [
    client('flora_and_fauna_foods_001', 'Flora and Fauna Foods', 1, 35),
    client('lzt_costa_rica_001', 'LZT Costa Rica', 2, 8),
    client('costa_retreats_001', 'Costa Retreats', 3, 7),
  ];
}

function client(clientId: string, clientName: string, priority: number, searchCredits: number): TavilyQueryAllocationClient {
  return {
    clientId,
    clientName,
    priority,
    searchCredits,
    notes: 'Basic search query allocation; one query equals one estimated credit.',
  };
}

function extractCreditsFor(health: string): number {
  if (health === 'healthy') return 8;
  if (health === 'warning') return 4;
  return 0;
}

function bufferCreditsFor(health: string): number {
  if (health === 'healthy') return 2;
  if (health === 'warning') return 1;
  return 0;
}

function renderMarkdown(allocation: TavilyQueryAllocation): string {
  return `# Tavily Query Allocation

Generated: ${allocation.generatedAt}

## Summary

- Budget health: ${allocation.budgetHealth}
- Recommended run mode: ${allocation.recommendedRunMode}
- Allowed today: ${allocation.allowedToday ? 'yes' : 'no'}
- Next allowed run day: ${allocation.nextAllowedRunDay}
- Max credits per run: ${allocation.maxCreditsPerRun}
- Total search credits: ${allocation.totalSearchCredits}
- Extract credits: ${allocation.extractCredits}
- Buffer credits: ${allocation.bufferCredits}
- Estimated total credits: ${allocation.estimatedTotalCredits}
- Source Quality v2 applied: ${allocation.sourceQualityV2Applied ? 'yes' : 'no'}
- Source Quality v2 next action: ${allocation.sourceQualityV2NextAction}

## Client Allocation

| Priority | Client | Search credits | Notes |
| ---: | --- | ---: | --- |
${allocation.clients.map((clientRow) => `| ${clientRow.priority} | ${clientRow.clientName} | ${clientRow.searchCredits} | ${clientRow.notes} |`).join('\n') || '| 0 | none | 0 | Paused: no external search. |'}

## Source Quality v2 Budget Mix

${allocation.clients.map((clientRow) => `### ${clientRow.clientName}
${clientRow.budgetWeights?.map((weight) => `- ${weight.bucket}: ${weight.percentage}% (${weight.sourceQualitySignal})`).join('\n') || '- Source Quality v2 not available for this client.'}`).join('\n\n') || '- None.'}

## Safety Rules

${allocation.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

if (require.main === module) {
  const allocation = generateTavilyQueryAllocation();
  console.log(`Tavily query allocation generated: ${path.relative(process.cwd(), markdownPath)}, ${path.relative(process.cwd(), jsonPath)}`);
  console.log(`Estimated total credits: ${allocation.estimatedTotalCredits}`);
  console.log(`Recommended mode: ${allocation.recommendedRunMode}`);
  console.log('Query allocation only. No Tavily, provider, network, scraping, browser, contact extraction, or outreach ran.');
}
