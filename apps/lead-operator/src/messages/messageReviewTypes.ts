export type MessageReviewStatus = 'pending_review' | 'approved' | 'needs_edit' | 'rejected' | 'sent' | 'archived';
export type ReviewableStatus = 'approved' | 'needs_edit' | 'rejected' | 'archived';
export type MessageChannel = 'linkedin' | 'email' | 'upwork' | 'instagram' | 'referral' | 'other' | 'unknown';
export type ReviewMessageType =
  | 'linkedin_dm'
  | 'cold_email'
  | 'instagram_dm'
  | 'upwork_proposal'
  | 'follow_up'
  | 'audit_based_proposal'
  | 'objection_response'
  | 'closing_message'
  | 'unknown';

export const messageReviewStatuses: MessageReviewStatus[] = ['pending_review', 'approved', 'needs_edit', 'rejected', 'sent', 'archived'];
export const reviewableStatuses: ReviewableStatus[] = ['approved', 'needs_edit', 'rejected', 'archived'];
export const messageChannels: MessageChannel[] = ['linkedin', 'email', 'upwork', 'instagram', 'referral', 'other', 'unknown'];
export const reviewMessageTypes: ReviewMessageType[] = [
  'linkedin_dm',
  'cold_email',
  'instagram_dm',
  'upwork_proposal',
  'follow_up',
  'audit_based_proposal',
  'objection_response',
  'closing_message',
  'unknown',
];

export interface MessageStatusHistoryItem {
  status: MessageReviewStatus;
  note: string;
  changedAt: string;
  changedBy: string;
}

export interface MessageReviewItem {
  id: string;
  leadId?: string;
  sourceFile: string;
  fileName: string;
  messageType: ReviewMessageType;
  channel: MessageChannel;
  status: MessageReviewStatus;
  statusHistory: MessageStatusHistoryItem[];
  reviewedAt: string;
  reviewedBy: string;
  sentAt: string;
  qualityWarnings: string[];
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageReviewQueue {
  generatedAt: string;
  items: MessageReviewItem[];
  summary: Record<MessageReviewStatus, number>;
}
