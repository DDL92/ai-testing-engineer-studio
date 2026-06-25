export type OutreachChannel =
  | 'linkedin'
  | 'email'
  | 'website-form'
  | 'phone'
  | 'referral'
  | 'other';

export type OutreachStatus =
  | 'invitation-sent'
  | 'message-sent'
  | 'connected'
  | 'replied'
  | 'follow-up-due'
  | 'waiting'
  | 'closed-no-response'
  | 'do-not-contact';

export type OutreachSource = 'Outcome Tracking' | 'Lead Operator' | 'Legacy Outreach';

export interface OutreachRecord {
  companyId: string;
  companyName: string;
  contactName: string;
  contactRole: string;
  channel: OutreachChannel;
  status: OutreachStatus;
  sentAt: string;
  lastTouchAt: string;
  nextFollowUpAt: string | null;
  messageType: string;
  notes: string;
  humanApproved: boolean;
  source?: OutreachSource;
  messageSent?: boolean;
  replyReceived?: boolean;
}

export interface OutreachSummary {
  totalCompaniesContacted: number;
  totalContacts: number;
  invitationsSent: number;
  messagesSent: number;
  connected: number;
  replied: number;
  waiting: number;
  followUpsDue: number;
  preparedButUnsent: number;
  contactDiscoveryCandidates: number;
  companiesWithBestCoverage: CompanyOutreachStatus[];
  companiesNeedingMoreContacts: CompanyOutreachStatus[];
}

export interface CompanyOutreachStatus {
  companyId: string;
  companyName: string;
  contactCount: number;
  invitationCount: number;
  messageCount: number;
  connectedCount: number;
  repliedCount: number;
  followUpsDue: number;
  coverageScore: number;
}

export interface FollowupQueueItem {
  record: OutreachRecord;
  daysSinceLastTouch: number;
  reason: string;
  recommendedAction: string;
}

export interface OutreachContext {
  preparedButUnsent: string[];
  contactDiscoveryCandidates: string[];
}
