export type ActionType =
  | 'enrich_contact'
  | 'run_audit'
  | 'generate_proposal'
  | 'send_first_message'
  | 'follow_up_due'
  | 'wait_for_reply'
  | 'close_or_ignore'
  | 'convert'
  | 'review_lead'
  | 'no_action_needed';

export type ActionPriority = 'critical' | 'high' | 'medium' | 'low' | 'blocked';

export const supportedActionTypes: ActionType[] = [
  'enrich_contact',
  'run_audit',
  'generate_proposal',
  'send_first_message',
  'follow_up_due',
  'wait_for_reply',
  'close_or_ignore',
  'convert',
  'review_lead',
  'no_action_needed',
];

export interface ActionRecommendation {
  id: string;
  leadId: string;
  companyName: string;
  actionType: ActionType;
  priority: ActionPriority;
  score: number;
  category: string;
  expectedRevenueImpact: number;
  reason: string;
  suggestedCommand: string;
  optimizeCommand?: string;
  messageQueueStatus?: string;
  messageQueueCommand?: string;
  messageQueueReason?: string;
  suggestedMessagePath?: string;
  relatedDraftPath?: string;
  relatedReviewPath?: string;
  relatedAuditPath?: string;
  blockedReason?: string;
  createdAt: string;
}

export interface ActionCockpitSummary {
  totalLeadsReviewed: number;
  totalActions: number;
  actionableActions: number;
  blockedActions: number;
  totalExpectedRevenueImpact: number;
  highestPriorityAction: string;
  mainBottleneck: string;
  bestRevenueOpportunity: string;
}

export interface DailyOperatingStep {
  order: number;
  title: string;
  command: string;
  reason: string;
}

export interface ActionCockpit {
  generatedAt: string;
  summary: ActionCockpitSummary;
  actions: ActionRecommendation[];
  actionsByType: Record<ActionType, ActionRecommendation[]>;
  topActions: ActionRecommendation[];
  blockedLeads: ActionRecommendation[];
  sourceRecommendations: string[];
  dailyOperatingSequence: DailyOperatingStep[];
  links: {
    markdownPath: string;
    jsonPath: string;
    dailySummaryPath: string;
    pipelinePath: string;
    revenuePath: string;
    weeklyDashboardPath: string;
  };
}
