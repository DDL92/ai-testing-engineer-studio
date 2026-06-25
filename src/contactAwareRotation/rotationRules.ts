import fs = require('fs');
import path = require('path');
import { discoverContacts } from '../contactDiscovery/discoverContacts';
import { isEligiblePrimary, readContactDiscoveryReport } from '../contactDiscovery/contactRules';
import { ContactDiscoveryReport } from '../contactDiscovery/types';
import { writeContactPack } from '../contactDiscovery/generateContactPack';
import { buildLeadRotationDecision } from '../leadRotation/rotationRules';
import { LeadRotationCandidate } from '../leadRotation/types';
import { ContactAwareLeadEvaluation, ContactAwareRotationReport, ContactRotationStatus } from './types';

const statePath = path.join(process.cwd(), 'data', 'contact-aware-rotation', 'rotation-state.json');
const freshnessMs = 7 * 24 * 60 * 60 * 1000;
const maximumLeads = 10;
const targetReadyLeads = 3;

const safetyRules = [
  'Public professional data only.',
  'No email address was guessed.',
  'No authenticated LinkedIn browsing was performed.',
  'No messages were sent.',
  'Human approval is required before external action.',
];

interface RotationDependencies {
  candidates?: LeadRotationCandidate[];
  readContact?: (companyName: string) => ContactDiscoveryReport | null;
  discover?: (candidate: LeadRotationCandidate) => Promise<ContactDiscoveryReport>;
  now?: Date;
  persist?: boolean;
}

export async function buildContactAwareRotation(
  options: { maxLeads?: number; refresh?: boolean } = {},
  dependencies: RotationDependencies = {},
): Promise<ContactAwareRotationReport> {
  const generatedAt = (dependencies.now ?? new Date()).toISOString();
  const limit = boundedLimit(options.maxLeads);
  const ranked = [...(dependencies.candidates ?? commerciallyUsableCandidates())]
    .sort((left, right) => left.rank - right.rank);
  const readContact = dependencies.readContact ?? readContactDiscoveryReport;
  const discover = dependencies.discover ?? ((candidate) => discoverContacts(candidate.companyName, {
    company: {
      companyName: candidate.companyName,
      companyDomain: hostname(candidate.website),
      recommendedOffer: candidate.recommendedOffer,
    },
  }));
  const evaluatedLeads: ContactAwareLeadEvaluation[] = [];
  const readyLeads: ContactAwareLeadEvaluation[] = [];
  let searchUnavailable = false;

  for (const candidate of ranked.slice(0, limit)) {
    let contact = readContact(candidate.companyName);
    const fresh = contact ? isFresh(contact.generatedAt, dependencies.now ?? new Date()) : false;
    if (options.refresh || !contact || !fresh) contact = await discover(candidate);
    if (dependencies.persist !== false) writeContactPack(contact, { writeSharedReadiness: false });

    const evaluation = evaluateCandidate(candidate, contact);
    evaluatedLeads.push(evaluation);
    if (evaluation.contactStatus === 'SEARCH_UNAVAILABLE') {
      searchUnavailable = true;
      break;
    }
    if (evaluation.contactStatus === 'READY') {
      readyLeads.push(evaluation);
      if (readyLeads.length >= targetReadyLeads) break;
    }
  }

  const selectedLead = readyLeads[0];
  const evaluatedIds = new Set(evaluatedLeads.map((lead) => lead.companyId));
  const notEvaluated = ranked
    .filter((candidate) => !evaluatedIds.has(candidate.companyId))
    .map((candidate) => notEvaluatedCandidate(candidate));
  const report: ContactAwareRotationReport = {
    generatedAt,
    status: selectedLead ? 'READY' : searchUnavailable ? 'SEARCH_UNAVAILABLE' : 'NO_CONTACT_READY_LEAD',
    ...(selectedLead ? { selectedLead } : {}),
    readyLeads,
    evaluatedLeads: [...evaluatedLeads, ...notEvaluated],
    skippedLeads: evaluatedLeads.filter((lead) => lead.contactStatus !== 'READY'),
    nextManualAction: selectedLead
      ? `Review ${selectedLead.primaryContactName} at ${selectedLead.companyName} and the generated message pack. Nothing has been sent.`
      : searchUnavailable
        ? 'Restore public-search access and rerun contact-aware rotation. Do not infer that later leads are better.'
        : 'Manually review blocked contacts or rerun later after public contact evidence changes.',
    safetyRules,
  };
  if (dependencies.persist !== false) writeContactAwareState(report);
  return report;
}

