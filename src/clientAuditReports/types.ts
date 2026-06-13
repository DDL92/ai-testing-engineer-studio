import {
  UnifiedAuditReport,
  UnifiedAuditTarget,
  UnifiedLighthouseEvidence,
  UnifiedOpportunity,
  UnifiedPlaywrightCoverage,
  UnifiedPlaywrightEvidence,
} from '../unifiedAuditGenerator/types';

export type ClientAuditReportTarget = UnifiedAuditTarget;

export interface ClientAuditArtifactPaths {
  markdownPath: string;
  htmlPath: string;
  pdfPath: string;
}

export interface ClientAuditReport {
  companyId: string;
  companyName: string;
  generatedAt: string;
  preparedBy: 'AI Testing Engineer Studio';
  preparedFor: 'Manual Review';
  opportunityScore: number;
  evidenceReadiness: number;
  recommendedService: UnifiedAuditReport['recommendedFirstOffer'];
  recommendedNextAction: string;
  lighthouseEvidence?: UnifiedLighthouseEvidence;
  playwrightEvidence?: UnifiedPlaywrightEvidence;
  potentialOpportunities: UnifiedOpportunity[];
  recommendedCoverage: UnifiedPlaywrightCoverage;
  upgradePath: string[];
  discoveryQuestions: string[];
  disclaimer: string[];
  sourceReport: UnifiedAuditReport;
  artifacts: ClientAuditArtifactPaths;
}

export interface ClientAuditPortfolio {
  generatedAt: string;
  reports: ClientAuditReport[];
  bestAuditCandidate?: ClientAuditReport;
  bestRetainerCandidate?: ClientAuditReport;
  highestConfidenceReport?: ClientAuditReport;
  lowestConfidenceReport?: ClientAuditReport;
  researchNeeded: ClientAuditReport[];
}
