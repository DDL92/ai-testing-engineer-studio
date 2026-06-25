import crypto = require('crypto');
import fs = require('fs');
import path = require('path');
import {
  CommercialFit,
  ContactCandidate,
  ContactDiscoveryReport,
  ContactEvidenceInput,
  RecommendedContactChannel,
} from './types';

const dataPath = path.join(process.cwd(), 'data', 'contacts', 'contact-candidates.json');
const rejectedRolePattern = /\b(recruit(?:er|ing)?|human resources|hr|sales|marketing|support|customer success)\b/i;
const contentTitlePattern = /\b(featuring|join us|episode|series|webinar|interview with|unveiled|podcast|recap|watch|how to|guide to)\b/i;

export function scoreContactRole(title: string): number {
  const normalized = normalize(title);
  if (rejectedRolePattern.test(normalized)) return 0;
  if (/\b(qa manager|head of qa|head of quality|quality assurance manager)\b/.test(normalized)) return 100;
  if (/\b(qa lead|qa automation lead|test automation lead|quality assurance lead)\b/.test(normalized)) return 95;
  if (/\bdirector of engineering\b/.test(normalized)) return 90;
  if (/\bengineering manager\b/.test(normalized)) return 88;
  if (/\b(vp|vice president) (of )?engineering\b/.test(normalized)) return 85;
  if (/\bproduct engineering manager\b/.test(normalized)) return 82;
  if (/\b(cto|chief technology officer)\b/.test(normalized)) return 78;
  if (/\bhead of product\b/.test(normalized)) return 72;
  if (/\btechnical product manager\b/.test(normalized)) return 68;
  if (/\bproduct owner\b/.test(normalized)) return 65;
  if (/\b(ceo|chief executive officer)\b/.test(normalized)) return 60;
  if (/\bproduct manager\b/.test(normalized)) return 55;
  if (/\b(head|director|lead|manager|vice president|vp)\b.*\b(engineering|quality|qa|technology)\b/.test(normalized)) return 60;
  return 0;
}

export function scoreContactConfidence(input: Pick<ContactEvidenceInput, 'sourceType' | 'snippetOnly' | 'staleEvidence'>): number {
  let score: number;
  switch (input.sourceType) {
    case 'official-company-page':
      score = 100;
      break;
    case 'official-company-blog':
    case 'official-press-release':
      score = 95;
      break;
    case 'conference-speaker-profile':
    case 'public-podcast-profile':
      score = 85;
      break;
    case 'reputable-public-article':
      score = 80;
      break;
    case 'public-github-profile':
    case 'public-technical-profile':
      score = 75;
      break;
    default:
      score = 55;
  }
  if (input.snippetOnly) score = Math.min(score, 55);
  if (input.staleEvidence) score = Math.min(score, 45);
  return score;
}

export function buildContactCandidate(input: ContactEvidenceInput): ContactCandidate {
  const roleScore = scoreContactRole(input.title);
  const confidenceScore = scoreContactConfidence(input);
  const plausibleHumanName = isPlausibleHumanName(input.fullName);
  const rejectionReasons: string[] = [];

  if (!plausibleHumanName) rejectionReasons.push('Candidate name resembles a title, headline, event, or content label rather than a plausible person.');
  if (rejectedRolePattern.test(input.title)) rejectionReasons.push('Role is outside engineering, product, or quality leadership.');
  else if (roleScore < 70) rejectionReasons.push('Role score is below the primary-contact threshold of 70.');
  if (confidenceScore < 70) rejectionReasons.push('Evidence confidence is below the primary-contact threshold of 70.');
  if (input.snippetOnly) rejectionReasons.push('Search-result snippet only; independent public-source confirmation is required.');
  if (input.employmentStatus === 'past') rejectionReasons.push('The source shows the target company as past employment.');
  if (!input.currentEmploymentVerified) rejectionReasons.push('Current employment is not verified by the public source.');

  return {
    id: stableId(input.companyName, input.fullName, input.title, input.sourceUrl),
    companyName: input.companyName,
    fullName: input.fullName,
    title: input.title,
    sourceUrl: input.sourceUrl,
    sourceType: input.sourceType,
    evidenceSummary: input.evidenceSummary,
    roleScore,
    confidenceScore,
    currentEmploymentVerified: input.currentEmploymentVerified,
    ...(input.employmentStatus ? { employmentStatus: input.employmentStatus } : {}),
    ...(input.commercialFit ? { commercialFit: input.commercialFit } : {}),
    recommendedChannel: recommendedChannel(input),
    ...(input.publicEmail ? { publicEmail: input.publicEmail } : {}),
    ...(input.publicProfileUrl ? { publicProfileUrl: input.publicProfileUrl } : {}),
    rejectionReasons,
  };
}

