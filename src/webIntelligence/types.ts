import { PainSignal } from '../webPainMining/types';
import { WebLeadCandidate } from '../webLeadDiscovery/types';

export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type EvidenceDecision = 'accepted' | 'suspicious' | 'rejected';
export type EvidenceSourceQuality = 'official-site' | 'official-docs' | 'verified-review' | 'directory' | 'blog' | 'generic-article';
export type IntelligenceReadinessStatus = 'NOT READY' | 'PARTIAL' | 'READY';

export interface CompanyIdentity {
  canonicalCompany: string;
  normalizedDomain: string;
  aliases: string[];
}

export interface CompanyMatchResult {
  company: string;
  normalizedDomain: string;
  confidence: ConfidenceLevel;
  score: number;
  reasons: string[];
}

export interface EvidenceInput {
  companyName: string;
  sourceUrl: string;
  sourceTitle: string;
  observedText: string;
  sourceType: 'lead' | 'pain';
  raw: WebLeadCandidate | PainSignal;
}

export interface EvidenceValidationResult extends EvidenceInput {
  canonicalCompany: string;
  normalizedDomain: string;
  sourceDomain: string;
  sourceQuality: EvidenceSourceQuality;
  decision: EvidenceDecision;
  confidenceScore: number;
  confidence: ConfidenceLevel;
  relevanceScore: number;
  falsePositiveReasons: string[];
  match: CompanyMatchResult;
}

export interface CompanyEvidenceSummary {
  company: string;
  normalizedDomain: string;
  aliases: string[];
  evidenceCount: number;
  sourceCount: number;
  sourceDiversity: number;
  painSignals: number;
  leadCategory: string;
  averageConfidence: number;
  companyConfidence: ConfidenceLevel;
  evidenceConfidence: ConfidenceLevel;
  falsePositiveRisk: ConfidenceLevel;
}

export interface DuplicateResolutionResult {
  canonicalRecords: CompanyIdentity[];
  duplicateGroups: CompanyIdentity[];
}

export interface PainConfidenceResult {
  company: string;
  category: string;
  confidenceScore: number;
  confidence: ConfidenceLevel;
  evidenceCount: number;
  sourceCount: number;
  reasons: string[];
}

export interface IntelligenceReadiness {
  companyConfidence: number;
  evidenceConfidence: number;
  painConfidence: number;
  duplicateQuality: number;
  rankingConfidence: number;
  status: IntelligenceReadinessStatus;
}

export interface WebIntelligenceReport {
  generatedAt: string;
  evidence: EvidenceValidationResult[];
  acceptedEvidence: EvidenceValidationResult[];
  suspiciousEvidence: EvidenceValidationResult[];
  rejectedEvidence: EvidenceValidationResult[];
  companySummaries: CompanyEvidenceSummary[];
  duplicateResolution: DuplicateResolutionResult;
  painConfidence: PainConfidenceResult[];
  readiness: IntelligenceReadiness;
}
