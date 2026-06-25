export type LeadVertical =
  | 'travel_leads'
  | 'catering_leads'
  | 'wedding_leads'
  | 'real_estate_leads'
  | 'website_leads'
  | 'qa_leads';

export type LeadSourceType =
  | 'public_forum'
  | 'public_social_post'
  | 'public_directory'
  | 'public_job_post'
  | 'public_review'
  | 'manual_research'
  | 'sample_fixture';

export type LeadStatus =
  | 'new'
  | 'needs_human_review'
  | 'qualified'
  | 'rejected'
  | 'delivered';

export interface LeadScoreBreakdown {
  intentClarity: number;
  locationRelevance: number;
  budgetSignal: number;
  urgencyDate: number;
  sourceQuality: number;
  contactability: number;
  fitWithClientOffer: number;
  duplicateRisk: number;
}

export interface LeadRecord {
  id: string;
  vertical: LeadVertical;
  nameOrHandle: string;
  sourceUrl: string;
  sourceType: LeadSourceType;
  location: string;
  intentSummary: string;
  requestedService: string;
  dateSignal: string | null;
  budgetSignal: string | null;
  urgency: 'low' | 'medium' | 'high';
  score: number;
  scoreBreakdown: LeadScoreBreakdown;
  salesAngle: string;
  suggestedFirstMessage: string;
  riskFlags: string[];
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LeadPack {
  generatedAt: string;
  vertical: LeadVertical;
  leads: LeadRecord[];
  summary: {
    totalLeads: number;
    averageScore: number;
    topLeadId: string | null;
    riskFlagCount: number;
  };
}
