import type { WebsiteCategory, WebsiteLeadRecord } from './types';

export type CheckStatus = 'PASS' | 'FAIL' | 'UNKNOWN' | 'NOT_APPLICABLE';

export interface DemoCheck {
  status: CheckStatus;
  detail: string;
}

export interface NicheProfile {
  category: WebsiteCategory;
  visualMood: string;
  typographyDirection: string;
  spacingDirection: string;
  borderRadiusStyle: string;
  sectionOrder: string[];
  ctaStyle: string;
  imageTreatment: string;
  motionLevel: string;
  heroType: string;
  colorRoles: {
    canvas: string;
    surface: string;
    ink: string;
    muted: string;
    primary: string;
    accent: string;
  };
}

export interface ContentPlaceholder {
  key: string;
  value: string;
  reason: string;
}

export interface VisualBrief {
  leadId: string;
  businessName: string;
  category: WebsiteCategory;
  location: string | null;
  currentWebsiteUrl: string | null;
  designProfile: string;
  visualMood: string;
  typographyDirection: string;
  spacingDirection: string;
  sectionPlan: string[];
  primaryCTA: string;
  secondaryCTA: string;
  heroType: string;
  realAssetsAvailable: boolean;
  contentPlaceholders: ContentPlaceholder[];
  evidenceUsed: string[];
  verifiedFacts: string[];
  suppliedInformation: string[];
  assumptions: string[];
  manualReviewRequired: true;
}

export interface LighthouseResult {
  status: 'available' | 'completed' | 'failed' | 'unavailable' | 'skipped';
  explanation: string;
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
}

export interface SiteAudit {
  leadId: string;
  auditedUrl: string | null;
  startedAt: string;
  completedAt: string;
  reachable: boolean | null;
  finalUrl: string | null;
  checks: Record<string, DemoCheck>;
  consoleErrors: string[];
  failedRequests: string[];
  desktopObservations: string[];
  mobileObservations: string[];
  evidenceLimitations: string[];
  auditErrors: Array<{
    stage: string;
    errorType: string;
    message: string;
  }>;
  lighthouse: LighthouseResult;
  manualReviewRequired: true;
}

export interface DemoValidation {
  leadId: string;
  validatedAt: string;
  correctionPasses: number;
  checks: Record<string, DemoCheck>;
  overallStatus: CheckStatus;
  manualReviewRequired: true;
}

export interface LeadPack {
  leadId: string;
  businessSummary: {
    businessName: string;
    category: WebsiteCategory;
    location: string | null;
    source: string;
    notes: string | null;
  };
  verifiedOpportunitySignals: string[];
  decision: WebsiteLeadRecord['analysis']['decision'];
  recommendedPrimaryOffer: string;
  priceRange: string;
  recurringMaintenanceAngle: string;
  evidenceGaps: string[];
  manualVerificationChecklist: string[];
  manualReviewRequired: true;
}
