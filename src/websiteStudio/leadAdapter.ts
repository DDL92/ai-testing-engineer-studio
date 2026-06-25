import fs = require('fs');
import path = require('path');
import type { Lead } from '../leads/types';
import { analyzeWebsiteLead } from './opportunityScorer';
import { inspectPublicWebsite } from './publicWebsiteInspector';
import {
  ImportCounts,
  WEBSITE_CATEGORIES,
  WebsiteCandidateInput,
  WebsiteLeadRecord,
  WebsiteSourceReference,
} from './types';

type ReusedLeadFields = Pick<
  Lead,
  'id' | 'companyName' | 'industry' | 'source' | 'status' | 'fitNotes' | 'createdAt' | 'updatedAt' | 'nextAction'
>;

const storePath = path.join(process.cwd(), 'data', 'website-studio', 'leads.json');

export function readWebsiteLeads(): WebsiteLeadRecord[] {
  if (!fs.existsSync(storePath)) return [];
  const raw = fs.readFileSync(storePath, 'utf8').trim();
  return raw ? (JSON.parse(raw) as WebsiteLeadRecord[]).map(refreshStoredAnalysis) : [];
}

export function writeWebsiteLeads(leads: WebsiteLeadRecord[]): void {
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, `${JSON.stringify(leads, null, 2)}\n`, 'utf8');
}

export async function importWebsiteCandidates(
  inputs: WebsiteCandidateInput[],
  options: { dryRun?: boolean; force?: boolean } = {},
): Promise<{ counts: ImportCounts; leads: WebsiteLeadRecord[]; importedLeadIds: string[] }> {
  const working = [...readWebsiteLeads()];
  const counts: ImportCounts = { added: 0, updated: 0, skipped: 0, invalid: 0 };
  const importedLeadIds: string[] = [];

  for (const input of inputs) {
    const validation = validateCandidate(input);
    if (!validation.candidate) {
      counts.invalid += 1;
      continue;
    }

    const identityIndex = findMatchingLeadIndex(working, validation.candidate);
    const existing = identityIndex >= 0 ? working[identityIndex] : undefined;
    const candidate = mergeCandidate(existing, validation.candidate, options.force ?? false);

    if (existing && candidateMatchesRecord(candidate, existing) && !hasNewSources(candidate, existing) && !options.force) {
      counts.skipped += 1;
      continue;
    }

    const inspection = options.dryRun
      ? existing?.inspection ?? await inspectPublicWebsite(null)
      : await inspectPublicWebsite(candidate.websiteUrl);
    const analysis = analyzeWebsiteLead(candidate, inspection);
    const now = new Date().toISOString();
    const reusedLead = toReusedLeadFields(candidate, existing, now);
    const canonicalWebsite = inspection.canonicalWebsiteUrl ?? candidate.websiteUrl ?? null;
    const canonicalName = inspection.canonicalSiteName ?? candidate.businessName;
    const record: WebsiteLeadRecord = {
      lead: {
        ...reusedLead,
        companyName: canonicalName,
        website: canonicalWebsite,
        industry: candidate.category,
        status: existing?.lead.status ?? 'new',
        nextAction: analysis.nextAction,
      },
      location: candidate.location ?? null,
      publicContact: {
        instagramUrl: candidate.instagramUrl ?? null,
        facebookUrl: candidate.facebookUrl ?? null,
        email: candidate.email ?? null,
        phone: candidate.phone ?? null,
      },
      discovery: {
        sources: mergeSourceReferences(existing?.discovery?.sources ?? [], candidate.sources ?? sourceReferencesFrom(candidate)),
      },
      inspection,
      analysis,
      ...(inspection.canonicalWebsiteUrl ? { canonicalWebsiteUrl: inspection.canonicalWebsiteUrl } : {}),
      ...(inspection.legacyWebsiteUrl ? { legacyWebsiteUrl: inspection.legacyWebsiteUrl } : {}),
      ...(inspection.migrationDetected ? { migrationDetected: true } : {}),
      ...(inspection.migrationEvidence ? { migrationEvidence: inspection.migrationEvidence } : {}),
      ...(inspection.migrationTargetUrl ? { migrationTargetUrl: inspection.migrationTargetUrl } : {}),
    };

    if (identityIndex >= 0) {
      working[identityIndex] = record;
      counts.updated += 1;
    } else {
      working.push(record);
      counts.added += 1;
    }
    importedLeadIds.push(record.lead.id);
  }

  if (!options.dryRun) writeWebsiteLeads(working);
  return { counts, leads: working, importedLeadIds };
}

