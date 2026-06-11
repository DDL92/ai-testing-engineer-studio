import { Client } from '../clientReports/types';
import { First50ProgressSummary } from '../first50/first50Progress';
import { Lead } from '../leads/types';

export interface GeneratedOutputReference {
  label: string;
  path: string;
  type: 'file' | 'directory';
}

export interface CockpitRevenueSnapshot {
  estimatedMrr: number;
  activeClientCount: number;
  totalLeadCount: number;
  first50Progress: First50ProgressSummary;
  topRetainerOpportunities: Lead[];
}

export interface ActionCockpit {
  date: string;
  todayFocus: string[];
  revenueSnapshot: CockpitRevenueSnapshot;
  topLeads: Lead[];
  activeClients: Client[];
  generatedFiles: GeneratedOutputReference[];
  nextManualActions: string[];
  recommendedCommands: string[];
  safetyRules: string[];
}
