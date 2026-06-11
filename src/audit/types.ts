export type AuditSeverity = 'low' | 'medium' | 'high';

export type AuditCategory =
  | 'navigation'
  | 'accessibility'
  | 'performance'
  | 'content'
  | 'mobile'
  | 'reliability'
  | 'automation-opportunity';

export interface AuditFinding {
  id: string;
  severity: AuditSeverity;
  category: AuditCategory;
  title: string;
  description: string;
  recommendation: string;
  evidencePath: string;
}

export interface VisibleElementSummary {
  hasNav: boolean;
  hasMain: boolean;
  hasFooter: boolean;
  buttonCount: number;
  formCount: number;
  linkCount: number;
}

export interface SeveritySummary {
  low: number;
  medium: number;
  high: number;
}

export type AuditRiskLevel = 'low' | 'medium' | 'high';

export interface AuditRiskAssessment {
  level: AuditRiskLevel;
  rationale: string[];
}

export type SuggestedServicePath = 'QA Audit Follow-Up' | 'Playwright Starter Pack' | 'QA Automation Retainer';

export interface SuggestedServiceRecommendation {
  servicePath: SuggestedServicePath;
  reason: string;
}

export interface AuditEvidence {
  homepageScreenshotPath: string;
  pageTitle: string;
  finalUrl: string;
  consoleErrors: string[];
  visibleElements: VisibleElementSummary;
  capturedAt: string;
  viewport: string;
}

export interface AuditSummary {
  targetUrl: string;
  finalUrl: string;
  domain: string;
  pageTitle: string;
  generatedAt: string;
  findingCount: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  severitySummary: SeveritySummary;
  keyObservations: string[];
  riskAssessment: AuditRiskAssessment;
  suggestedService: SuggestedServiceRecommendation;
  suggestedOffer: SuggestedServicePath;
}

export interface AuditResult {
  summary: AuditSummary;
  evidence: AuditEvidence;
  findings: AuditFinding[];
}
