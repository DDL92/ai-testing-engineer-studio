import { Client } from '../clientReports/types';
import { ContactReviewRecord } from '../contactReview/types';
import { Lead } from '../leads/types';
import { OpportunityItem } from '../pipeline/types';

export interface ClientOpsInput {
  leads: Lead[];
  clients: Client[];
  contactReviews: ContactReviewRecord[];
  commercialMode?: {
    totalLeads: number;
    commercialLeads: number;
    excludedDemoLeads: number;
  };
  pipelineMarkdownExists: boolean;
  topOpportunitiesMarkdownExists: boolean;
}

export interface ClientOpsAction {
  company: string;
  currentStage: string;
  opportunityScore: number;
  recommendedNextAction: string;
  reason: string;
  command: string;
  manualApprovalNote: string;
}

export interface ClientReadinessGroups {
  readyForOutreach: OpportunityItem[];
  readyForAudit: OpportunityItem[];
  readyForSow: OpportunityItem[];
  readyForClientPrep: OpportunityItem[];
  needsResearch: OpportunityItem[];
  shouldPause: OpportunityItem[];
}

export interface ClientOpsCenter {
  generatedAt: string;
  commercialMode: {
    enabled: boolean;
    totalLeads: number;
    commercialLeads: number;
    excludedDemoLeads: number;
  };
  opportunities: OpportunityItem[];
  clients: Client[];
  actions: ClientOpsAction[];
  readiness: ClientReadinessGroups;
  pipelineMarkdownExists: boolean;
  topOpportunitiesMarkdownExists: boolean;
}
