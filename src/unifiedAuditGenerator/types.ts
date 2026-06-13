import { ApprovedFirstOffer } from '../opportunityEngine/types';

export type UnifiedAuditStatus = 'active' | 'paused';

export type UnifiedOpportunityType =
  | 'Potential QA Opportunity'
  | 'Potential UX Opportunity'
  | 'Potential Automation Opportunity'
  | 'Potential Accessibility Opportunity'
  | 'Potential Performance Opportunity';

export interface UnifiedAuditTarget {
  companyId: string;
  companyName: string;
  status: UnifiedAuditStatus;
  source: string;
  notes: string;
}

export interface UnifiedSourceFile {
  label: string;
  path: string;
  available: boolean;
}

export interface UnifiedBusinessContext {
  industry: string;
  productType: string;
  observedOpportunityAreas: string[];
}

export interface UnifiedLighthouseEvidence {
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
  sourcePath: string;
}

export interface UnifiedPlaywrightEvidence {
  pagesReviewed: number;
  screenshotsCaptured: number;
  consoleObservations: number;
  observedPublicFlows: string[];
  sourcePath: string;
}

export interface UnifiedOpportunity {
  type: UnifiedOpportunityType;
  description: string;
  evidence: string;
  confidence: 'High' | 'Medium' | 'Low';
}

export interface UnifiedPlaywrightCoverage {
  smokeSuite: string[];
  regressionSuite: string[];
  criticalPathCoverage: string[];
}

export interface UnifiedAuditScope {
  size: 'Small Audit' | 'Medium Audit' | 'Large Audit';
  focusAreas: string[];
  deliverables: string[];
  complexity: 'Low' | 'Medium' | 'High';
}

export interface UnifiedAuditReport {
  companyId: string;
  companyName: string;
  generatedAt: string;
  opportunityScore: number;
  evidenceReadiness: number;
  confidence: 'High' | 'Medium' | 'Low';
  recommendedFirstOffer: ApprovedFirstOffer;
  recommendedNextAction: string;
  businessContext: UnifiedBusinessContext;
  sourceFiles: UnifiedSourceFile[];
  lighthouseEvidence?: UnifiedLighthouseEvidence;
  playwrightEvidence?: UnifiedPlaywrightEvidence;
  potentialQaOpportunities: UnifiedOpportunity[];
  recommendedPlaywrightCoverage: UnifiedPlaywrightCoverage;
  auditScopes: UnifiedAuditScope[];
  retainerPath: string[];
  discoveryQuestions: string[];
  approvalChecklist: string[];
  researchNeeded: boolean;
  safetyNotes: string[];
}

export interface UnifiedAuditPortfolio {
  generatedAt: string;
  reports: UnifiedAuditReport[];
  bestAuditCandidate?: UnifiedAuditReport;
  bestRetainerCandidate?: UnifiedAuditReport;
  bestFirstClient?: UnifiedAuditReport;
  highestConfidenceAudit?: UnifiedAuditReport;
  lowestConfidenceAudit?: UnifiedAuditReport;
  researchNeeded: UnifiedAuditReport[];
}
