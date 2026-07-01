import fs = require('fs');
import path = require('path');
import { runtimeRootPath } from '../runtimePaths';
import {
  TavilyBudgetDecision,
  TavilyBudgetHealth,
  TavilyCreditLedgerEntry,
  TavilyRunType,
  TavilySchedulePolicy,
} from './tavilyBudgetTypes';

const policyPath = path.join(process.cwd(), 'data', 'lead-discovery', 'tavily-budget', 'tavily-budget-policy.json');
export const tavilyCreditLedgerPath = runtimeRootPath('runtime', 'lead-discovery', 'tavily-credit-ledger.json');

const defaultPolicy: TavilySchedulePolicy = {
  monthlyCreditLimit: 1000,
  monthlyDiscoveryBudget: 780,
  monthlyReserveCredits: 200,
  emergencyBufferCredits: 20,
  maxCreditsPerRun: 60,
  maxSearchCreditsPerRun: 50,
  maxExtractCreditsPerRun: 8,
  allowedRunDays: ['Monday', 'Wednesday', 'Friday'],
  runFrequency: '3 days per week',
  defaultSearchDepth: 'basic',
  allowAdvancedSearch: false,
  allowCrawl: false,
  allowResearch: false,
  allowExtract: true,
  extractOnlyAfterCandidateFiltering: true,
};

export function loadTavilyBudgetPolicy(): TavilySchedulePolicy {
  if (!fs.existsSync(policyPath)) return { ...defaultPolicy };
  return {
    ...defaultPolicy,
    ...(JSON.parse(fs.readFileSync(policyPath, 'utf8')) as Partial<TavilySchedulePolicy>),
  };
}

export function estimateSearchCredits(queryCount: number, searchDepth: 'basic' | 'advanced' = 'basic'): number {
  return Math.max(0, queryCount) * (searchDepth === 'advanced' ? 2 : 1);
}

export function estimateExtractCredits(successfulUrlCount: number, mode: 'basic' | 'advanced' = 'basic'): number {
  if (successfulUrlCount <= 0) return 0;
  return Math.ceil(successfulUrlCount / 5) * (mode === 'advanced' ? 2 : 1);
}

export function estimateRunCredits(input: {
  searchQueryCount: number;
  successfulExtractUrlCount: number;
  searchDepth?: 'basic' | 'advanced';
  extractMode?: 'basic' | 'advanced';
}): { estimatedSearchCredits: number; estimatedExtractCredits: number; estimatedTotalCredits: number } {
  const estimatedSearchCredits = estimateSearchCredits(input.searchQueryCount, input.searchDepth ?? 'basic');
  const estimatedExtractCredits = estimateExtractCredits(input.successfulExtractUrlCount, input.extractMode ?? 'basic');
  return {
    estimatedSearchCredits,
    estimatedExtractCredits,
    estimatedTotalCredits: estimatedSearchCredits + estimatedExtractCredits,
  };
}

export function canRunToday(now = new Date(), policy = loadTavilyBudgetPolicy()): boolean {
  return policy.allowedRunDays.includes(dayNameFor(now));
}

export function shouldPauseDiscovery(now = new Date(), policy = loadTavilyBudgetPolicy()): boolean {
  return getBudgetDecision(now, policy).recommendedRunMode === 'paused';
}

export function getBudgetDecision(now = new Date(), policy = loadTavilyBudgetPolicy()): TavilyBudgetDecision {
  const currentEstimatedCreditsUsed = currentMonthLedger(now).reduce((sum, entry) => sum + entry.estimatedTotalCredits, 0);
  const currentEstimatedCreditsRemaining = Math.max(0, policy.monthlyCreditLimit - currentEstimatedCreditsUsed);
  const budgetHealth = budgetHealthFor(policy, currentEstimatedCreditsUsed, currentEstimatedCreditsRemaining);
  const allowedToday = canRunToday(now, policy);
  const recommendedRunMode = runModeFor(budgetHealth, allowedToday);
  const blockedReason = blockedReasonFor(budgetHealth, allowedToday);

  return {
    generatedAt: now.toISOString(),
    monthlyCreditLimit: policy.monthlyCreditLimit,
    monthlyDiscoveryBudget: policy.monthlyDiscoveryBudget,
    monthlyReserveCredits: policy.monthlyReserveCredits,
    emergencyBufferCredits: policy.emergencyBufferCredits,
    currentEstimatedCreditsUsed,
    currentEstimatedCreditsRemaining,
    budgetHealth,
    maxCreditsPerRun: policy.maxCreditsPerRun,
    maxSearchCreditsPerRun: policy.maxSearchCreditsPerRun,
    maxExtractCreditsPerRun: policy.maxExtractCreditsPerRun,
    defaultSearchDepth: policy.defaultSearchDepth,
    allowAdvancedSearch: policy.allowAdvancedSearch,
    allowCrawl: policy.allowCrawl,
    allowResearch: policy.allowResearch,
    allowExtract: policy.allowExtract,
    extractOnlyAfterCandidateFiltering: policy.extractOnlyAfterCandidateFiltering,
    allowedRunDays: policy.allowedRunDays,
    runFrequency: policy.runFrequency,
    today: localDateFor(now),
    todayDayName: dayNameFor(now),
    allowedToday,
    nextAllowedRunDay: nextAllowedRunDay(now, policy),
    recommendedRunMode,
    shouldPause: recommendedRunMode === 'paused',
    blockedReason,
    safeCommandRecommendation: blockedReason
      ? 'Run offline planning, budget, dashboard, simulation, and review commands only.'
      : 'Run scheduled discovery only after human approval and within query allocation limits.',
  };
}

