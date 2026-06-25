export type OutcomeStatus =
  | 'not_sent'
  | 'sent'
  | 'replied'
  | 'no_reply'
  | 'meeting_booked'
  | 'proposal_sent'
  | 'won'
  | 'lost'
  | 'paused';

export interface OutcomeRecord {
  company: string;
  contact: string;
  channel: string;
  date: string;
  action_type: string;
  message_sent: boolean;
  response_status: OutcomeStatus;
  meeting_status: OutcomeStatus;
  proposal_status: OutcomeStatus;
  deal_status: OutcomeStatus;
  revenue_status: OutcomeStatus;
  amount: number;
  notes: string;
  next_action: string;
  follow_up_date?: string;
  contact_role?: string;
  message_type?: string;
}

export interface OutcomeSummary {
  generatedAt: string;
  totalRecords: number;
  messagesSent: number;
  replies: number;
  meetings: number;
  proposals: number;
  wins: number;
  losses: number;
  replyRate: string;
  revenueRecorded: number;
  nextManualMessage: string;
  hasOutcomes: boolean;
  safetyRules: string[];
}