export function validateCandidate(value: unknown): { candidate?: WebsiteCandidateInput; errors: string[] } {
  if (!isObject(value)) return { errors: ['record must be an object'] };

  const errors: string[] = [];
  for (const field of ['id', 'businessName', 'category', 'source'] as const) {
    if (typeof value[field] !== 'string' || value[field].trim() === '') {
      errors.push(`${field} is required`);
    }
  }

  if (typeof value.category === 'string' && !WEBSITE_CATEGORIES.includes(value.category as WebsiteCandidateInput['category'])) {
    errors.push(`unsupported category: ${value.category}`);
  }

  const optionalFields = [
    'location',
    'websiteUrl',
    'instagramUrl',
    'facebookUrl',
    'email',
    'phone',
    'notes',
    'detailUrl',
    'sourceUrl',
    'discoveredAt',
    'evidenceText',
  ] as const;
  for (const field of optionalFields) {
    if (value[field] !== undefined && value[field] !== null && typeof value[field] !== 'string') {
      errors.push(`${field} must be a string or null`);
    }
  }

  for (const field of ['websiteUrl', 'instagramUrl', 'facebookUrl', 'detailUrl', 'sourceUrl'] as const) {
    const fieldValue = value[field];
    const fixtureProvenance = field === 'sourceUrl' && typeof fieldValue === 'string' && fieldValue.startsWith('fixture:');
    if (typeof fieldValue === 'string' && !fixtureProvenance && !isPublicHttpUrl(fieldValue)) {
      errors.push(`${field} must be an http(s) URL`);
    }
  }

  return errors.length > 0
    ? { errors }
    : { candidate: value as unknown as WebsiteCandidateInput, errors };
}

export function mergeCandidate(
  existing: WebsiteLeadRecord | undefined,
  incoming: WebsiteCandidateInput,
  force: boolean,
): WebsiteCandidateInput {
  if (!existing) return normalizeCandidate(incoming);

  const current: WebsiteCandidateInput = {
    id: existing.lead.id,
    businessName: existing.lead.companyName,
    category: existing.lead.industry,
    source: existing.lead.source,
    location: existing.location,
    websiteUrl: existing.lead.website,
    instagramUrl: existing.publicContact.instagramUrl,
    facebookUrl: existing.publicContact.facebookUrl,
    email: existing.publicContact.email,
    phone: existing.publicContact.phone,
    notes: existing.lead.fitNotes || null,
    sources: existing.discovery?.sources ?? [],
  };

  if (force) return normalizeCandidate({ ...current, ...incoming });

  return normalizeCandidate({
    ...incoming,
    id: current.id,
    businessName: current.businessName || incoming.businessName,
    category: current.category || incoming.category,
    source: current.source || incoming.source,
    location: current.location ?? incoming.location,
    websiteUrl: current.websiteUrl ?? incoming.websiteUrl,
    instagramUrl: current.instagramUrl ?? incoming.instagramUrl,
    facebookUrl: current.facebookUrl ?? incoming.facebookUrl,
    email: current.email ?? incoming.email,
    phone: current.phone ?? incoming.phone,
    notes: current.notes ?? incoming.notes,
    detailUrl: incoming.detailUrl ?? null,
    sourceUrl: incoming.sourceUrl ?? null,
    discoveredAt: incoming.discoveredAt ?? null,
    evidenceText: incoming.evidenceText ?? null,
    sources: mergeSourceReferences(current.sources ?? [], incoming.sources ?? sourceReferencesFrom(incoming)),
  });
}

export function toReusedLeadFields(
  candidate: WebsiteCandidateInput,
  existing: WebsiteLeadRecord | undefined,
  now: string,
): ReusedLeadFields {
  return {
    id: candidate.id,
    companyName: candidate.businessName,
    industry: candidate.category,
    source: candidate.source,
    status: existing?.lead.status ?? 'new',
    fitNotes: candidate.notes ?? '',
    createdAt: existing?.lead.createdAt ?? now,
    updatedAt: now,
    nextAction: existing?.analysis.nextAction ?? 'manual review',
  };
}

export function candidateMatchesRecord(candidate: WebsiteCandidateInput, record: WebsiteLeadRecord): boolean {
  const normalized = normalizeCandidate(candidate);
  return JSON.stringify({
    id: normalized.id,
    businessName: normalized.businessName,
    category: normalized.category,
    source: normalized.source,
    location: normalized.location,
    websiteUrl: normalized.websiteUrl,
    instagramUrl: normalized.instagramUrl,
    facebookUrl: normalized.facebookUrl,
    email: normalized.email,
    phone: normalized.phone,
    notes: normalized.notes,
  }) === JSON.stringify({
    id: record.lead.id,
    businessName: record.lead.companyName,
    category: record.lead.industry,
    source: record.lead.source,
    location: record.location,
    websiteUrl: record.lead.website,
    instagramUrl: record.publicContact.instagramUrl,
    facebookUrl: record.publicContact.facebookUrl,
    email: record.publicContact.email,
    phone: record.publicContact.phone,
    notes: record.lead.fitNotes || null,
  });
}