export function recordEstimatedCreditUsage(input: {
  command: string;
  estimatedSearchCredits: number;
  estimatedExtractCredits: number;
  clientId: string;
  runType: TavilyRunType;
  notes: string;
  date?: string;
}): TavilyCreditLedgerEntry[] {
  const entry: TavilyCreditLedgerEntry = {
    date: input.date ?? new Date().toISOString(),
    command: input.command,
    estimatedSearchCredits: input.estimatedSearchCredits,
    estimatedExtractCredits: input.estimatedExtractCredits,
    estimatedTotalCredits: input.estimatedSearchCredits + input.estimatedExtractCredits,
    clientId: input.clientId,
    runType: input.runType,
    notes: input.notes,
  };
  const entries = [...readLedger(), entry];
  fs.mkdirSync(path.dirname(tavilyCreditLedgerPath), { recursive: true });
  fs.writeFileSync(tavilyCreditLedgerPath, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
  return entries;
}

function budgetHealthFor(policy: TavilySchedulePolicy, used: number, remaining: number): TavilyBudgetHealth {
  const reserveFloor = policy.monthlyReserveCredits + policy.emergencyBufferCredits;
  if (remaining <= policy.emergencyBufferCredits || used >= policy.monthlyCreditLimit - policy.emergencyBufferCredits) return 'paused';
  if (remaining <= reserveFloor || used >= policy.monthlyDiscoveryBudget) return 'critical';
  if (remaining <= reserveFloor + policy.maxCreditsPerRun * 2 || used >= Math.floor(policy.monthlyDiscoveryBudget * 0.75)) return 'warning';
  return 'healthy';
}

function runModeFor(health: TavilyBudgetHealth, allowedToday: boolean): TavilyBudgetDecision['recommendedRunMode'] {
  if (health === 'paused') return 'paused';
  if (!allowedToday) return health === 'critical' ? 'extract_only' : 'offline_only';
  if (health === 'healthy') return 'full_scheduled_run';
  if (health === 'warning') return 'reduced_run';
  return 'extract_only';
}

function blockedReasonFor(health: TavilyBudgetHealth, allowedToday: boolean): string | null {
  if (health === 'paused') return 'monthly_credit_emergency_buffer_reached';
  if (!allowedToday) return 'outside_monday_wednesday_friday_schedule';
  if (health === 'critical') return 'critical_budget_health_extract_or_flora_only';
  return null;
}

function currentMonthLedger(now: Date): TavilyCreditLedgerEntry[] {
  const month = now.toISOString().slice(0, 7);
  return readLedger().filter((entry) => entry.date.slice(0, 7) === month);
}

function readLedger(): TavilyCreditLedgerEntry[] {
  if (!fs.existsSync(tavilyCreditLedgerPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(tavilyCreditLedgerPath, 'utf8')) as TavilyCreditLedgerEntry[];
  } catch {
    return [];
  }
}

function dayNameFor(date: Date): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
}

function nextAllowedRunDay(now: Date, policy: TavilySchedulePolicy): string {
  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + offset);
    const dayName = dayNameFor(candidate);
    if (policy.allowedRunDays.includes(dayName)) {
      return offset === 0 ? `${dayName} (today)` : `${dayName} (${localDateFor(candidate)})`;
    }
  }
  return 'No allowed run day configured';
}

function localDateFor(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
