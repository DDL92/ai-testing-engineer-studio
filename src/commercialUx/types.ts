export interface CommercialTodayFocus {
  topLead: string;
  recommendedOffer: string;
  offerLabel: string;
  executionPriority: string;
  revenueDecision: string;
  nextAction: string;
  potentialValue: string;
}

export interface CommercialDiscoverySnapshot {
  newLeadsToday: number;
  newPainSignals: number;
  qualifiedLeads: number;
}

export interface CommercialSystemHealth {
  runnerStatus: string;
  lastRefresh: string;
  studioHealth: string;
}

export interface CommercialUxView {
  generatedAt: string;
  today: CommercialTodayFocus;
  discovery: CommercialDiscoverySnapshot;
  health: CommercialSystemHealth;
  adaptiveLearning: {
    status: string;
    influence: string;
    recommendation: string;
  };
  safetyRules: string[];
}

export interface CommercialUxDashboard {
  todayFocus: string;
  revenueHero: string;
  potentialValue: string;
  nextAction: string;
  target: string;
  offer: string;
  priority: string;
  decision: string;
}
