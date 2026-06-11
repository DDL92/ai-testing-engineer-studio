import { RecommendedOffer } from '../leads/types';

export interface SowSection {
  title: string;
  body: string[];
}

export interface SowDeliverable {
  title: string;
  description: string;
}

export interface SowPricingOption {
  name: SowCoreOffer;
  range: string;
  recommended: boolean;
  bestFor: string;
  deliverables: string[];
}

export type SowCoreOffer = 'QA Audit' | 'Playwright Starter Pack' | 'QA Automation Retainer';
export type SowOffer = SowCoreOffer | 'Agency Partner Retainer';

export interface SowDraft {
  leadId: string;
  companyName: string;
  generatedAt: string;
  recommendedOffer: RecommendedOffer;
  recommendedSowOffer: SowOffer;
  score: number;
  auditReportPath?: string;
  hasAuditAutomationOpportunities: boolean;
  sections: SowSection[];
  deliverables: SowDeliverable[];
  pricingOptions: SowPricingOption[];
}
