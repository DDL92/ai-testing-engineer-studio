export interface OperatorUxSummary {
  generatedAt: string;
  studioStatus: string;
  revenueStatus: string;
  topLead: string;
  topOffer: string;
  topAction: string;
  followUpStatus: string;
  systemHealth: string;
  snapshotStatus: string;
  recoveryStatus: string;
  topRevenueOpportunity: string;
  nextManualAction: string;
  currentBlockers: string[];
  importantWarnings: string[];
  todayAtAGlance: string[];
  quickActions: OperatorQuickAction[];
  safetyRules: string[];
}

export interface OperatorQuickAction {
  label: string;
  command: string;
  purpose: string;
}
