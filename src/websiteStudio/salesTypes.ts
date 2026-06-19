import type { DemoValidation, LeadPack, SiteAudit, VisualBrief } from './demoTypes';
import type { WebsiteDecision, WebsiteLeadRecord } from './types';

export type RecommendedChannel =
  | 'email'
  | 'website contact method'
  | 'supplied public social profile'
  | 'manual contact research required';

export type RecommendedCta =
  | 'permission to send the conceptual demo'
  | 'short review call'
  | 'confirmation of interest'
  | 'request for brand assets'
  | 'request for website priorities';

export interface SalesPackJson {
  leadId: string;
  businessName: string;
  generatedAt: string;
  leadDecision: WebsiteDecision;
  leadScore: number;
  primaryOffer: string;
  priceRange: string;
  recurringOffer: string;
  evidenceSummary: string[];
  evidenceGaps: string[];
  demoValidationStatus: DemoValidation['overallStatus'];
  auditStatus: string;
  outreachDraftPaths: string[];
  proposalPath: string;
  sowPath: string;
  followUpPlanPath: string;
  approvalChecklistPath: string;
  recommendedChannel: RecommendedChannel;
  recommendedCTA: RecommendedCta;
  salesStatus: 'draft';
  manualReviewRequired: true;
  sent: false;
  approved: false;
}

export interface SalesPackContext {
  record: WebsiteLeadRecord;
  leadPack: LeadPack;
  audit: SiteAudit;
  validation: DemoValidation;
  visualBrief: VisualBrief;
  commercialComparison: string;
  recommendedChannel: RecommendedChannel;
  recommendedCTA: RecommendedCta;
  fictional: boolean;
  limitations: string[];
}
