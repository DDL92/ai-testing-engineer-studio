import type { BuyerRole } from './buyerRoleTypes';
import type { IntentStrength } from './buyerIntentTypes';

export type PilotReviewStatus =
  | 'approved'
  | 'rejected'
  | 'verification_candidate'
  | 'needs_review'
  | 'false_positive';

export type PilotRecommendedAction =
  | 'WAIT'
  | 'RESEARCH_MORE'
  | 'SOFT_CONTACT'
  | 'REJECT'
  | 'HIGH_PRIORITY';

export type PilotDeliveryStatus =
  | 'READY'
  | 'PARTIAL'
  | 'NO_DELIVERY';

export interface LeadSalesNotes {
  eventType: string;
  location: string;
  estimatedGuests: number | null;
  estimatedValue: number;
  intentSignals: string[];
  buyerSignals: string[];
  urgency: 'low' | 'medium' | 'high';
  recommendedAction: PilotRecommendedAction;
  actionReason: string;
}

export interface PilotLead {
  leadId: string;
  reviewStatus: PilotReviewStatus;
  buyerRole: BuyerRole | string;
  confidence: number;
  source: string;
  sourceUrl: string;
  location: string;
  eventType: string;
  estimatedGuests: number | null;
  recency: string;
  intentStrength: IntentStrength | string;
  buyerSignals: string[];
  score: number;
  estimatedValue: number;
  recommendedAction: PilotRecommendedAction;
  recommendedActionReason: string;
  reviewNotes: string;
  salesNotes: LeadSalesNotes;
}

export interface PilotMetrics {
  leadsReviewed: number;
  leadsApproved: number;
  leadsRejected: number;
  verificationReviews: number;
  averageConfidence: number;
  falsePositiveRate: number;
  estimatedOpportunityValue: number;
  reviewTimeEstimateMinutes: number;
}

export interface PilotExecutiveSummary {
  client: string;
  date: string;
  systemVersion: string;
  totalReviewedLeads: number;
  totalApprovedLeads: number;
  verificationCandidates: number;
  falsePositivesRemoved: number;
  averageConfidence: number;
  estimatedCommercialValue: number;
  status: PilotDeliveryStatus;
}

export interface PilotSalesIntelligence {
  topEventTypes: string[];
  topLocations: string[];
  topIntentSignals: string[];
  topBuyerSignals: string[];
  urgencyDistribution: Record<string, number>;
  estimatedRevenueOpportunity: number;
}

export interface PilotDeliveryHealth {
  pilotReadiness: PilotDeliveryStatus;
  approvedLeadCount: number;
  commercialReadiness: string;
  estimatedOpportunityValue: number;
  reviewWorkload: string;
  nextRecommendedAction: string;
}

export interface PilotLeadPack {
  generatedAt: string;
  client: string;
  summary: PilotExecutiveSummary;
  leads: PilotLead[];
  salesIntelligence: PilotSalesIntelligence;
  recommendedActions: Array<{
    leadId: string;
    action: PilotRecommendedAction;
    reason: string;
  }>;
  deliveryPackage: {
    packageName: string;
    files: string[];
    safetyRules: string[];
  };
  metrics: PilotMetrics;
  deliveryHealth: PilotDeliveryHealth;
}
