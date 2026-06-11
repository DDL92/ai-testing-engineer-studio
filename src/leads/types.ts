export type LeadStatus =
  | 'new'
  | 'reviewing'
  | 'audit-ready'
  | 'contacted'
  | 'call-booked'
  | 'proposal-sent'
  | 'won'
  | 'lost'
  | 'paused';

export type RecommendedOffer =
  | 'qa-audit'
  | 'playwright-starter-pack'
  | 'qa-automation-retainer'
  | 'agency-partner-retainer'
  | 'not-fit';

export type OutreachChannel =
  | 'linkedin'
  | 'email'
  | 'website-contact-form'
  | 'referral'
  | 'upwork'
  | 'manual-other';

export type OutreachStatus =
  | 'not-started'
  | 'message-prepared'
  | 'contacted'
  | 'follow-up-needed'
  | 'audit-offered'
  | 'audit-sold'
  | 'proposal-ready'
  | 'proposal-sent'
  | 'retainer-opportunity'
  | 'won'
  | 'lost'
  | 'paused';

export interface Lead {
  id: string;
  companyName: string;
  website: string;
  industry: string;
  source: string;
  status: LeadStatus;
  fitNotes: string;
  painPoints: string[];
  recommendedOffer: RecommendedOffer;
  score: number;
  createdAt: string;
  updatedAt: string;
  nextAction: string;
  contactName?: string;
  contactRole?: string;
  contactUrl?: string;
  outreachChannel?: OutreachChannel;
  outreachStatus?: OutreachStatus;
  lastContactedAt?: string;
  nextFollowUpDate?: string;
  outreachNotes?: string;
  qualificationSummary?: string;
}

export interface LeadScoreResult {
  score: number;
  reasons: string[];
  recommendedOffer: RecommendedOffer;
}

export type LeadScoringInput = Pick<
  Lead,
  'companyName' | 'website' | 'industry' | 'source' | 'fitNotes' | 'painPoints' | 'recommendedOffer'
>;

export type NewLeadInput = Omit<Lead, 'score' | 'createdAt' | 'updatedAt'> & {
  score?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type LeadUpdateInput = Partial<
  Pick<
    Lead,
    | 'companyName'
    | 'website'
    | 'industry'
    | 'source'
    | 'status'
    | 'fitNotes'
    | 'painPoints'
    | 'recommendedOffer'
    | 'score'
    | 'nextAction'
    | 'contactName'
    | 'contactRole'
    | 'contactUrl'
    | 'outreachChannel'
    | 'outreachStatus'
    | 'lastContactedAt'
    | 'nextFollowUpDate'
    | 'outreachNotes'
    | 'qualificationSummary'
  >
>;
