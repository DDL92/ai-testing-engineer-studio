export type SourceQualityV2Recommendation = 'promote' | 'keep' | 'reduce' | 'disable';

export interface SourceQualityV2Row {
  key: string;
  clientId: string;
  clientName: string;
  vertical: string;
  sourceType: string;
  queryType: string;
  sourceName: string;
  candidateCount: number;
  leadLikeCount: number;
  deliveryCount: number;
  approvedCount: number;
  rejectedCount: number;
  falsePositiveCount: number;
  staleCount: number;
  buyerRoleQuality: number;
  enrichmentReadiness: number;
  commercialValue: number;
  estimatedCreditsSpent: number;
  leadLikeRate: number;
  approvalRate: number;
  rejectionRate: number;
  falsePositiveRate: number;
  staleRate: number;
  costEfficiency: number;
  qualityScore: number;
  recommendation: SourceQualityV2Recommendation;
  reasons: string[];
}

export interface SourceQualityV2Summary {
  generatedAt: string;
  totalRows: number;
  promotedSources: number;
  keptSources: number;
  reducedSources: number;
  disabledSources: number;
  costPerApprovedOpportunityEstimate: number;
  nextBudgetAction: string;
  rows: SourceQualityV2Row[];
  sourceTypeWeights: SourceQualityV2Weight[];
  queryTypeWeights: SourceQualityV2Weight[];
  clientWeights: SourceQualityV2Weight[];
  verticalWeights: SourceQualityV2Weight[];
  safetyRules: string[];
}

export interface SourceQualityV2Weight {
  dimension: 'client' | 'source_type' | 'query_type' | 'vertical';
  key: string;
  weight: number;
  recommendation: SourceQualityV2Recommendation;
  reason: string;
}

export interface ClientBudgetAllocationV2 {
  clientId: string;
  clientName: string;
  allocation: Array<{
    bucket: string;
    percentage: number;
    sourceQualitySignal: SourceQualityV2Recommendation;
    reason: string;
  }>;
}

export interface SourceQualityV2BudgetRecommendations {
  generatedAt: string;
  sourceQualityV2Available: true;
  costPerApprovedOpportunityEstimate: number;
  nextBudgetAction: string;
  clientAllocations: ClientBudgetAllocationV2[];
  promotedSources: SourceQualityV2Row[];
  reducedSources: SourceQualityV2Row[];
  disabledSources: SourceQualityV2Row[];
  safetyRules: string[];
}
