import { CompanyIdentity, DuplicateResolutionResult, EvidenceValidationResult } from './types';

export function resolveDuplicates(evidence: EvidenceValidationResult[]): DuplicateResolutionResult {
  const groups = new Map<string, EvidenceValidationResult[]>();

  for (const item of evidence) {
    const key = item.normalizedDomain || item.canonicalCompany.toLowerCase().replace(/[^a-z0-9]+/g, '');
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  const groupedItems = Array.from(groups.values());
  const canonicalRecords: CompanyIdentity[] = groupedItems.map(toCompanyIdentity);
  const duplicateGroups = groupedItems
    .filter(hasMultipleCompanyRepresentations)
    .map(toCompanyIdentity);

  return {
    canonicalRecords,
    duplicateGroups,
  };
}

function hasMultipleCompanyRepresentations(items: EvidenceValidationResult[]): boolean {
  const names = new Set(items.map((item) => rawNameKey(item.companyName)).filter(Boolean));
  return names.size > 1;
}

function rawNameKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function toCompanyIdentity(items: EvidenceValidationResult[]): CompanyIdentity {
  const first = items[0];
  const aliases = Array.from(new Set(items.flatMap((item) => [
    item.companyName,
    item.canonicalCompany,
    item.sourceTitle,
    ...item.match.reasons.filter((reason) => reason.includes('alias')),
  ]).filter(Boolean)));

  return {
    canonicalCompany: first?.canonicalCompany ?? 'Unknown Company',
    normalizedDomain: first?.normalizedDomain ?? '',
    aliases,
  };
}
