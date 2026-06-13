export type FollowUpCategory =
  | 'Needs First Message'
  | 'Needs Follow-Up'
  | 'Waiting For Response'
  | 'Proposal Review'
  | 'Paused'
  | 'Closed Won'
  | 'Closed Lost';

export interface ManualFollowUpRecord {
  company: string;
  contact: string;
  channel: string;
  last_action_date: string;
  next_followup_date: string;
  status: FollowUpCategory;
  notes: string;
}

export interface FollowUpQueueItem {
  companyName: string;
  contact: string;
  category: FollowUpCategory;
  reason: string;
  suggestedMessageType: string;
  priorityScore: number;
  expectedNextStep: string;
  sourceEvidence: string[];
}

export interface DailyFollowUpItem {
  rank: number;
  companyName: string;
  contact: string;
  reason: string;
  suggestedMessageType: string;
  priorityScore: number;
  expectedNextStep: string;
}

export interface FollowUpReview {
  whatIsStuck: string[];
  whatIsMoving: string[];
  needsDanielAttention: string[];
  biggestOpportunity: string;
  biggestRisk: string;
}

export interface FollowUpDashboardSummary {
  followUpQueue: number;
  todaysFollowUps: number;
  waitingResponses: number;
  openOpportunities: number;
  nextBestAction: string;
}

export interface FollowUpOperatingReport {
  generatedAt: string;
  queue: FollowUpQueueItem[];
  dailyPlan: DailyFollowUpItem[];
  review: FollowUpReview;
  dashboard: FollowUpDashboardSummary;
  safetyRules: string[];
}
