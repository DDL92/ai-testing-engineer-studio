import { Lead, LeadScoreResult, RecommendedOffer } from '../leads/types';

export type ClientWorkflowDocumentName =
  | 'discovery-call-prep.md'
  | 'audit-sale-plan.md'
  | 'onboarding-checklist.md'
  | 'delivery-plan.md'
  | 'retainer-conversion-plan.md';

export interface LocalWorkflowSource {
  label: string;
  path: string;
  exists: boolean;
  content?: string;
}

export interface ClientWorkflowInput {
  lead: Lead;
  score: LeadScoreResult;
  researchPack: LocalWorkflowSource;
  auditPack: LocalWorkflowSource;
  outreachPack: LocalWorkflowSource;
  contactReview: LocalWorkflowSource;
}

export interface ClientWorkflowDocument {
  fileName: ClientWorkflowDocumentName;
  title: string;
  body: string;
}

export interface ClientWorkflowRecommendation {
  primaryOffer: RecommendedOffer;
  auditPriceRange: string;
  starterPriceRange: string;
  retainerPriceRange: string;
  suggestedAuditScope: string[];
  discoveryQuestions: string[];
}
