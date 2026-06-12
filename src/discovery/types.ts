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

export interface DiscoverySeedCompany {
  companyName: string;
  website: string;
  industry: string;
  niches: string[];
  fitNotes: string;
  painPoints: string[];
  suggestedOffer: 'qa-audit' | 'playwright-starter-pack' | 'qa-automation-retainer' | 'agency-partner-retainer';
}

export interface DiscoveredLeadCandidate {
  id: string;
  companyName: string;
  website: string;
  industry: string;
  source: string;
  niche: string;
  score: number;
  recommendedOffer: string;
  fitNotes: string;
  painPoints: string[];
  nextAction: string;
  scoreReasons: string[];
}

export interface LeadDiscoveryEngineRun {
  generatedAt: string;
  niche: string;
  source: string;
  candidates: DiscoveredLeadCandidate[];
  safetyRules: string[];
  nextCommands: string[];
}
