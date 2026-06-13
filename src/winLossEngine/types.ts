export interface WinLossMetricSet {
  totalOutcomes: number;
  messagesSent: number;
  replies: number;
  meetings: number;
  proposals: number;
  wins: number;
  losses: number;
  replyRate: string;
  meetingRate: string;
  proposalRate: string;
  closeRate: string;
}

export interface WinLossPattern {
  label: string;
  evidence: string;
  sampleSize: number;
}

export interface WinLossRecommendations {
  doMoreOf: string[];
  doLessOf: string[];
  highestConvertingSegment: string;
  highestConvertingOffer: string;
  mostPromisingNextTargetProfile: string;
  biggestWeakness: string;
  topLearning: string;
  topRecommendation: string;
}

export interface WinLossReport {
  generatedAt: string;
  hasEnoughData: boolean;
  insufficientDataMessage: string;
  metrics: WinLossMetricSet;
  lostReasons: string[];
  bestIndustries: WinLossPattern[];
  bestOfferTypes: WinLossPattern[];
  bestLeadSources: WinLossPattern[];
  bestContactRoles: WinLossPattern[];
  replyPatterns: WinLossPattern[];
  offerPerformance: WinLossPattern[];
  recommendations: WinLossRecommendations;
  safetyRules: string[];
}
