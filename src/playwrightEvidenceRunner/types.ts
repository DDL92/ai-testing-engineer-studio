export type EvidenceConfidence = 'Low' | 'Medium' | 'High';

export type EvidenceOpportunityType =
  | 'Potential QA Opportunity'
  | 'Potential UX Opportunity'
  | 'Potential Automation Opportunity'
  | 'Potential Accessibility Opportunity';

export type AllowedPageType =
  | 'Homepage'
  | 'Navigation'
  | 'Pricing'
  | 'Public Demo Page'
  | 'Public Contact Page'
  | 'Public Marketing Pages';

export interface LeadRecordForPlaywright {
  id: string;
  companyName: string;
  website: string;
  status: string;
}

export interface PlaywrightEvidenceTarget {
  companyId: string;
  companyName: string;
  priority: number;
  recommendedFirstFlow: string;
  reason: string;
  researchGaps: string[];
}

export interface PageObservation {
  pageType: AllowedPageType;
  requestedUrl: string;
  finalUrl: string;
  title: string;
  httpStatus: number | null;
  visibleCtaCount: number;
  navigationLinks: string[];
  consoleWarnings: string[];
  consoleErrors: string[];
  screenshotCapture: string;
  observations: string[];
  qaOpportunities: EvidenceOpportunity[];
  automationOpportunities: EvidenceOpportunity[];
  confidence: EvidenceConfidence;
}

export interface EvidenceOpportunity {
  type: EvidenceOpportunityType;
  description: string;
  evidence: string;
  confidence: EvidenceConfidence;
}

export interface PlaywrightEvidenceReport {
  companyId: string;
  companyName: string;
  website: string;
  generatedAt: string;
  pagesReviewed: number;
  maxPagesAllowed: number;
  maxNavigationDepth: number;
  screenshotsCaptured: number;
  consoleObservationCount: number;
  evidenceConfidence: EvidenceConfidence;
  observations: PageObservation[];
  safetyNotes: string[];
}

export interface PlaywrightEvidenceSummary {
  generatedAt: string;
  reports: PlaywrightEvidenceReport[];
}