export function evaluateCandidate(
  candidate: LeadRotationCandidate,
  contact: ContactDiscoveryReport,
): ContactAwareLeadEvaluation {
  const primary = contact.primaryContact;
  const lowCommercialFit = contact.commercialFit === 'LOW';
  const ready = !lowCommercialFit && contact.status === 'READY' && primary && isEligiblePrimary(primary);
  const contactStatus: ContactRotationStatus = ready
    ? 'READY'
    : lowCommercialFit
      ? 'LOW_COMMERCIAL_FIT'
      : contact.status === 'SEARCH_UNAVAILABLE'
      ? 'SEARCH_UNAVAILABLE'
      : contact.status === 'NO_CANDIDATES_FOUND'
        ? 'NO_CANDIDATES_FOUND'
        : 'CONTACT_BLOCKED';

  return {
    companyId: candidate.companyId,
    companyName: candidate.companyName,
    rank: candidate.rank,
    recommendedOffer: candidate.recommendedOffer,
    evidenceStatus: candidate.evidenceStatus,
    contactStatus,
    ...(ready ? {
      primaryContactName: primary.fullName,
      primaryContactTitle: primary.title,
      primaryContactConfidence: primary.confidenceScore,
      primaryContactSource: primary.sourceUrl,
    } : {}),
    reason: ready
      ? 'First ranked commercially usable lead with a verified technical decision-maker.'
      : contactStatus === 'LOW_COMMERCIAL_FIT'
        ? 'Low commercial fit for current small-business QA Audit outreach; skip unless a strong explicit trigger appears.'
        : contactStatus === 'SEARCH_UNAVAILABLE'
        ? 'Public contact search was unavailable; rotation stopped safely.'
        : contactStatus === 'NO_CANDIDATES_FOUND'
          ? 'Public search completed but found no supported named contact.'
          : 'No verified QA, engineering, product-engineering, or technical decision-maker met thresholds.',
    contactPackPath: `output/contacts/${candidate.companyId}-contact-pack.md`,
  };
}

export function readContactAwareState(): ContactAwareRotationReport | null {
  if (!fs.existsSync(statePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf8')) as ContactAwareRotationReport;
  } catch {
    return null;
  }
}

export function selectedContactReadyLead(): ContactAwareLeadEvaluation | null {
  const state = readContactAwareState();
  return state?.status === 'READY' && state.selectedLead?.contactStatus === 'READY' ? state.selectedLead : null;
}

export function writeContactAwareState(report: ContactAwareRotationReport): string {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return statePath;
}

function commerciallyUsableCandidates(): LeadRotationCandidate[] {
  return buildLeadRotationDecision().candidates
    .filter((candidate) => candidate.readiness === 'READY')
    .sort((left, right) => left.rank - right.rank);
}

function notEvaluatedCandidate(candidate: LeadRotationCandidate): ContactAwareLeadEvaluation {
  return {
    companyId: candidate.companyId,
    companyName: candidate.companyName,
    rank: candidate.rank,
    recommendedOffer: candidate.recommendedOffer,
    evidenceStatus: candidate.evidenceStatus,
    contactStatus: 'NOT_EVALUATED',
    reason: 'Not evaluated because an earlier lead was selected or the evaluation limit was reached.',
  };
}

function isFresh(generatedAt: string, now: Date): boolean {
  const timestamp = Date.parse(generatedAt);
  return Number.isFinite(timestamp) && now.getTime() - timestamp <= freshnessMs;
}

function boundedLimit(value: number | undefined): number {
  if (!Number.isFinite(value)) return maximumLeads;
  return Math.max(1, Math.min(maximumLeads, Math.floor(value as number)));
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}
