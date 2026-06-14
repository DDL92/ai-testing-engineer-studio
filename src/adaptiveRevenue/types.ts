export interface AdaptiveHistoricalWeights {
  generatedAt: string;
  totalOutcomes: number;
  usableOutcomes: number;
  existingModelWeight: number;
  learningWeight: number;
  readiness: 'Insufficient History' | 'Learning Active';
  explanation: string;
}

export interface AdaptiveSignalScore {
  key: string;
  total: number;
  replied: number;
  meetings: number;
  proposals: number;
  won: number;
  lost: number;
  replyRate: number;
  meetingRate: number;
  proposalRate: number;
  winRate: number;
  lossRate: number;
  performanceScore: number;
}

export interface AdaptiveLeadScore {
  companyName: string;
  category: string;
  recommendedOffer: string;
  qualificationScore: number;
  qaOpportunityScore: number;
  baseScore: number;
  learningScore: number;
  adaptiveScore: number;
  learningInfluence: number;
  reason: string;
}

export interface AdaptiveRevenueReport {
  generatedAt: string;
  weights: AdaptiveHistoricalWeights;
  leadScores: AdaptiveLeadScore[];
  offerScores: AdaptiveSignalScore[];
  categoryScores: AdaptiveSignalScore[];
  channelScores: AdaptiveSignalScore[];
  bestPerformingCategory: string;
  bestPerformingOffer: string;
  bestPerformingChannel: string;
  adaptiveRecommendation: string;
  safetyRules: string[];
}

export interface AdaptiveRevenueDashboard {
  adaptiveLearningStatus: string;
  bestPerformingCategory: string;
  bestPerformingOffer: string;
  learningInfluence: string;
}
