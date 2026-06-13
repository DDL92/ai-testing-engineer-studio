import { ClientAuditReport } from '../clientAuditReports/types';
import { ApprovedFirstOffer } from '../opportunityEngine/types';
import { UnifiedAuditTarget } from '../unifiedAuditGenerator/types';

export type ProposalTarget = UnifiedAuditTarget;

export interface ProposalArtifacts {
  markdownPath: string;
  pdfPath: string;
}

export interface ProposalBusinessContext {
  industry: string;
  productType: string;
  observedOpportunityAreas: string[];
  potentialRiskAreas: string[];
}

export interface ProposalScope {
  objectives: string[];
  inScope: string[];
  outOfScope: string[];
  deliverables: string[];
}

export interface EngagementOption {
  label: 'Option A' | 'Option B' | 'Option C';
  name: ApprovedFirstOffer;
  bestFor: string;
  deliverables: string[];
  recommended: boolean;
}

export interface ProposalPackage {
  companyId: string;
  companyName: string;
  generatedAt: string;
  preparedBy: 'AI Testing Engineer Studio';
  preparedFor: 'Manual Review';
  opportunityScore: number;
  evidenceReadiness: number;
  recommendedEngagement: ApprovedFirstOffer;
  recommendedNextAction: string;
  businessContext: ProposalBusinessContext;
  scopeOfWork: ProposalScope;
  engagementOptions: EngagementOption[];
  retainerPath: string[];
  clientSuccessCriteria: string[];
  approvalChecklist: string[];
  disclaimer: string[];
  sourceAuditReport: ClientAuditReport;
  artifacts: ProposalArtifacts;
}

export interface ProposalPortfolio {
  generatedAt: string;
  proposals: ProposalPackage[];
  bestProposalCandidate?: ProposalPackage;
  bestAuditCandidate?: ProposalPackage;
  bestStarterPackCandidate?: ProposalPackage;
  bestRetainerCandidate?: ProposalPackage;
  researchNeeded: ProposalPackage[];
}
