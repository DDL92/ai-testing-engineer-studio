import { RecommendedOffer } from '../leads/types';

export type DailyDiscoverySourceType = 'local_seed_catalog' | 'local_discovered_leads';

export interface DailyDiscoveryState {
  schemaVersion: number;
  lastRunAt: string | null;
  lastRunDate: string | null;
  schedule: {
    localTime: '07:00';
    timezone: 'Mac local time';
  };
  notes: string[];
  safetyRules: string[];
}

export interface DailyDiscoverySource {
  id: string;
  name: string;
  type: DailyDiscoverySourceType;
  enabled: boolean;
  path: string;
  description: string;
  allowNetwork: false;
  requiresLogin: false;
  approvedForDailyRun: boolean;
}

export interface DailyDiscoveredLead {
  id: string;
  companyName: string;
  website: string;
  industry: string;
  sourceId: string;
  sourceName: string;
  sourcePath: string;
  discoveredAt: string;
  firstSeenAt: string;
  lastSeenAt: string;
  isNewToday: boolean;
  alreadyKnown: boolean;
  score: number;
  recommendedOffer: RecommendedOffer;
  fitNotes: string;
  painPoints: string[];
  scoreReasons: string[];
  recommendedAction: string;
  warnings: string[];
}

export interface DailyDiscoveryStore {
  generatedAt: string;
  leads: DailyDiscoveredLead[];
  safetyRules: string[];
}

export interface DailyLeadDiscoveryReport {
  generatedAt: string;
  runDate: string;
  sources: DailyDiscoverySource[];
  leads: DailyDiscoveredLead[];
  newLeadsToday: DailyDiscoveredLead[];
  topFive: DailyDiscoveredLead[];
  topNewLead: DailyDiscoveredLead | undefined;
  bestOffer: string;
  recommendedNextAction: string;
  safetyRules: string[];
}

export interface DailyLeadDiscoveryDashboard {
  newLeadsToday: number;
  topNewLead: string;
  topFiveLeads: string;
  bestOffer: string;
  recommendedNextAction: string;
}
