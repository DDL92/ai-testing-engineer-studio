export type RecommendedContactChannel = 'linkedin' | 'email' | 'company-contact-form' | 'unknown';
export type ContactReadiness = 'READY' | 'NEEDS_MANUAL_REVIEW' | 'NO_CANDIDATES_FOUND' | 'SEARCH_UNAVAILABLE';
export type SearchExecutionStatus = 'SUCCESS' | 'FAILED' | 'SKIPPED';
export type EmploymentEvidenceStatus = 'current' | 'past' | 'unknown';
export type CommercialFit = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ContactSearchDiagnostic {
  query: string;
  provider: 'tavily';
  status: SearchExecutionStatus;
  resultCount: number;
  errorCategory?: string;
  urlsConsidered: string[];
  rejectedUrls: Array<{
    url: string;
    reason: string;
  }>;
}

export interface ContactCandidate {
  id: string;
  companyName: string;
  fullName: string;
  title: string;
  sourceUrl: string;
  sourceType: string;
  evidenceSummary: string;
  roleScore: number;
  confidenceScore: number;
  currentEmploymentVerified: boolean;
  employmentStatus?: EmploymentEvidenceStatus;
  commercialFit?: CommercialFit;
  recommendedChannel: RecommendedContactChannel;
  publicEmail?: string;
  publicProfileUrl?: string;
  rejectionReasons: string[];
}

export interface ContactDiscoveryReport {
  generatedAt: string;
  companyName: string;
  companyDomain: string;
  recommendedOffer: string;
  commercialFit?: CommercialFit;
  status: ContactReadiness;
  primaryContact: ContactCandidate | null;
  backupContacts: ContactCandidate[];
  rejectedCandidates: ContactCandidate[];
  manualVerificationCandidates: ContactCandidate[];
  candidates: ContactCandidate[];
  searchQueries: string[];
  searchDiagnostics: ContactSearchDiagnostic[];
  totalSearchResults: number;
  limitations: string[];
  safetyRules: string[];
}

export interface ContactEvidenceInput {
  companyName: string;
  fullName: string;
  title: string;
  sourceUrl: string;
  sourceType: string;
  evidenceSummary: string;
  currentEmploymentVerified: boolean;
  commercialFit?: CommercialFit;
  employmentStatus?: EmploymentEvidenceStatus;
  snippetOnly?: boolean;
  staleEvidence?: boolean;
  publicEmail?: string;
  publicProfileUrl?: string;
}
