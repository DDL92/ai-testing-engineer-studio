import { Client } from '../clientReports/types';
import { ContactReviewRecord } from '../contactReview/types';
import { Lead, RecommendedOffer } from '../leads/types';

export type ProbabilityBand = 'High probability' | 'Medium probability' | 'Low probability';
export type ForecastScenarioName = 'conservative' | 'expected' | 'aggressive';
export type ForecastWindowLabel = '30 days' | '60 days' | '90 days' | '180 days' | '12 months';

export interface CurrencyRange {
  min: number;
  max: number;
  cadence: 'one-time' | 'monthly';
}

export interface RevenueContextSource {
  label: string;
  path: string;
  exists: boolean;
  excerpt: string;
}

export interface RevenueArtifacts {
  researchPack: boolean;
  leadPack: boolean;
  auditPack: boolean;
  outreachPack: boolean;
  topOutreach: boolean;
  contactReview: boolean;
  sow: boolean;
  clientWorkflow: boolean;
}

export interface RevenueCommandCenterInput {
  generatedAt: string;
  today: string;
  leads: Lead[];
  clients: Client[];
  contactReviews: ContactReviewRecord[];
  contextSources: RevenueContextSource[];
}

export interface RevenuePriorityOpportunity {
  lead: Lead;
  contactReview?: ContactReviewRecord;
  artifacts: RevenueArtifacts;
  revenuePriorityScore: number;
  probability: ProbabilityBand;
  recommendedOffer: RecommendedOffer;
  estimatedAuditValueRange: CurrencyRange;
  estimatedMonthlyRange: CurrencyRange;
  reason: string;
  scoreReasons: string[];
  nextAction: string;
  suggestedCommand: string;
}

export interface RetainerOpportunity {
  company: string;
  retainerType: 'QA Automation Retainer' | 'Agency Partner Retainer';
  estimatedMonthlyRange: CurrencyRange;
  priority: ProbabilityBand;
  whyItMayFit: string;
  nextAction: string;
  suggestedCommand: string;
  revenuePriorityScore: number;
}

export interface RenewalOpportunity {
  client: Client;
  monthlyFee: number;
  priority: ProbabilityBand;
  reason: string;
  nextAction: string;
  suggestedCommand: string;
}

export interface ExpansionOpportunity {
  client: Client;
  estimatedMonthlyRange: CurrencyRange;
  priority: ProbabilityBand;
  reason: string;
  nextAction: string;
  suggestedCommand: string;
}

export interface ForecastScenario {
  scenario: ForecastScenarioName;
  window: ForecastWindowLabel;
  bookedMrr: number;
  estimatedPipelinePotential: CurrencyRange;
  speculativeAdditionalMrr: CurrencyRange;
  speculativeProjectedMrr: CurrencyRange;
  conversionCount: number;
  notes: string[];
}

export interface RevenueAction {
  priority: number;
  title: string;
  reason: string;
  suggestedCommand: string;
}

export interface PropertyProgressScenario {
  label: string;
  monthlyRevenueRange: CurrencyRange;
  monthlySurplusRange: CurrencyRange;
  estimatedTimeToFund: string;
}

export interface RevenueCommandCenterReport {
  generatedAt: string;
  bookedMrr: number;
  projectedExpectedMrr: CurrencyRange;
  activeRetainerClients: Client[];
  activeOneTimeClients: Client[];
  excludedClientRecords: Client[];
  auditOpportunities: RevenuePriorityOpportunity[];
  retainerOpportunities: RetainerOpportunity[];
  renewalOpportunities: RenewalOpportunity[];
  expansionOpportunities: ExpansionOpportunity[];
  topRevenueActions: RevenueAction[];
  revenueRisks: string[];
  forecast: ForecastScenario[];
  contextSources: RevenueContextSource[];
}
