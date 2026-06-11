import { Lead } from '../leads/types';

export type CandidateApprovalStatus = 'approved' | 'rejected' | 'pending';
export type CandidatePriority = 'High' | 'Medium' | 'Low';

export interface CandidateQueueRow {
  company: string;
  website: string;
  category: string;
  source: string;
  whyItMightFit: string;
  riskUnknown: string;
  approvalText: string;
}

export interface LeadIntakeCandidate extends CandidateQueueRow {
  status: CandidateApprovalStatus;
  priority: CandidatePriority;
  suggestedNextAction: string;
  rejectionReason?: string;
}

export interface LeadIntakeInput {
  generatedAt: string;
  candidateQueuePath: string;
  candidates: LeadIntakeCandidate[];
  existingLeads: Lead[];
}

export interface LeadIntakeSummary {
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  highPriorityCount: number;
  categoryBreakdown: Record<string, number>;
  recommendedNextAction: string;
}

export interface LeadIntakeReport {
  approvedCandidates: LeadIntakeCandidate[];
  rejectedCandidates: LeadIntakeCandidate[];
  pendingCandidates: LeadIntakeCandidate[];
  summary: LeadIntakeSummary;
}
