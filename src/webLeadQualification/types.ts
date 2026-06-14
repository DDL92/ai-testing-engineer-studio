import { WebLeadCandidate } from '../webLeadDiscovery/types';

export type LeadCategory =
  | 'Gym SaaS'
  | 'Fitness SaaS'
  | 'Booking SaaS'
  | 'Membership SaaS'
  | 'Scheduling SaaS'
  | 'Agency'
  | 'Marketplace'
  | 'Unknown';

export type RecommendedQualifiedOffer =
  | 'QA Audit ($199-$500)'
  | 'Playwright Starter Pack ($900-$1500)'
  | 'QA Automation Retainer ($1500-$3000/month)';

export interface QualifiedLeadScoreBreakdown {
  industryFit: number;
  qaFit: number;
  automationOpportunity: number;
  painSignalPresence: number;
  websiteQuality: number;
  productComplexity: number;
  publicJourneys: number;
  bookingFlow: number;
  checkoutFlow: number;
  mobileFlow: number;
  schedulingFlow: number;
  membershipFlow: number;
  integrations: number;
  releaseRisk: number;
}

export interface NormalizedWebLead {
  id: string;
  rawName: string;
  normalizedName: string;
  website: string;
  source: string;
  sourceTitle: string;
  query: string;
  date: string;
  category: LeadCategory;
  qualificationScore: number;
  qaOpportunityScore: number;
  recommendedOffer: RecommendedQualifiedOffer;
  duplicateOf: string | null;
  isAggregatorOrArticle: boolean;
  confidence: number;
  notes: string;
  scoreBreakdown: QualifiedLeadScoreBreakdown;
  rawLead: WebLeadCandidate;
}

export interface LeadQualificationReport {
  generatedAt: string;
  rawCount: number;
  normalizedLeads: NormalizedWebLead[];
  duplicatesRemoved: number;
  topQualifiedLeads: NormalizedWebLead[];
  bestCategory: LeadCategory | 'None';
  bestOffer: RecommendedQualifiedOffer | 'None';
  safetyRules: string[];
}

export interface LeadQualificationDashboard {
  bestQualifiedLead: string;
  bestCategory: string;
  highestQaOpportunity: string;
  recommendedOffer: string;
  qualifiedLeadsCount: number;
}