export function selectContacts(candidates: ContactCandidate[]): Pick<ContactDiscoveryReport, 'status' | 'primaryContact' | 'backupContacts' | 'rejectedCandidates'> {
  const ranked = [...candidates].sort(compareCandidates);
  const eligible = ranked.filter(isEligiblePrimary);
  const selectedIds = new Set(eligible.slice(0, 3).map((candidate) => candidate.id));

  return {
    status: eligible.length > 0 ? 'READY' : 'NEEDS_MANUAL_REVIEW',
    primaryContact: eligible[0] ?? null,
    backupContacts: eligible.slice(1, 3),
    rejectedCandidates: ranked.filter((candidate) => !selectedIds.has(candidate.id)),
  };
}

export function isEligiblePrimary(candidate: ContactCandidate): boolean {
  return candidate.roleScore >= 70
    && candidate.confidenceScore >= 70
    && candidate.currentEmploymentVerified
    && candidate.employmentStatus !== 'past'
    && candidate.employmentStatus !== 'unknown'
    && candidate.commercialFit !== 'LOW'
    && supportsSpecificNamedVerification(candidate)
    && candidate.rejectionReasons.length === 0;
}

export function scoreCommercialFit(companyName: string, recommendedOffer = ''): CommercialFit {
  const normalized = `${companyName} ${recommendedOffer}`.toLowerCase();
  if (/\b(zoho|salesforce|oracle|sap|microsoft|google|aws|amazon|adobe|hubspot|atlassian)\b/.test(normalized)) return 'LOW';
  if (/\b(agency|studio|consultancy|partner|saas|software|platform)\b/.test(normalized)) return 'MEDIUM';
  return 'HIGH';
}

export function writeContactDiscoveryReport(report: ContactDiscoveryReport): string {
  fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  const reports = readContactReportStore();
  reports[slug(report.companyName)] = report;
  fs.writeFileSync(dataPath, `${JSON.stringify(reports, null, 2)}\n`, 'utf8');
  return dataPath;
}

export function readContactDiscoveryReport(companyName: string): ContactDiscoveryReport | null {
  const report = readContactReportStore()[slug(companyName)] ?? null;
  return report ? normalizeContactDiscoveryReport(report) : null;
}

export function readyPrimaryContact(companyName: string): ContactCandidate | null {
  const report = readContactDiscoveryReport(companyName);
  if (report?.status !== 'READY' || !report.primaryContact || !isEligiblePrimary(report.primaryContact)) return null;
  return report.primaryContact;
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? '';
}

function recommendedChannel(input: ContactEvidenceInput): RecommendedContactChannel {
  if (input.publicEmail) return 'email';
  if (input.publicProfileUrl) return 'linkedin';
  return 'unknown';
}

function compareCandidates(left: ContactCandidate, right: ContactCandidate): number {
  return right.roleScore - left.roleScore
    || right.confidenceScore - left.confidenceScore
    || Number(right.currentEmploymentVerified) - Number(left.currentEmploymentVerified)
    || left.fullName.localeCompare(right.fullName);
}

export function supportsSpecificNamedVerification(candidate: ContactCandidate): boolean {
  if (candidate.sourceType !== 'official-company-page') return true;
  try {
    const pathName = new URL(candidate.sourceUrl).pathname.toLowerCase();
    const nameParts = candidate.fullName.toLowerCase().split(/\s+/).filter((part) => part.length > 2);
    return pathName !== '/'
      && (
        nameParts.some((part) => pathName.includes(part))
        || /\/(team|people|leadership|author|authors|staff|management)(?:\/|$)/.test(pathName)
      );
  } catch {
    return false;
  }
}

