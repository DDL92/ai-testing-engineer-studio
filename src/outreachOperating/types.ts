import { ContactReviewRecord } from '../contactReview/types';
import { Lead } from '../leads/types';

export interface OutreachArtifacts {
  researchPack: boolean;
  leadPack: boolean;
  auditPack: boolean;
  outreachPack: boolean;
  contactReview: boolean;
  sow: boolean;
}

export interface ExcludedLead {
  lead: Lead;
  reasons: string[];
}

export interface LocalContextSource {
  label: string;
  path: string;
  exists: boolean;
  excerpt: string;
}

export interface OutreachCandidate {
  lead: Lead;
  contactReview?: ContactReviewRecord;
  artifacts: OutreachArtifacts;
  priorityScore: number;
  whySelected: string;
  availableAssets: string[];
  missingAssets: string[];
  nextAction: string;
  suggestedCommand: string;
}

export interface OutreachOperatingInput {
  generatedAt: string;
  leads: Lead[];
  contactReviews: ContactReviewRecord[];
  contextSources: LocalContextSource[];
}

export interface OutreachOperatingReport {
  generatedAt: string;
  totalLeads: number;
  excludedLeads: ExcludedLead[];
  eligibleLeads: OutreachCandidate[];
  topFive: OutreachCandidate[];
  contextSources: LocalContextSource[];
}
