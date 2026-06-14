import { buildLeadQualificationReport } from '../webLeadQualification/normalizationRules';
import { NormalizedWebLead } from '../webLeadQualification/types';

export function collectLeadRotationCandidates(limit = 10): NormalizedWebLead[] {
  return buildLeadQualificationReport().topQualifiedLeads.slice(0, limit);
}
