import { Client } from '../clientReports/types';
import { Lead } from '../leads/types';

export type MobileSystemHealthStatus = 'GREEN' | 'YELLOW' | 'RED';

export interface MobileContextSource {
  label: string;
  path: string;
  exists: boolean;
  excerpt: string;
}

export interface MobileReportGroupHealth {
  label: string;
  status: MobileSystemHealthStatus;
  availableReports: string[];
  missingReports: string[];
}

export interface MobileAction {
  title: string;
  source: string;
  command: string;
  approvalRequired: string;
}

export interface MobileOpportunity {
  company: string;
  score: number;
  status: string;
  recommendedOffer: string;
  nextAction: string;
  source: string;
}

export interface MobileRevenueSnapshot {
  bookedMrr: number;
  projectedMrr: string;
  auditOpportunities: number;
  retainerOpportunities: number;
  revenueSource: string;
  consistencyWarnings: string[];
}

export interface MobileClientStatus {
  active: number;
  pending: number;
  paused: number;
  completed: number;
  notes: string[];
}

export interface MobileFollowUpItem {
  company: string;
  dueDate: string;
  channel: string;
  action: string;
  source: string;
}

export interface MobileCommandCenterInput {
  generatedAt: string;
  today: string;
  leads: Lead[];
  clients: Client[];
  contextSources: MobileContextSource[];
}

export interface MobileCommandCenterReport {
  generatedAt: string;
  today: string;
  topActions: MobileAction[];
  topOpportunities: MobileOpportunity[];
  revenueSnapshot: MobileRevenueSnapshot;
  clientStatus: MobileClientStatus;
  followUpQueue: MobileFollowUpItem[];
  approvalsNeeded: string[];
  systemHealth: MobileSystemHealthStatus;
  reportGroups: MobileReportGroupHealth[];
  contextSources: MobileContextSource[];
}
