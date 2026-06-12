import { ContactReviewRecord } from '../contactReview/types';
import { Lead } from '../leads/types';

export type ReadinessStatus = 'READY' | 'PARTIAL' | 'NOT READY';
export type ComplexityLevel = 'Low' | 'Medium' | 'High';

export interface ClientReadinessArtifacts {
  researchPack: boolean;
  leadPack: boolean;
  auditPack: boolean;
  outreachPack: boolean;
  contactReview: boolean;
  clientWorkflow: boolean;
  sow: boolean;
}

export interface ClientReadinessSource {
  label: string;
  path: string;
  exists: boolean;
  excerpt: string;
}

export interface ClientReadinessCandidate {
  lead: Lead;
  contactReview?: ContactReviewRecord;
  artifacts: ClientReadinessArtifacts;
  readinessScore: number;
  readinessStatus: ReadinessStatus;
  outreachStatus: string;
  auditStatus: string;
  missingAssets: string[];
  availableAssets: string[];
  revenuePotential: string;
  scopeClarity: ReadinessStatus;
  auditReadiness: ReadinessStatus;
  retainerFit: ReadinessStatus;
  estimatedComplexity: ComplexityLevel;
  nextAction: string;
  suggestedCommand: string;
  scoreReasons: string[];
}

export interface ClientReadinessInput {
  generatedAt: string;
  leads: Lead[];
  contactReviews: ContactReviewRecord[];
  contextSources: ClientReadinessSource[];
}

export interface ClientReadinessReport {
  generatedAt: string;
  totalLeads: number;
  commercialLeads: number;
  excludedLeads: number;
  candidates: ClientReadinessCandidate[];
  topFive: ClientReadinessCandidate[];
  contextSources: ClientReadinessSource[];
}
