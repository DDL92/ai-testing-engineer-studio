import { ContactReviewRecord } from '../contactReview/types';
import { Lead } from '../leads/types';
import { FollowupQueueItem } from '../outreachTracking/types';

export interface OutreachExecutionArtifacts {
  researchPack: boolean;
  leadPack: boolean;
  auditPack: boolean;
  outreachPack: boolean;
  contactReview: boolean;
  proposalCenter: boolean;
  sowReadiness: boolean;
}

export interface OutreachExecutionSource {
  label: string;
  path: string;
  exists: boolean;
  excerpt: string;
}

export interface OutreachExecutionLead {
  lead: Lead;
  contactReview?: ContactReviewRecord;
  artifacts: OutreachExecutionArtifacts;
  readinessStatus: string;
  contactResearchStatus: string;
  messageStatus: string;
  followUpStatus: string;
  recommendedChannel: string;
  nextAction: string;
  suggestedCommand: string;
  missingAssets: string[];
}

export interface OutreachExecutionInput {
  generatedAt: string;
  leads: Lead[];
  contactReviews: ContactReviewRecord[];
  contextSources: OutreachExecutionSource[];
  actualFollowUps: FollowupQueueItem[];
}

export interface OutreachExecutionReport {
  generatedAt: string;
  totalLeads: number;
  commercialLeadCount: number;
  excludedLeadCount: number;
  topFive: OutreachExecutionLead[];
  contextSources: OutreachExecutionSource[];
  actualFollowUps: FollowupQueueItem[];
}

export interface MessageDraftSet {
  linkedinConnectionNote: string;
  linkedinFollowUpMessage: string;
  emailDraft: string;
  websiteContactFormDraft: string;
  shortFollowUpMessage: string;
}
