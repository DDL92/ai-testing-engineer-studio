import {
  TavilyExtractAdapterStatus,
  TavilyExtractBlockedReason,
  TavilyExtractInputCandidate,
  TavilyExtractQueueCandidate,
} from './tavilyExtractTypes';

const blockedSourceTypes = new Set([
  'public_directory',
  'public_job_board',
  'vendor',
  'directory',
  'article',
  'staffing',
  'job_post',
  'private_login',
]);

const buyerIntentTerms = [
  'looking for',
  'need ',
  'needs ',
  'recommendation',
  'recommendations',
  'planning',
  'request',
  'rfp',
  'proposal',
  'quote',
  'event',
  'wedding',
  'corporate',
  'retreat',
  'catering',
  'vendor',
  'service',
  'help',
];

export const tavilyExtractSafetyRules = [
  'Offline queue preparation only: no Tavily Extract calls are made.',
  'No providers, network requests, scraping, browser automation, login, contact extraction, outreach, email, DMs, calls, or forms are used.',
  'Only public, no-login, buyer-intent URLs can be queued for future extraction.',
  'Human review remains required before extraction, enrichment, scoring changes, delivery, or contact.',
];

export const tavilyExtractFutureIntegrationPath = [
  'Tavily Search',
  'candidate scoring',
  'extract queue',
  'Tavily Extract',
  'cleaner context',
  'buyer evidence',
  'enrichment',
  'review queue',
  'pilot pack',
];

export function getTavilyExtractAdapterStatus(): TavilyExtractAdapterStatus {
  return {
    mode: 'offline_ready',
    liveExtractionEnabled: false,
    providerCallsAllowed: false,
    networkCallsAllowed: false,
    creditsUsed: 0,
    status: 'Adapter is prepared for future Tavily Extract calls, but validation mode only builds local queues and simulations.',
  };
}

export function evaluateTavilyExtractCandidate(candidate: TavilyExtractInputCandidate): TavilyExtractQueueCandidate {
  const blockedReason = blockedReasonFor(candidate);
  return {
    candidateId: candidate.candidateId,
    clientId: candidate.clientId,
    sourceUrl: candidate.sourceUrl,
    sourceType: candidate.sourceType,
    reasonForExtraction: blockedReason ? reasonForBlock(candidate, blockedReason) : reasonForExtraction(candidate),
    expectedExtractionValue: blockedReason ? 'No extraction value because the source is blocked by safe extraction policy.' : expectedExtractionValue(candidate),
    riskLevel: candidate.riskLevel,
    allowed: blockedReason === null,
    blockedReason,
    sampleOnly: Boolean(candidate.sampleOnly),
  };
}

export function assertNoLiveTavilyExtract(): never {
  throw new Error('Live Tavily Extract is intentionally disabled. Use the extract queue and human approval before enabling provider calls.');
}

function blockedReasonFor(candidate: TavilyExtractInputCandidate): TavilyExtractBlockedReason | null {
  if (!['lead_like', 'possibly_lead_like'].includes(candidate.leadLikeClassification)) return 'not_lead_like';
  if (blockedSourceTypes.has(candidate.sourceType)) return 'blocked_source_type';
  if (candidate.relevance && ['low', 'directory', 'vendor', 'article', 'staffing', 'job_post'].includes(candidate.relevance)) return 'low_relevance';
  if (!hasBuyerIntentEvidence(candidate)) return 'missing_buyer_intent_evidence';
  if (!isSupportedPublicUrl(candidate.sourceUrl)) return 'unsupported_url';
  if (!isPublicUrl(candidate.sourceUrl)) return 'non_public_url';
  if (candidate.requiresLogin || candidate.sourceType === 'private_login') return 'login_required';
  if (candidate.contactExtractionNeeded) return 'contact_extraction_needed';
  return null;
}

function hasBuyerIntentEvidence(candidate: TavilyExtractInputCandidate): boolean {
  if ((candidate.buyerSignalCount ?? 0) > 0) return true;
  if ((candidate.buyerSignals ?? []).length > 0) return true;
  if (candidate.buyerSignalStrength === 'medium' || candidate.buyerSignalStrength === 'strong') return true;
  const text = `${candidate.title} ${candidate.snippet} ${candidate.query ?? ''}`.toLowerCase();
  return buyerIntentTerms.some((term) => text.includes(term));
}

function isSupportedPublicUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isPublicUrl(rawUrl: string): boolean {
  const parsed = new URL(rawUrl);
  const host = parsed.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') return false;
  if (host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.test')) return false;
  if (parsed.pathname.toLowerCase().includes('/login')) return false;
  if (parsed.pathname.toLowerCase().includes('/signin')) return false;
  return true;
}

function reasonForExtraction(candidate: TavilyExtractInputCandidate): string {
  if (candidate.sourceType === 'public_event_board') return 'Public event page has buyer-intent evidence and may clarify event details, timing, and service need.';
  if (candidate.sourceType === 'public_forum') return 'Public forum discussion has buyer-intent evidence and may clarify the request context before scoring.';
  return 'Lead-like public URL has buyer-intent evidence and may improve scoring context before human review.';
}

function expectedExtractionValue(candidate: TavilyExtractInputCandidate): string {
  const values = ['cleaner page context', 'stronger buyer evidence', 'false-positive reduction'];
  if (candidate.sourceType === 'public_event_board') values.push('event timing and service-fit details');
  if (candidate.sourceType === 'public_forum') values.push('conversation context and urgency signals');
  return values.join('; ');
}

function reasonForBlock(candidate: TavilyExtractInputCandidate, reason: TavilyExtractBlockedReason): string {
  const title = candidate.title ? ` "${candidate.title}"` : '';
  return `Blocked${title}: ${reason.replace(/_/g, ' ')}.`;
}
