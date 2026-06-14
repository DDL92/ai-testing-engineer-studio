export type LearningOutcomeType =
  | 'SENT'
  | 'NO_RESPONSE'
  | 'REPLIED'
  | 'MEETING'
  | 'PROPOSAL'
  | 'WON'
  | 'LOST';

export interface OutcomeLearningRecord {
  id: string;
  lead: string;
  offer: string;
  category: string;
  channel: string;
  outcome: LearningOutcomeType;
  date: string;
  notes: string;
  createdAt: string;
  source: 'manual';
}

export interface OutcomeLearningState {
  schemaVersion: number;
  lastUpdatedAt: string | null;
  totalOutcomes: number;
  safetyRules: string[];
}

export interface OutcomeLearningMetric {
  key: string;
  total: number;
  sent: number;
  noResponse: number;
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
}

export interface OutcomeLearningAnalysis {
  generatedAt: string;
  totalOutcomes: number;
  hasOutcomes: boolean;
  overall: OutcomeLearningMetric;
  byLead: OutcomeLearningMetric[];
  byOffer: OutcomeLearningMetric[];
  byCategory: OutcomeLearningMetric[];
  byChannel: OutcomeLearningMetric[];
  topPerformingOffer: string;
  topPerformingCategory: string;
  topPerformingLead: string;
  topPerformingChannel: string;
  topPatterns: string[];
  improvementRecommendations: string[];
  safetyRules: string[];
}

export interface OutcomeLearningDashboard {
  outcomesRecorded: number;
  replyRate: string;
  proposalRate: string;
  winRate: string;
  topPerformingOffer: string;
}
