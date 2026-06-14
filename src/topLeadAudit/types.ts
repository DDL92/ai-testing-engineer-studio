export type TopLeadAuditReadinessStatus = 'Ready' | 'Partial' | 'Missing';

export type TopLeadAuditGoNoGo = 'GO' | 'PARTIAL' | 'NO GO';

export interface TopLeadAuditEvidenceItem {
  label: string;
  value: string;
  source: string;
}

export interface TopLeadAuditReadinessCheck {
  label: string;
  status: TopLeadAuditReadinessStatus;
  evidence: string;
  path: string;
}

export interface TopLeadAuditPackage {
  generatedAt: string;
  companyId: string;
  companyName: string;
  website: string;
  category: string;
  recommendedOffer: string;
  revenueDecision: string;
  executionPriority: string;
  nextRevenueAction: string;
  qualificationScore: number;
  qaOpportunityScore: number;
  painSignalRelevance: number;
  offerFitScore: number;
  evidenceItems: TopLeadAuditEvidenceItem[];
  topBusinessRisks: string[];
  topPriorities: string[];
  proposalScope: string[];
  readinessChecks: TopLeadAuditReadinessCheck[];
  goNoGo: TopLeadAuditGoNoGo;
  remainingBlockers: string[];
  safetyRules: string[];
}

export interface TopLeadAuditDashboard {
  topLeadAuditStatus: string;
  evidenceStatus: string;
  proposalStatus: string;
  executionReadiness: string;
}
