import { ApprovedFirstOffer, OpportunityReport } from '../opportunityEngine/types';

export interface AuditPackTarget {
  companyId: string;
  companyName: string;
  status: 'active' | 'paused';
  source: string;
  notes: string;
}

export type PotentialRiskType =
  | 'Potential QA Risk'
  | 'Potential UX Risk'
  | 'Potential Release Risk'
  | 'Potential Test Coverage Gap'
  | 'Potential Automation Opportunity';

export interface AuditPackRisk {
  type: PotentialRiskType;
  risk: string;
  evidence: string;
  confidence: 'High' | 'Medium' | 'Low';
  recommendation: string;
}

export interface ObservedOpportunityGroup {
  title: string;
  opportunities: string[];
}

export interface PlaywrightSuiteRecommendation {
  suite: 'Suggested Smoke Suite' | 'Suggested Regression Suite' | 'Suggested Critical Path Coverage';
  focus: string;
  coverage: string[];
}

export interface AuditScopeOption {
  size: 'Small Audit' | 'Medium Audit' | 'Large Audit';
  focusAreas: string[];
  expectedDeliverables: string[];
  complexity: 'Low' | 'Medium' | 'High';
}

export interface AuditSourceFile {
  label: string;
  path: string;
  available: boolean;
}

export interface AuditPack {
  companyId: string;
  companyName: string;
  opportunityScore: number;
  confidence: 'High' | 'Medium' | 'Low';
  recommendedFirstService: ApprovedFirstOffer;
  opportunity: OpportunityReport;
  sourceFiles: AuditSourceFile[];
  potentialRisks: AuditPackRisk[];
  observedOpportunities: ObservedOpportunityGroup[];
  playwrightOpportunities: PlaywrightSuiteRecommendation[];
  recommendedAuditScopes: AuditScopeOption[];
  upgradePath: string[];
  discoveryQuestions: string[];
  approvalChecklist: string[];
  safetyNotes: string[];
}

export interface AuditPortfolio {
  generatedAt: string;
  packs: AuditPack[];
  highestOpportunityCompanies: AuditPack[];
  bestFirstClient: AuditPack;
  bestRetainerCandidate: AuditPack;
  bestAuditCandidate: AuditPack;
  lowestConfidenceCompany: AuditPack;
  researchNeeded: AuditPack[];
}
