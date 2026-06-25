import fs = require('fs');
import path = require('path');
import { CostBudget, CostBudgetUpdate, defaultCostBudget } from './costBudgetTypes';

export const costBudgetPath = path.join(process.cwd(), 'runtime', 'lead-discovery', 'cost-budget.json');

export function loadCostBudget(): CostBudget {
  if (!fs.existsSync(costBudgetPath)) return { ...defaultCostBudget };
  try {
    return { ...defaultCostBudget, ...(JSON.parse(fs.readFileSync(costBudgetPath, 'utf8')) as Partial<CostBudget>) };
  } catch {
    return { ...defaultCostBudget };
  }
}

export function updateCostBudget(update: CostBudgetUpdate, existing = loadCostBudget()): CostBudget {
  const nextBase = {
    ...existing,
    ...update,
    generatedAt: new Date().toISOString(),
  };
  const costHealth = costHealthFor(nextBase);
  const next: CostBudget = {
    ...nextBase,
    costHealth,
    reduceQueryBatches: costHealth === 'warning' || costHealth === 'critical' || costHealth === 'paused',
    disableDynamicQueries: costHealth === 'critical' || costHealth === 'paused',
    disableExternalSearch: costHealth === 'paused',
  };
  fs.mkdirSync(path.dirname(costBudgetPath), { recursive: true });
  fs.writeFileSync(costBudgetPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  return next;
}

export function isBudgetExceeded(budget = loadCostBudget()): boolean {
  return budget.costHealth === 'critical' || budget.costHealth === 'paused' || budget.estimatedCreditsUsed >= budget.dailyBudget || budget.estimatedCreditsUsed >= budget.monthlyBudget;
}

export function shouldReduceSearchVolume(budget = loadCostBudget()): boolean {
  return budget.reduceQueryBatches || budget.disableDynamicQueries || budget.disableExternalSearch;
}

function costHealthFor(budget: Omit<CostBudget, 'costHealth' | 'reduceQueryBatches' | 'disableDynamicQueries' | 'disableExternalSearch'>) {
  if (budget.estimatedCreditsRemaining <= 0 || budget.dailyBudget <= 0 || budget.monthlyBudget <= 0) return 'paused';
  if (budget.estimatedCreditsUsed >= budget.dailyBudget || budget.estimatedCreditsUsed >= budget.monthlyBudget) return 'paused';
  const dailyRatio = budget.dailyBudget === 0 ? 1 : budget.estimatedCreditsUsed / budget.dailyBudget;
  const remainingRatio = budget.monthlyBudget === 0 ? 0 : budget.estimatedCreditsRemaining / budget.monthlyBudget;
  if (dailyRatio >= 0.9 || remainingRatio <= 0.05) return 'critical';
  if (dailyRatio >= 0.7 || remainingRatio <= 0.2) return 'warning';
  return 'healthy';
}

function main(): void {
  const budget = updateCostBudget({});
  console.log(`Cost budget available: ${path.relative(process.cwd(), costBudgetPath)}`);
  console.log(`Cost health: ${budget.costHealth}`);
}

if (require.main === module) main();
