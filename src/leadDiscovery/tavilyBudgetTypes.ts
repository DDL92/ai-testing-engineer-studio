export type TavilyBudgetHealth = 'healthy' | 'warning' | 'critical' | 'paused';

export type TavilyRunMode =
  | 'full_scheduled_run'
  | 'reduced_run'
  | 'extract_only'
  | 'offline_only'
  | 'paused';

export type TavilyRunType = 'scheduled_discovery' | 'manual_check' | 'extract' | 'retry' | 'debug';

export type TavilySearchDepth = 'basic' | 'advanced';

export interface TavilyCreditBudget {
  monthlyCreditLimit: number;
  monthlyDiscoveryBudget: number;
  monthlyReserveCredits: number;
  emergencyBufferCredits: number;
  currentEstimatedCreditsUsed: number;
  currentEstimatedCreditsRemaining: number;
  budgetHealth: TavilyBudgetHealth;
}

export interface TavilyRunBudget {
  maxCreditsPerRun: number;
  maxSearchCreditsPerRun: number;
  maxExtractCreditsPerRun: number;
  defaultSearchDepth: TavilySearchDepth;
  allowAdvancedSearch: boolean;
  allowCrawl: boolean;
  allowResearch: boolean;
  allowExtract: boolean;
  extractOnlyAfterCandidateFiltering: boolean;
}

export interface TavilySchedulePolicy {
  monthlyCreditLimit: number;
  monthlyDiscoveryBudget: number;
  monthlyReserveCredits: number;
  emergencyBufferCredits: number;
  maxCreditsPerRun: number;
  maxSearchCreditsPerRun: number;
  maxExtractCreditsPerRun: number;
  allowedRunDays: string[];
  runFrequency: string;
  defaultSearchDepth: TavilySearchDepth;
  allowAdvancedSearch: boolean;
  allowCrawl: boolean;
  allowResearch: boolean;
  allowExtract: boolean;
  extractOnlyAfterCandidateFiltering: boolean;
}

export interface TavilyBudgetDecision extends TavilyCreditBudget, TavilyRunBudget {
  generatedAt: string;
  allowedRunDays: string[];
  runFrequency: string;
  today: string;
  todayDayName: string;
  allowedToday: boolean;
  nextAllowedRunDay: string;
  recommendedRunMode: TavilyRunMode;
  shouldPause: boolean;
  blockedReason: string | null;
  safeCommandRecommendation: string;
}

export interface TavilyCreditLedgerEntry {
  date: string;
  command: string;
  estimatedSearchCredits: number;
  estimatedExtractCredits: number;
  estimatedTotalCredits: number;
  clientId: string;
  runType: TavilyRunType;
  notes: string;
}

export interface TavilyQueryAllocationClient {
  clientId: string;
  clientName: string;
  priority: number;
  searchCredits: number;
  notes: string;
}

export interface TavilyQueryAllocation {
  generatedAt: string;
  budgetHealth: TavilyBudgetHealth;
  recommendedRunMode: TavilyRunMode;
  allowedToday: boolean;
  nextAllowedRunDay: string;
  maxCreditsPerRun: number;
  totalSearchCredits: number;
  extractCredits: number;
  bufferCredits: number;
  estimatedTotalCredits: number;
  clients: TavilyQueryAllocationClient[];
  safetyRules: string[];
}
