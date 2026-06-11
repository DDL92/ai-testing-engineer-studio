import { Lead, OutreachStatus, RecommendedOffer } from '../leads/types';
import { First50ProgressSummary } from '../first50/first50Progress';

export interface QueueLeadItem {
  lead: Lead;
  outreachStatus: OutreachStatus;
  queueScore: number;
  revenuePotential: number;
  nextAction: string;
}

export interface OutreachQueue {
  date: string;
  topPriorityLeads: QueueLeadItem[];
  followUpsNeeded: QueueLeadItem[];
  auditOpportunities: QueueLeadItem[];
  proposalOpportunities: QueueLeadItem[];
  retainerOpportunities: QueueLeadItem[];
  first50Progress: First50ProgressSummary;
  recommendedManualActions: string[];
  suggestedCommands: string[];
  safetyRules: string[];
}

export type OfferRevenueTier = Record<RecommendedOffer, number>;
