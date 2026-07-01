import fs = require('fs');
import path = require('path');
import { runtimeOutputPath } from '../runtimePaths';
import { getBudgetDecision, loadTavilyBudgetPolicy } from './tavilyBudgetManager';
import { TavilyBudgetDecision } from './tavilyBudgetTypes';

const outputDir = runtimeOutputPath('lead-discovery', 'tavily-budget');
const markdownPath = path.join(outputDir, 'tavily-budget-plan.md');
const jsonPath = path.join(outputDir, 'tavily-budget-plan.json');

const safetyRules = [
  'Budget planning is local only: no Tavily calls, providers, network requests, scraping, browser automation, contact extraction, or outreach are used.',
  'Live discovery remains limited to Monday, Wednesday, and Friday after human approval.',
  'Advanced search, crawl, and research remain disabled to protect the monthly free-tier credit budget.',
  'Extract is allowed only after candidate filtering and within the extract budget.',
];

export function generateTavilyBudgetPlan(now = new Date()): TavilyBudgetDecision {
  const decision = getBudgetDecision(now, loadTavilyBudgetPolicy());
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify({ ...decision, safetyRules }, null, 2)}\n`, 'utf8');
  fs.writeFileSync(markdownPath, renderMarkdown(decision), 'utf8');
  return decision;
}

function renderMarkdown(decision: TavilyBudgetDecision): string {
  return `# Tavily Monthly Budget Plan

Generated: ${decision.generatedAt}

## Budget

- Monthly credit limit: ${decision.monthlyCreditLimit}
- Monthly discovery budget: ${decision.monthlyDiscoveryBudget}
- Monthly reserve credits: ${decision.monthlyReserveCredits}
- Emergency buffer credits: ${decision.emergencyBufferCredits}
- Estimated credits used this month: ${decision.currentEstimatedCreditsUsed}
- Estimated credits remaining this month: ${decision.currentEstimatedCreditsRemaining}
- Current budget health: ${decision.budgetHealth}

## Schedule

- Allowed run days: ${decision.allowedRunDays.join(', ')}
- Run frequency: ${decision.runFrequency}
- Today: ${decision.todayDayName} (${decision.today})
- Today is allowed: ${decision.allowedToday ? 'yes' : 'no'}
- Next allowed run day: ${decision.nextAllowedRunDay}

## Run Limits

- Max credits per run: ${decision.maxCreditsPerRun}
- Max search credits per run: ${decision.maxSearchCreditsPerRun}
- Max extract credits per run: ${decision.maxExtractCreditsPerRun}
- Default search depth: ${decision.defaultSearchDepth}
- Advanced search allowed: ${decision.allowAdvancedSearch ? 'yes' : 'no'}
- Crawl allowed: ${decision.allowCrawl ? 'yes' : 'no'}
- Research allowed: ${decision.allowResearch ? 'yes' : 'no'}
- Extract allowed: ${decision.allowExtract ? 'yes' : 'no'}
- Extract only after candidate filtering: ${decision.extractOnlyAfterCandidateFiltering ? 'yes' : 'no'}

## Decision

- Recommended run mode: ${decision.recommendedRunMode}
- Should pause discovery: ${decision.shouldPause ? 'yes' : 'no'}
- Blocked reason: ${decision.blockedReason ?? 'none'}
- Safe command recommendation: ${decision.safeCommandRecommendation}

## Safety Rules

${safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

if (require.main === module) {
  const decision = generateTavilyBudgetPlan();
  console.log(`Tavily budget plan generated: ${path.relative(process.cwd(), markdownPath)}, ${path.relative(process.cwd(), jsonPath)}`);
  console.log(`Budget health: ${decision.budgetHealth}`);
  console.log(`Recommended mode: ${decision.recommendedRunMode}`);
  console.log('Budget plan only. No Tavily, provider, network, scraping, browser, contact extraction, or outreach ran.');
}
