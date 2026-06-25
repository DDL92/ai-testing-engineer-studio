import { LeadRecord, LeadSourceType, LeadVertical } from './types';

export interface RawLeadSignal {
  id: string;
  vertical: LeadVertical;
  sourceType: LeadSourceType;
  sourceUrl: string;
  sourceName: string;
  rawText: string;
  locationHint: string | null;
  dateHint: string | null;
  serviceHint: string | null;
  contactHint: string | null;
  collectedAt: string;
  notes: string | null;
}

export type NormalizedLeadCandidate = Omit<LeadRecord, 'status'> & {
  rawSignalId: string;
  sourceName: string;
  contactHint: string | null;
  status: 'needs_review';
};

export interface IntakeSourceBatch {
  generatedAt: string;
  source: 'manual_sample_intake';
  rawSignals: RawLeadSignal[];
  normalizedCandidates: NormalizedLeadCandidate[];
  safetyRules: string[];
}
