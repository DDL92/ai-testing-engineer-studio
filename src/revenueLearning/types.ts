export type CommercialOutcome =
  | 'sent'
  | 'replied'
  | 'meeting'
  | 'proposal'
  | 'won'
  | 'lost'
  | 'retained'
  | 'expanded'
  | 'churned';

export type RevenueLearningStatus =
  | 'INSUFFICIENT HISTORY'
  | 'LEARNING'
  | 'CALIBRATED'
  | 'HIGH CONFIDENCE';

export interface CommercialOutcomeRecord {
  id: string;
  lead: string;
  industry: string;
  leadCategory: string;
  channel: string;
  offer: string;
  pricePoint: number | null;
  messageType: string;
  outcome: CommercialOutcome;
  date: string;
  notes: string;
  createdAt: string;
  source: 'manual';
}

export interface CommercialOutcomeInput {
  lead: string;
  industry: string;
  channel: string;
  offer: string;
  outcome: CommercialOutcome | string;
  date: string;
  notes?: string;
  leadCategory?: string;
  pricePoint?: number | null;
  messageType?: string;
}

export interface PerformanceMetric {
  key: string;
  outcomes: number;
  messagesSent: number;
  replies: number;
  meetings: number;
  proposals: number;
  wins: number;
  losses: number;
  retained: number;
  expanded: number;
  churned: number;
  replyRate: number;
  meetingRate: number;
  closeRate: number;
  retentionRate: number;
  interestRate: number;
  performanceScore: number;
}

export interface RevenueLearningRecommendations {
  bestChannel: string;
  bestOffer: string;
  bestIndustry: string;
  bestPricePoint: string;
  bestLeadCategory: string;
  bestMessageType: string;
  worstChannel: string;
  worstOffer: string;
  worstIndustry: string;
  confidence: string;
  actions: string[];
}

export interface RevenueLearningReport {
  generatedAt: string;
  outcomes: CommercialOutcomeRecord[];
  status: RevenueLearningStatus;
  calibrationInfluence: number;
  channelPerformance: PerformanceMetric[];
  offerPerformance: PerformanceMetric[];
  leadPerformance: PerformanceMetric[];
  industryPerformance: PerformanceMetric[];
  pricingPerformance: PerformanceMetric[];
  messagePerformance: PerformanceMetric[];
  recommendations: RevenueLearningRecommendations;
  sampleWorkflow: CommercialOutcomeInput;
  safetyRules: string[];
}

export interface RevenueLearningDashboard {
  revenueLearningStatus: RevenueLearningStatus;
  outcomesRecorded: number;
  bestChannel: string;
  bestOffer: string;
  bestIndustry: string;
  calibrationStatus: string;
  recommendationConfidence: string;
}

export interface RevenueCalibrationSignal {
  score: number;
  influence: number;
  status: RevenueLearningStatus;
  reason: string;
  hasHistory: boolean;
}
