import { Lead } from '../leads/types';

export type FinanceOfferType =
  | 'qa-audit'
  | 'playwright-starter-pack'
  | 'qa-automation-retainer';

export type FinanceRevenueStatus =
  | 'planned'
  | 'proposed'
  | 'booked'
  | 'received'
  | 'cancelled';

export type FinanceForecastScenarioName = 'Conservative' | 'Base Case' | 'Aggressive';

export interface CurrencyRange {
  min: number;
  max: number;
}

export interface FinanceTargets {
  targetMrr: number;
  nextTargetMrr: number;
  longTermTargetMrr: number;
  monthlyPersonalLivingCost: CurrencyRange;
  preferredClientModel: string;
  surfTrainLiveTargetFund: number;
}

export interface FinanceCostProfile {
  monthlyOperatingCost: number;
  currentSavings: number;
}

export interface FinanceRevenueActivity {
  id: string;
  clientName: string;
  offerType: FinanceOfferType;
  status: FinanceRevenueStatus;
  amount: number;
  monthlyAmount: number;
  bookedDate: string;
  notes: string;
}

export interface FinanceData {
  schemaVersion: number;
  updatedAt: string;
  targets: FinanceTargets;
  costProfile: FinanceCostProfile;
  revenueActivity: FinanceRevenueActivity[];
}

export interface FinanceInput {
  generatedAt: string;
  month: string;
  financeData: FinanceData;
  leads: Lead[];
}

export interface FinanceCandidate {
  companyName: string;
  offerType: FinanceOfferType;
  score: number;
  status: string;
  nextAction: string;
  estimatedValue: CurrencyRange;
  cadence: 'one-time' | 'monthly';
}

export interface FinanceForecastScenario {
  scenario: FinanceForecastScenarioName;
  assumptions: string[];
  oneTimeRevenue: CurrencyRange;
  addedMrr: CurrencyRange;
  projectedMonthlyRevenue: CurrencyRange;
  projectedNetProfitAfterOperatingCost: CurrencyRange;
  projectedSavingsAfterOneMonth: CurrencyRange;
  note: string;
}

export interface FinanceReport {
  generatedAt: string;
  month: string;
  targets: FinanceTargets;
  costProfile: FinanceCostProfile;
  revenueActivity: FinanceRevenueActivity[];
  countedRevenueActivity: FinanceRevenueActivity[];
  currentMrr: number;
  targetMrrProgressPercent: number;
  nextTargetMrrProgressPercent: number;
  longTermTargetMrrProgressPercent: number;
  auditRevenue: number;
  starterPackRevenue: number;
  retainerRevenue: number;
  projectedMonthlyRevenue: number;
  monthlyOperatingCost: number;
  netMonthlyProfit: number;
  savings: number;
  savingsGap: number;
  retainerCandidates: FinanceCandidate[];
  auditCandidates: FinanceCandidate[];
  starterPackCandidates: FinanceCandidate[];
  bestRevenueOpportunity?: FinanceCandidate;
  forecastScenarios: FinanceForecastScenario[];
  warnings: string[];
}
