export const LIFECYCLE_STATUSES = [
  'discovered',
  'needs_verification',
  'qualified',
  'pack_ready',
  'approved_for_outreach',
  'contacted',
  'replied',
  'call_scheduled',
  'proposal_ready',
  'proposal_sent',
  'won',
  'lost',
  'archived',
] as const;

export type LeadType = 'qa' | 'website';
export type LifecycleStatus = typeof LIFECYCLE_STATUSES[number];

export interface LifecycleEntry {
  leadId: string;
  leadType: LeadType;
  businessName: string;
  status: LifecycleStatus;
  previousStatus: LifecycleStatus | null;
  updatedAt: string;
  lastActionAt: string;
  nextAction: string;
  sourceRecordPath: string | null;
  packPath: string | null;
  approvedByOperator: boolean;
  contactedAt: string | null;
  repliedAt: string | null;
  proposalSentAt: string | null;
  wonAt: string | null;
  lostAt: string | null;
  notes: string[];
  confirmedOneTimeRevenueUsd?: number | null;
  confirmedMrrUsd?: number | null;
  confirmedOffer?: string | null;
  revenueConfirmedAt?: string | null;
}

export interface CommercialFinding {
  description: string;
  source: string;
  observedAt: string;
  severity: 'low' | 'medium' | 'high';
  confidence: 'confirmed' | 'probable' | 'unknown' | 'rejected';
  commerciallyUsable: boolean;
}

export type ActionType =
  | 'review_reply'
  | 'prepare_call'
  | 'review_proposal'
  | 'send_approved_outreach_manually'
  | 'review_outreach_draft'
  | 'verify_lead'
  | 'review_audit'
  | 'review_demo'
  | 'generate_pack'
  | 'follow_up_manually'
  | 'archive_lead'
  | 'no_action';

export interface StudioAction {
  priority: number;
  leadId: string;
  leadType: LeadType;
  businessName: string;
  currentStatus: LifecycleStatus;
  actionType: ActionType;
  reason: string;
  evidencePath: string | null;
  exactExistingCommand: string | null;
  estimatedMinutes: number;
  manualApprovalRequired: boolean;
}

export interface FunnelCounts {
  leadsDiscovered: number;
  leadsVerified: number;
  leadsQualified: number;
  packsReady: number;
  outreachApproved: number;
  messagesSent: number;
  repliesReceived: number;
  callsScheduled: number;
  proposalsReady: number;
  proposalsSent: number;
  clientsWon: number;
  clientsLost: number;
}

export interface MetricsEvent {
  id: string;
  leadId: string;
  leadType: LeadType;
  event: keyof FunnelCounts;
  source: string | null;
  category: string | null;
  offer: string | null;
  recordedAt: string;
}

export interface StudioMetrics {
  events: MetricsEvent[];
}

export interface FollowUpItem {
  leadId: string;
  leadType: LeadType;
  businessName: string;
  currentStatus: LifecycleStatus;
  lastConfirmedAction: string;
  daysSinceLastAction: number;
  recommendedFollowUpType: string;
  reason: string;
  draftTextPath: string | null;
  recommendedDate: string;
  manualApprovalRequired: true;
  recommendedLifecycleCommand: string;
  due: boolean;
  finalFollowUpReached: boolean;
}

export interface TavilySnapshot {
  usageAvailable: boolean;
  planUsage: number | null;
  planLimit: number | null;
  websiteToday: number;
  websiteMonth: number;
  dailyLimit: number;
  monthlyLimit: number;
  sharedThresholdPercent: number;
  cachedQueries: number;
  eligibleQueries: number;
  warning: string | null;
}

export interface StudioCandidate {
  leadId: string;
  leadType: LeadType;
  businessName: string;
  source: string;
  category: string;
  offer: string;
  score: number;
  fixture: boolean;
  suggestedStatus: LifecycleStatus;
  sourceRecordPath: string;
  packPath: string | null;
  proposalPath: string | null;
  findings: CommercialFinding[];
  verificationCommand: string | null;
  packCommand: string | null;
}
