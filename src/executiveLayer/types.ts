import { ApprovedFirstOffer } from '../opportunityEngine/types';

export type ExecutiveSeverity = 'High' | 'Medium' | 'Low';
export type BusinessRiskLevel = 'High' | 'Medium' | 'Low';

export interface ExecutiveState {
  schemaVersion: number;
  updatedAt: string;
  audience: string[];
  approvedEngagements: ApprovedFirstOffer[];
  notes: string[];
}

export interface ExecutiveScores {
  executiveScore: number;
  businessRiskScore: number;
  releaseConfidenceScore: number;
  commercialPotentialScore: number;
  formulas: string[];
}

export interface ExecutiveBusinessRisk {
  priority: number;
  area: string;
  evidence: string;
  businessImpact: string;
  severity: ExecutiveSeverity;
  recommendedAction: string;
  businessImpactScore: number;
  technicalImportanceScore: number;
}

export interface ExecutiveRoadmapItem {
  month: 'Month 1' | 'Month 2' | 'Month 3';
  engagement: 'QA Audit' | 'Playwright Starter Pack' | 'QA Automation Retainer';
  businessOutcome: string;
  executiveDecision: string;
}

export interface ExecutiveCompanyReport {
  companyId: string;
  companyName: string;
  generatedAt: string;
  executiveScore: number;
  releaseConfidence: number;
  businessRiskLevel: BusinessRiskLevel;
  recommendedEngagement: ApprovedFirstOffer;
  scores: ExecutiveScores;
  topBusinessRisks: ExecutiveBusinessRisk[];
  topPriorities: ExecutiveBusinessRisk[];
  roadmap: ExecutiveRoadmapItem[];
  executiveRecommendation: ApprovedFirstOffer;
  summary: string;
  safetyRules: string[];
}

export interface ExecutivePortfolio {
  generatedAt: string;
  reports: ExecutiveCompanyReport[];
  topExecutivePriority?: ExecutiveCompanyReport;
  businessRiskPortfolio: ExecutiveBusinessRisk[];
  executiveReadiness: string[];
  safetyRules: string[];
}