function normalizeCandidate(candidate: WebsiteCandidateInput): WebsiteCandidateInput {
  return {
    id: candidate.id.trim(),
    businessName: candidate.businessName.trim(),
    category: candidate.category,
    source: candidate.source.trim(),
    location: normalizeOptional(candidate.location),
    websiteUrl: normalizeOptional(candidate.websiteUrl),
    instagramUrl: normalizeOptional(candidate.instagramUrl),
    facebookUrl: normalizeOptional(candidate.facebookUrl),
    email: normalizeOptional(candidate.email),
    phone: normalizeOptional(candidate.phone),
    notes: normalizeOptional(candidate.notes),
    detailUrl: normalizeOptional(candidate.detailUrl),
    sourceUrl: normalizeOptional(candidate.sourceUrl),
    discoveredAt: normalizeOptional(candidate.discoveredAt),
    evidenceText: normalizeOptional(candidate.evidenceText),
    sources: candidate.sources ?? [],
  };
}

function refreshStoredAnalysis(record: WebsiteLeadRecord): WebsiteLeadRecord {
  const candidate: WebsiteCandidateInput = {
    id: record.lead.id,
    businessName: record.lead.companyName,
    category: record.lead.industry,
    source: record.lead.source,
    location: record.location,
    websiteUrl: record.legacyWebsiteUrl ?? record.lead.website,
    instagramUrl: record.publicContact.instagramUrl,
    facebookUrl: record.publicContact.facebookUrl,
    email: record.publicContact.email,
    phone: record.publicContact.phone,
    notes: record.lead.fitNotes || null,
    sources: record.discovery?.sources ?? [],
  };
  const analysis = analyzeWebsiteLead(candidate, record.inspection);
  return {
    ...record,
    lead: {
      ...record.lead,
      nextAction: analysis.nextAction,
    },
    analysis,
  };
}

function findMatchingLeadIndex(leads: WebsiteLeadRecord[], candidate: WebsiteCandidateInput): number {
  const candidateHost = normalizeHostname(candidate.websiteUrl);
  const candidateEmail = normalizeOptional(candidate.email)?.toLowerCase() ?? null;
  const candidatePhone = normalizePhone(candidate.phone);
  const candidateNameLocation = `${normalizeText(candidate.businessName)}|${normalizeText(candidate.location ?? '')}`;

  return leads.findIndex((lead) => {
    const leadHost = normalizeHostname(lead.lead.website);
    const legacyHost = normalizeHostname(lead.legacyWebsiteUrl);
    const leadEmail = lead.publicContact.email?.toLowerCase() ?? null;
    const leadPhone = normalizePhone(lead.publicContact.phone);
    const leadNameLocation = `${normalizeText(lead.lead.companyName)}|${normalizeText(lead.location ?? '')}`;
    return Boolean(
      (candidateHost && (leadHost === candidateHost || legacyHost === candidateHost))
      || (candidateEmail && leadEmail === candidateEmail)
      || (candidatePhone && leadPhone === candidatePhone)
      || candidateNameLocation === leadNameLocation
      || lead.lead.id === candidate.id
    );
  });
}

function normalizeHostname(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function normalizePhone(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.replace(/[^\d+]/g, '');
  return normalized || null;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function sourceReferencesFrom(candidate: WebsiteCandidateInput): WebsiteSourceReference[] {
  if (!candidate.sourceUrl || !candidate.discoveredAt) return [];
  return [{
    source: candidate.source,
    sourceUrl: candidate.sourceUrl,
    detailUrl: candidate.detailUrl ?? null,
    discoveredAt: candidate.discoveredAt,
    evidenceText: candidate.evidenceText ?? null,
  }];
}

function mergeSourceReferences(
  existing: WebsiteSourceReference[],
  incoming: WebsiteSourceReference[],
): WebsiteSourceReference[] {
  const merged = [...existing];
  for (const reference of incoming) {
    const duplicate = merged.some((item) => (
      item.source === reference.source
      && item.sourceUrl === reference.sourceUrl
      && item.detailUrl === reference.detailUrl
    ));
    if (!duplicate) merged.push(reference);
  }
  return merged;
}

function hasNewSources(candidate: WebsiteCandidateInput, existing: WebsiteLeadRecord): boolean {
  const merged = mergeSourceReferences(existing.discovery?.sources ?? [], candidate.sources ?? sourceReferencesFrom(candidate));
  return merged.length > (existing.discovery?.sources.length ?? 0);
}

function normalizeOptional(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const normalized = value.trim();
  return normalized || null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPublicHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
