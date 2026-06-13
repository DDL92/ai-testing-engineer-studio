export type MessageDraftType =
  | 'linkedin_short'
  | 'linkedin_normal'
  | 'email'
  | 'follow_up'
  | 'interested_reply'
  | 'executive_angle'
  | 'audit_offer_angle';

export interface MessageDraft {
  type: MessageDraftType;
  label: string;
  body: string;
  wordLimit: number;
  wordCount: number;
}

export interface MessageReviewReport {
  generatedAt: string;
  companyId: string;
  companyName: string;
  currentOffer: string;
  goNoGo: string;
  evidenceBasis: string[];
  drafts: MessageDraft[];
  priorities: string[];
  safetyRules: string[];
}
