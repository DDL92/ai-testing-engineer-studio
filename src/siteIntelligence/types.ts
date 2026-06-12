export type SiteIntelligenceCategory =
  | 'navigation'
  | 'forms'
  | 'cta'
  | 'content'
  | 'mobile'
  | 'performance'
  | 'accessibility'
  | 'console'
  | 'links'
  | 'metadata'
  | 'user-flow'
  | 'onboarding'
  | 'booking'
  | 'checkout'
  | 'scheduling'
  | 'general';

export type SiteConfidence = 'high' | 'medium' | 'low';

export type SiteRiskType =
  | 'Potential QA Risk'
  | 'Potential UX Risk'
  | 'Potential Release Risk'
  | 'Potential Automation Opportunity'
  | 'Potential Test Coverage Opportunity';

export interface SiteObservation {
  observation: string;
  category: SiteIntelligenceCategory;
  evidence: string;
  confidence: SiteConfidence;
  status: 'Evidence available from local data' | 'Local lead-data signal only' | 'Not enough evidence';
  manualReviewRequired: boolean;
}

export interface SiteFinding {
  finding: string;
  category: SiteIntelligenceCategory;
  riskType: SiteRiskType;
  evidence: string;
  confidence: SiteConfidence;
  recommendation: string;
}

export interface SiteUxOpportunity {
  opportunity: string;
  category: SiteIntelligenceCategory;
  evidence: string;
  confidence: SiteConfidence;
  recommendation: string;
}

export interface SiteAutomationOpportunity {
  observation: string;
  opportunity: string;
  coverage: string[];
}

export interface SiteAuditRecommendation {
  focus: string;
  review: string[];
}

export interface SiteIntelligenceRecord {
  companyId: string;
  companyName: string;
  url: string;
  industry: string;
  score: number;
  screenshotCapture: 'Not Available' | string;
  observations: SiteObservation[];
  findings: SiteFinding[];
  uxOpportunities: SiteUxOpportunity[];
  automationOpportunities: SiteAutomationOpportunity[];
  auditRecommendations: SiteAuditRecommendation[];
}

export interface SiteSummary {
  totalCompanies: number;
  totalFindings: number;
  totalUxOpportunities: number;
  totalAutomationOpportunities: number;
  categoryCounts: Record<string, number>;
  records: SiteIntelligenceRecord[];
}
