export type ContactRotationStatus =
  | 'READY'
  | 'CONTACT_BLOCKED'
  | 'NO_CANDIDATES_FOUND'
  | 'SEARCH_UNAVAILABLE'
  | 'LOW_COMMERCIAL_FIT'
  | 'NOT_EVALUATED';

export interface ContactAwareLeadEvaluation {
  companyId: string;
  companyName: string;
  rank: number;
  recommendedOffer: string;
  evidenceStatus: string;
  contactStatus: ContactRotationStatus;
  primaryContactName?: string;
  primaryContactTitle?: string;
  primaryContactConfidence?: number;
  primaryContactSource?: string;
  reason: string;
  contactPackPath?: string;
}

export interface ContactAwareRotationReport {
  generatedAt: string;
  status: 'READY' | 'NO_CONTACT_READY_LEAD' | 'SEARCH_UNAVAILABLE';
  selectedLead?: ContactAwareLeadEvaluation;
  readyLeads: ContactAwareLeadEvaluation[];
  evaluatedLeads: ContactAwareLeadEvaluation[];
  skippedLeads: ContactAwareLeadEvaluation[];
  nextManualAction: string;
  safetyRules: string[];
}
