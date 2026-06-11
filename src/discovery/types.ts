export type DiscoveryDifficulty = 'low' | 'medium' | 'high';

export interface DiscoveryIcp {
  priority: number;
  name: string;
  whyItFits: string;
  auditAngle: string;
  retainerPotential: string;
  difficultyLevel: DiscoveryDifficulty;
}

export interface HighProbabilityTarget {
  category: string;
  reason: string;
}

export interface DiscoverySource {
  name: string;
  useCase: string;
  safetyNote: string;
}

export interface LeadDiscoveryReport {
  date: string;
  recommendedIcps: DiscoveryIcp[];
  highProbabilityTargets: HighProbabilityTarget[];
  whereToLook: DiscoverySource[];
  searchQueries: string[];
  leadResearchWorkflow: string[];
  dailyDiscoveryPlan: string[];
  weeklyDiscoveryGoal: string[];
  suggestedNextCommands: string[];
  safetyRules: string[];
}
