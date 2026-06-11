export type LeadStatus =
  | 'new'
  | 'scored'
  | 'approved'
  | 'contacted'
  | 'replied'
  | 'audit_offered'
  | 'audit_completed'
  | 'proposal_sent'
  | 'won'
  | 'lost'
  | 'ignored';

export type LeadCategory = 'hot' | 'warm' | 'low' | 'ignore';

export interface ScoreBreakdown {
  positive: string[];
  negative: string[];
  total: number;
  category: LeadCategory;
}

export interface Lead {
  id: string;
  companyName: string;
  website: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  linkedinUrl: string;
  source: string;
  sourceId?: string;
  sourceName?: string;
  sourceCategory?: string;
  sourceUrl: string;
  matchedKeywords?: string[];
  excludedKeywords?: string[];
  sourcePriority?: number;
  foundAt?: string;
  detectedPainPoint: string;
  techStackHints: string[];
  qaFitReason: string;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  status: LeadStatus;
  suggestedOffer: string;
  nextAction: string;
  createdAt: string;
  updatedAt: string;
  lastContactedAt: string;
  nextFollowUpAt: string;
  notes: string;
}

export interface LeadSource {
  id: string;
  name: string;
  type: 'rss' | 'public_page' | 'manual_json' | 'manual_text';
  url?: string;
  path?: string;
  enabled: boolean;
  category?: string;
  priority?: number;
  maxResults?: number;
  includeKeywords?: string[];
  excludeKeywords?: string[];
  allowedDomains?: string[];
  manualReviewRequired?: boolean;
  notes: string;
}

export interface Opportunity {
  id: string;
  companyName: string;
  website: string;
  source: string;
  sourceId?: string;
  sourceName?: string;
  sourceCategory?: string;
  sourceUrl: string;
  matchedKeywords?: string[];
  excludedKeywords?: string[];
  sourcePriority?: number;
  foundAt?: string;
  title: string;
  summary: string;
  detectedKeywords: string[];
  score: number;
  scoreBreakdown: ScoreBreakdown;
  category: LeadCategory;
  status?: LeadStatus;
  suggestedOffer: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface DailySummary {
  generatedAt: string;
  sourcesChecked: number;
  opportunitiesFound: number;
  hotLeads: number;
  warmLeads: number;
  ignoredLeads: number;
  hotLeadsNeedingApproval?: string[];
  warmLeadsWorthReviewing?: string[];
  auditCompletedNoProposal?: string[];
  contactedNeedingFollowUp?: string[];
  missingWebsiteOrContactInfo?: string[];
  topRecommendedActions: string[];
  suggestedMessagesReadyForApproval: string[];
  warnings: string[];
  nextSteps: string[];
}

export type OutreachChannel = 'linkedin' | 'email' | 'upwork' | 'instagram' | 'referral' | 'other';

export interface OutreachRecord {
  id: string;
  leadId: string;
  companyName: string;
  channel: OutreachChannel;
  messageType: string;
  sentAt: string;
  nextFollowUpAt: string;
  note: string;
}

export type BillingType = 'one_time' | 'monthly';
export type OfferType = 'free_mini_audit' | 'detailed_qa_audit' | 'playwright_starter_pack' | 'qa_automation_setup' | 'monthly_qa_maintenance' | 'custom';

export interface ConversionRecord {
  id: string;
  leadId: string;
  companyName: string;
  offerType: OfferType;
  amount: number;
  billingType: BillingType;
  convertedAt: string;
  projectedMonthlyRevenue: number;
  projectedOneTimeRevenue: number;
  note: string;
}

export interface ClientRecord {
  id: string;
  leadId: string;
  companyName: string;
  website: string;
  contactName: string;
  contactEmail: string;
  linkedinUrl: string;
  activeOffers: ConversionRecord[];
  projectedMonthlyRevenue: number;
  projectedOneTimeRevenue: number;
  createdAt: string;
  updatedAt: string;
  notes: string;
}

export type CloseResult = 'lost' | 'ignored' | 'not_fit';
export type CloseReason = 'no_budget' | 'no_response' | 'not_fit' | 'wrong_timing' | 'already_has_qa' | 'too_small' | 'too_enterprise' | 'bad_contact_info' | 'low_quality_lead' | 'other';

export interface ClosedLeadRecord {
  id: string;
  leadId: string;
  companyName: string;
  result: CloseResult;
  reason: CloseReason;
  closedAt: string;
  note: string;
}
