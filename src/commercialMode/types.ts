import { ContactReviewRecord } from '../contactReview/types';
import { Lead } from '../leads/types';
import { OpportunityItem } from '../pipeline/types';

export interface CommercialLeadDecision {
  lead: Lead;
  isCommercial: boolean;
  reasons: string[];
}

export interface CommercialModeSummary {
  totalLeads: number;
  commercialLeads: Lead[];
  demoLeads: CommercialLeadDecision[];
  commercialPercentage: number;
}

export interface CommercialModeInput {
  generatedAt: string;
  leads: Lead[];
  contactReviews: ContactReviewRecord[];
}

export interface CommercialModeReport {
  generatedAt: string;
  summary: CommercialModeSummary;
  topCommercialOpportunities: OpportunityItem[];
  topCommercialActions: string[];
}
