export type RecommendedContactMethod =
  | 'email'
  | 'phone'
  | 'whatsapp'
  | 'platform_message'
  | 'website_form'
  | 'source_reply'
  | 'client_should_contact'
  | 'not_available'
  | 'manual_review_required';

export type VerificationReadiness =
  | 'ready'
  | 'needs_review'
  | 'missing_contact_method'
  | 'missing_buyer_evidence'
  | 'missing_recency'
  | 'not_ready';

export interface CandidateEvidence {
  buyerEvidence: string[];
  buyerEvidenceCount: number;
  recencyEvidence: string[];
  recencyEvidenceCount: number;
  contactMethodEvidence: string[];
  recommendedContactMethod: RecommendedContactMethod;
  contactMethodReason: string;
  contactActionStatus: 'manual_review_required';
  verificationReadiness: VerificationReadiness;
  readinessReasons: string[];
}
