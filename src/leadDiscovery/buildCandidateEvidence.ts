import { CandidateEvidence, RecommendedContactMethod, VerificationReadiness } from './evidenceTypes';

export interface CandidateEvidenceInput {
  sourceUrl: string;
  sourceName: string;
  sourceCategory: string;
  title: string;
  snippet: string;
  query: string;
  buyerType: string;
  intentSignals: string[];
  sourceQuality: string;
  estimatedRecencyDays: number | null;
}

export function buildCandidateEvidence(input: CandidateEvidenceInput): CandidateEvidence {
  const buyerEvidence = buyerEvidenceFor(input);
  const recencyEvidence = recencyEvidenceFor(input);
  const contact = contactRecommendationFor(input);
  const readiness = readinessFor(
    buyerEvidence.length,
    recencyEvidence.length,
    input.estimatedRecencyDays !== null,
    contact.recommendedContactMethod,
  );

  return {
    buyerEvidence,
    buyerEvidenceCount: buyerEvidence.length,
    recencyEvidence,
    recencyEvidenceCount: recencyEvidence.length,
    contactMethodEvidence: contact.contactMethodEvidence,
    recommendedContactMethod: contact.recommendedContactMethod,
    contactMethodReason: contact.contactMethodReason,
    contactActionStatus: 'manual_review_required',
    verificationReadiness: readiness.verificationReadiness,
    readinessReasons: readiness.readinessReasons,
  };
}

function buyerEvidenceFor(input: CandidateEvidenceInput): string[] {
  const evidence: string[] = [];
  const title = normalize(input.title);
  const snippet = normalize(input.snippet);
  const url = normalize(input.sourceUrl);
  const source = normalize(`${input.sourceName} ${input.sourceCategory}`);
  const resultText = `${title} ${snippet} ${url} ${source}`;
  const negativeIndicators = [
    'dictionary',
    'definition',
    'wiki',
    'wikipedia',
    'grammar',
    'synonym',
    'synonyms',
    'meaning',
    'history',
    'television',
    'movie',
    'streaming',
    'career',
    'job',
    'venue directory',
    'vendor marketplace',
    'marketplace',
  ];
  if (negativeIndicators.some((indicator) => resultText.includes(indicator))) return [];

  const positiveSignals = [
    'looking for catering',
    'need catering',
    'need caterer',
    'catering recommendations',
    'planning wedding',
    'planning a wedding',
    'planning event',
    'corporate event catering',
    'charity event catering',
    'private dinner catering',
    'need bar service',
    'event rentals needed',
    'food service needed',
    'recommend a caterer',
    'any recommendations for catering',
  ];
  for (const signal of positiveSignals) {
    if (title.includes(signal)) evidence.push(`title contains: ${signal}`);
    if (snippet.includes(signal)) evidence.push(`snippet contains: ${signal}`);
  }

  if (/\b(looking for|need|seeking|searching)\b/.test(title) && /\b(catering|caterer|food service|bar service|event rentals?)\b/.test(title)) {
    evidence.push('title indicates service need');
  }
  if (/\b(looking for|need|seeking|searching)\b/.test(snippet) && /\b(catering|caterer|food service|bar service|event rentals?)\b/.test(snippet)) {
    evidence.push('snippet indicates service need');
  }
  if (/\b(anyone know|recommend|recommendations)\b/.test(`${title} ${snippet}`) && /\b(catering|caterer)\b/.test(`${title} ${snippet}`)) {
    evidence.push('result asks for caterer recommendation');
  }

  return unique(evidence);
}

function recencyEvidenceFor(input: CandidateEvidenceInput): string[] {
  if (input.estimatedRecencyDays === null) return ['recency unavailable'];
  if (input.estimatedRecencyDays <= 7) return [`estimated recency: ${input.estimatedRecencyDays} days`, 'recency <= 7 days'];
  if (input.estimatedRecencyDays <= 30) return [`estimated recency: ${input.estimatedRecencyDays} days`, 'recency <= 30 days'];
  if (input.estimatedRecencyDays <= 60) return [`estimated recency: ${input.estimatedRecencyDays} days`, 'recency <= 60 days'];
  return [`estimated recency: ${input.estimatedRecencyDays} days`];
}

function contactRecommendationFor(input: CandidateEvidenceInput): {
  contactMethodEvidence: string[];
  recommendedContactMethod: RecommendedContactMethod;
  contactMethodReason: string;
} {
  const source = normalize(`${input.sourceName} ${input.sourceCategory} ${hostFor(input.sourceUrl)}`);
  if (source.includes('reddit') || source.includes('community discussion')) {
    return {
      contactMethodEvidence: ['source appears to be a public discussion platform'],
      recommendedContactMethod: 'platform_message',
      contactMethodReason: 'Source appears to be a public discussion platform.',
    };
  }
  if (source.includes('forum')) {
    return {
      contactMethodEvidence: ['source appears to be a public forum'],
      recommendedContactMethod: 'source_reply',
      contactMethodReason: 'Source appears to support public source replies.',
    };
  }
  if (source.includes('event request board') || source.includes('public_event_board')) {
    return {
      contactMethodEvidence: ['source appears to be an event request board'],
      recommendedContactMethod: 'source_reply',
      contactMethodReason: 'Source appears to be an event request board.',
    };
  }
  if (source.includes('business website') || source.includes('public_business_listing')) {
    return {
      contactMethodEvidence: ['source appears to be a business website'],
      recommendedContactMethod: 'website_form',
      contactMethodReason: 'Source appears to be a public business website.',
    };
  }
  if (source.includes('directory')) {
    return {
      contactMethodEvidence: ['source appears to be a directory or marketplace'],
      recommendedContactMethod: 'manual_review_required',
      contactMethodReason: 'Directory-like sources require manual review before any contact method is chosen.',
    };
  }
  return {
    contactMethodEvidence: ['no safe contact method inferred from existing metadata'],
    recommendedContactMethod: 'not_available',
    contactMethodReason: 'Existing metadata does not identify a safe likely communication method.',
  };
}

function readinessFor(
  buyerEvidenceCount: number,
  recencyEvidenceCount: number,
  hasKnownRecency: boolean,
  recommendedContactMethod: RecommendedContactMethod,
): { verificationReadiness: VerificationReadiness; readinessReasons: string[] } {
  const reasons: string[] = [];
  if (buyerEvidenceCount < 2) reasons.push('missing buyer evidence');
  if (recencyEvidenceCount < 1 || !hasKnownRecency) reasons.push('unknown recency');
  if (recommendedContactMethod === 'not_available') reasons.push('no safe contact method inferred');
  if (recommendedContactMethod === 'manual_review_required') reasons.push('contact method requires manual review');
  if (reasons.length === 0) {
    return {
      verificationReadiness: 'ready',
      readinessReasons: ['buyer evidence, recency evidence, and safe contact method inference are present'],
    };
  }
  if (buyerEvidenceCount < 2) return { verificationReadiness: 'missing_buyer_evidence', readinessReasons: reasons };
  if (recencyEvidenceCount < 1 || !hasKnownRecency) return { verificationReadiness: 'missing_recency', readinessReasons: reasons };
  if (recommendedContactMethod === 'not_available' || recommendedContactMethod === 'manual_review_required') {
    return { verificationReadiness: 'missing_contact_method', readinessReasons: reasons };
  }
  return { verificationReadiness: 'needs_review', readinessReasons: reasons };
}

function hostFor(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
