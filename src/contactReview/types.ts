export type ContactStatus =
  | 'not-researched'
  | 'contact-found'
  | 'needs-review'
  | 'approved'
  | 'rejected';

export type MessageStatus =
  | 'not-prepared'
  | 'prepared'
  | 'approved'
  | 'sent-manually'
  | 'follow-up-needed'
  | 'replied'
  | 'not-interested'
  | 'paused';

export type ContactReviewChannel =
  | 'linkedin'
  | 'email'
  | 'website-contact-form'
  | 'referral'
  | 'manual-other';

export interface ContactReviewRecord {
  leadId: string;
  companyName: string;
  website: string;
  contactName: string;
  contactRole: string;
  contactUrl: string;
  channel: ContactReviewChannel;
  contactStatus: ContactStatus;
  messageStatus: MessageStatus;
  lastContactedAt: string;
  nextFollowUpDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactReviewSources {
  outreachPackExists: boolean;
  outreachPackPath: string;
  auditPackExists: boolean;
  auditPackPath: string;
}

export interface ContactReviewReportInput {
  record: ContactReviewRecord;
  sources: ContactReviewSources;
}

export interface ContactReviewUpdateInput {
  contactName?: string;
  contactRole?: string;
  contactUrl?: string;
  channel?: ContactReviewChannel;
  contactStatus?: ContactStatus;
  messageStatus?: MessageStatus;
  lastContactedAt?: string;
  nextFollowUpDate?: string;
  notes?: string;
}

export const contactStatusOptions: ContactStatus[] = [
  'not-researched',
  'contact-found',
  'needs-review',
  'approved',
  'rejected',
];

export const messageStatusOptions: MessageStatus[] = [
  'not-prepared',
  'prepared',
  'approved',
  'sent-manually',
  'follow-up-needed',
  'replied',
  'not-interested',
  'paused',
];

export const contactReviewChannelOptions: ContactReviewChannel[] = [
  'linkedin',
  'email',
  'website-contact-form',
  'referral',
  'manual-other',
];
