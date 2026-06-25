export const WEBSITE_CATEGORIES = [
  'boutique_hotel',
  'villa',
  'surf_camp',
  'gym',
  'martial_arts',
  'wellness',
  'yoga',
  'restaurant',
  'real_estate',
  'aesthetic_clinic',
  'professional_services',
  'other',
] as const;

export type WebsiteCategory = typeof WEBSITE_CATEGORIES[number];
export type WebsitePresence =
  | 'no_website'
  | 'social_only'
  | 'unreachable_website'
  | 'basic_website'
  | 'functioning_website'
  | 'unknown';
export type WebsiteDecision =
  | 'PRIORITY'
  | 'QUALIFIED'
  | 'REVIEW'
  | 'LOW_PRIORITY'
  | 'INSPECTION_INCONCLUSIVE'
  | 'NOT_QUALIFIED';
export type WebsiteNextAction =
  | 'verify website presence'
  | 'inspect website manually'
  | 'prepare website audit'
  | 'prepare homepage demo'
  | 'find public business contact'
  | 'verify official business website'
  | 'archive low-priority lead'
  | 'skip — migrated domain; no verified redesign opportunity'
  | 'skip — functioning site; no verified redesign opportunity'
  | 'RETRY_INSPECTION'
  | 'manual review';

export type WebsiteInspectionStatus =
  | 'SUCCESS'
  | 'TIMEOUT'
  | 'ABORTED'
  | 'DNS_FAILURE'
  | 'CONNECTION_FAILURE'
  | 'HTTP_ERROR'
  | 'UNKNOWN_FAILURE';

export interface WebsiteCandidateInput {
  id: string;
  businessName: string;
  category: WebsiteCategory;
  source: string;
  location?: string | null;
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  detailUrl?: string | null;
  sourceUrl?: string | null;
  discoveredAt?: string | null;
  evidenceText?: string | null;
  sources?: WebsiteSourceReference[];
}

export interface WebsiteSourceReference {
  source: string;
  sourceUrl: string;
  detailUrl: string | null;
  discoveredAt: string;
  evidenceText: string | null;
}

export interface WebsiteInspection {
  inspectedAt: string | null;
  requestedUrl: string | null;
  status?: WebsiteInspectionStatus | null;
  attemptCount?: number;
  timeoutMs?: number;
  externalReachabilityUnverified?: boolean;
  reachable: boolean | null;
  httpStatus: number | null;
  httpsUsed: boolean | null;
  finalUrl: string | null;
  pageTitlePresent: boolean | null;
  metaDescriptionPresent: boolean | null;
  viewportMetaPresent: boolean | null;
  mailtoLinkPresent: boolean | null;
  telLinkPresent: boolean | null;
  conversionLinkPresent: boolean | null;
  internalNavigationLinks: number | null;
  brokenResponse: boolean | null;
  responseTimeMs: number | null;
  htmlSizeBytes: number | null;
  failure: string | null;
  canonicalWebsiteUrl?: string;
  legacyWebsiteUrl?: string;
  migrationDetected?: boolean;
  migrationEvidence?: string[];
  migrationTargetUrl?: string;
  canonicalSiteName?: string;
  rootDomain?: string;
  parentBusinessName?: string;
  parentPlatformPage?: boolean;
  standaloneBusinessPage?: boolean;
}

export interface WebsiteOffer {
  name:
    | 'Website Presence Starter'
    | 'Website Recovery / Redesign Pack'
    | 'Conversion Landing Page'
    | 'Website QA & Performance Audit';
  priceRange: string;
}

export interface WebsiteScoreBreakdown {
  websiteNeed: number;
  nicheFit: number;
  commercialPotential: number;
  conversionOpportunity: number;
  maintenancePotential: number;
  evidenceConfidence: number;
}

export interface WebsiteAnalysis {
  presence: WebsitePresence;
  opportunitySignals: string[];
  evidenceGaps: string[];
  score: number;
  scoreBreakdown: WebsiteScoreBreakdown;
  decision: WebsiteDecision;
  primaryOffer: WebsiteOffer;
  recurringFollowUp: 'Monthly Website Care — USD 100–300/month';
  strongestOpportunity: string;
  personalizedSalesAngle: string;
  nextAction: WebsiteNextAction;
  manualReviewRequired: true;
}

export interface WebsiteLeadRecord {
  lead: {
    id: string;
    companyName: string;
    website: string | null;
    industry: WebsiteCategory;
    source: string;
    status: 'new' | 'reviewing';
    fitNotes: string;
    createdAt: string;
    updatedAt: string;
    nextAction: WebsiteNextAction;
  };
  location: string | null;
  publicContact: {
    instagramUrl: string | null;
    facebookUrl: string | null;
    email: string | null;
    phone: string | null;
  };
  discovery?: {
    sources: WebsiteSourceReference[];
  };
  inspection: WebsiteInspection;
  analysis: WebsiteAnalysis;
  canonicalWebsiteUrl?: string;
  legacyWebsiteUrl?: string;
  migrationDetected?: boolean;
  migrationEvidence?: string[];
  migrationTargetUrl?: string;
}

export interface ImportCounts {
  added: number;
  updated: number;
  skipped: number;
  invalid: number;
}

export type DiscoverySourceType =
  | 'public_directory'
  | 'association_members'
  | 'tourism_directory'
  | 'chamber_directory'
  | 'curated_list';

export interface DiscoverySource {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  fixture?: boolean;
  category: WebsiteCategory;
  location: string | null;
  sourceType: DiscoverySourceType;
  maxPages: number;
  selectors: {
    businessContainer: string | null;
    businessName: string | null;
    websiteLink: string | null;
    detailLink: string | null;
    location: string | null;
    email: string | null;
    phone: string | null;
  };
  notes: string;
}