export function normalizeContactDiscoveryReport(report: ContactDiscoveryReport): ContactDiscoveryReport {
  const commercialFit = report.commercialFit ?? scoreCommercialFit(report.companyName, report.recommendedOffer);
  const candidates = report.candidates.map((candidate) => normalizeStoredCandidate(candidate, commercialFit));
  const selection = selectContacts(candidates);
  const manualVerificationCandidates = candidates.filter((candidate) => candidate.roleScore > 0 && candidate.employmentStatus !== 'past' && candidate.commercialFit !== 'LOW' && (
    !candidate.currentEmploymentVerified || candidate.confidenceScore < 70
  ));
  const normalizedReport: ContactDiscoveryReport = {
    ...report,
    commercialFit,
    ...selection,
    status: commercialFit === 'LOW'
      ? 'NEEDS_MANUAL_REVIEW'
      : selection.status === 'READY'
        ? 'READY'
        : candidates.length > 0 ? 'NEEDS_MANUAL_REVIEW' : report.status,
    candidates,
    rejectedCandidates: uniqueCandidates([
      ...selection.rejectedCandidates.filter((candidate) => candidate.roleScore === 0 || candidate.employmentStatus === 'past' || candidate.commercialFit === 'LOW'),
      ...candidates.filter((candidate) => candidate.rejectionReasons.some((reason) => /title, headline, event, or content label/i.test(reason))),
    ]),
    manualVerificationCandidates,
    limitations: unique([
      ...report.limitations,
      ...(commercialFit === 'LOW' ? ['Commercial fit is low for the current small-business QA Audit motion; do not select for cold outreach without a strong explicit trigger.'] : []),
    ]),
  };
  const primary = normalizedReport.primaryContact;
  const cachedPrimary = primary ?? (report.primaryContact ? normalizeStoredCandidate(report.primaryContact, commercialFit) : null);
  if (!cachedPrimary?.currentEmploymentVerified || supportsSpecificNamedVerification(cachedPrimary)) return normalizedReport;
  const invalidated: ContactCandidate = {
    ...cachedPrimary,
    confidenceScore: Math.min(cachedPrimary.confidenceScore, 55),
    currentEmploymentVerified: false,
    employmentStatus: 'unknown',
    rejectionReasons: unique([
      ...cachedPrimary.rejectionReasons,
      'Generic company page does not provide person-specific current-employment verification.',
      'Current employment is not verified by the public source.',
    ]),
  };
  return {
    ...normalizedReport,
    status: 'NEEDS_MANUAL_REVIEW',
    primaryContact: null,
    backupContacts: [],
    candidates: normalizedReport.candidates.some((candidate) => candidate.id === invalidated.id)
      ? normalizedReport.candidates.map((candidate) => candidate.id === invalidated.id ? invalidated : candidate)
      : [invalidated, ...normalizedReport.candidates],
    manualVerificationCandidates: uniqueCandidates([invalidated, ...normalizedReport.manualVerificationCandidates]),
    limitations: unique([
      ...normalizedReport.limitations,
      'Cached primary contact was invalidated because its generic company page did not provide person-specific verification.',
    ]),
  };
}

function normalizeStoredCandidate(candidate: ContactCandidate, commercialFit: CommercialFit): ContactCandidate {
  const rejectionReasons = [...candidate.rejectionReasons];
  if (!isPlausibleHumanName(candidate.fullName)) {
    rejectionReasons.push('Candidate name resembles a title, headline, event, or content label rather than a plausible person.');
  }
  if (commercialFit === 'LOW') {
    rejectionReasons.push('Commercial fit is low for the current small-business QA Audit motion.');
  }
  if (candidate.employmentStatus === 'unknown' && candidate.currentEmploymentVerified) {
    rejectionReasons.push('Current employment is not verified by the public source.');
  }
  return {
    ...candidate,
    commercialFit,
    currentEmploymentVerified: candidate.employmentStatus === 'unknown' ? false : candidate.currentEmploymentVerified,
    rejectionReasons: unique(rejectionReasons),
  };
}

function readContactReportStore(): Record<string, ContactDiscoveryReport> {
  if (!fs.existsSync(dataPath)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(dataPath, 'utf8')) as unknown;
    return isRecord(parsed) ? parsed as Record<string, ContactDiscoveryReport> : {};
  } catch {
    return {};
  }
}

function stableId(...parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|').toLowerCase()).digest('hex').slice(0, 16);
}

function slug(value: string): string {
  return normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function isPlausibleHumanName(value: string): boolean {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2 || parts.length > 4) return false;
  if (contentTitlePattern.test(value)) return false;
  if (/[.!?]/.test(value)) return false;
  return parts.every((part) => /^[A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ'’-]+$/.test(part));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unique(items: string[]): string[] {
  return [...new Set(items)];
}

function uniqueCandidates(items: ContactCandidate[]): ContactCandidate[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}
