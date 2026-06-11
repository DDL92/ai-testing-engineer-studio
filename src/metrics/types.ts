import { Client, ClientServiceType, ClientStatus } from '../clientReports/types';
import { Lead, LeadStatus, RecommendedOffer } from '../leads/types';

export interface CurrencyRange {
  min: number;
  max: number;
  cadence: 'one-time' | 'monthly';
}

export interface RevenueAction {
  priority: number;
  title: string;
  reason: string;
  suggestedCommand: string;
}

export interface RevenueSummary {
  generatedAt: string;
  totalLeads: number;
  leadsByStatus: Record<LeadStatus, number>;
  topScoredLeads: Lead[];
  activeClients: Client[];
  clientsByServiceType: Record<ClientServiceType, number>;
  clientsByStatus: Record<ClientStatus, number>;
  estimatedMrr: number;
  oneTimeOpportunityEstimate: CurrencyRange;
  retainerOpportunityEstimate: CurrencyRange;
  retainerOpportunities: Lead[];
  atRiskClients: Client[];
  nextBestRevenueActions: RevenueAction[];
}

export const offerRanges: Record<RecommendedOffer, CurrencyRange> = {
  'qa-audit': { min: 199, max: 500, cadence: 'one-time' },
  'playwright-starter-pack': { min: 900, max: 1500, cadence: 'one-time' },
  'qa-automation-retainer': { min: 1500, max: 3000, cadence: 'monthly' },
  'agency-partner-retainer': { min: 1500, max: 3000, cadence: 'monthly' },
  'not-fit': { min: 0, max: 0, cadence: 'one-time' },
};
