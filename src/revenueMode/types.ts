export type RevenueModePriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type RevenueModeFollowUpCategory =
  | 'Waiting Reply'
  | 'Proposal Review'
  | 'Access'
  | 'Delivery Approval'
  | 'Evidence Review';

export interface RevenueModeAction {
  priority: RevenueModePriority;
  action: string;
  reason: string;
  approvalRequired: boolean;
}

export interface RevenueModeFollowUp {
  company: string;
  category: RevenueModeFollowUpCategory;
  status: string;
  nextManualAction: string;
}

export interface RevenueModeInput {
  generatedAt: string;
  studioHealth: string;
  doctorStatus: string;
  actionableLead: string;
  commercialReadiness: string;
  evidenceStatus: string;
  evidencePackageStatus: string;
  deliveryAssetsStatus: string;
  recommendedOffer: string;
  currentMrr: number;
  outcomeCount: number;
  discoveredLeadCount: number;
  qualifiedLeadCount: number;
  followUps: RevenueModeFollowUp[];
}

export interface RevenueModeGoals {
  currentMrr: number;
  targetMrrLow: number;
  targetMrrHigh: number;
  gapLow: number;
  gapHigh: number;
  estimatedAuditsForLowTarget: number;
  estimatedRetainersForLowTarget: number;
  estimatedClientsForLowTarget: number;
  planningBasis: string;
}

export interface RevenueModeReport {
  generatedAt: string;
  date: string;
  status: 'ACTIVE' | 'NEEDS REVIEW';
  studioHealth: string;
  doctorStatus: string;
  actionableLead: string;
  commercialReadiness: string;
  evidenceStatus: string;
  recommendedOffer: string;
  goals: RevenueModeGoals;
  topAction: string;
  todayActions: RevenueModeAction[];
  actionQueue: RevenueModeAction[];
  followUpQueue: RevenueModeFollowUp[];
  biggestBottleneck: string;
  tomorrowFocus: string;
  outcomeCount: number;
  discoveredLeadCount: number;
  qualifiedLeadCount: number;
  safetyRules: string[];
}

export interface RevenueModeDashboard {
  revenueModeStatus: string;
  morningBrief: string;
  todaysTopAction: string;
  revenueGoal: string;
  priorityQueue: string;
  followUpsWaiting: number;
  biggestBottleneck: string;
  tomorrowFocus: string;
}
