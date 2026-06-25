import path = require('path');
import {
  allowedLinkedInSnippetUrl,
  allowedPublicUrl,
  getTavilyRuntimeConfig,
  tavilySearch,
  type TavilySearchResponse,
  type TavilySearchResult,
} from '../integrations/tavily/tavilyClient';
import { buildRevenueIntelligenceReport } from '../revenueIntelligence/revenueIntelligenceRules';
import { buildContactCandidate, scoreCommercialFit, selectContacts, writeContactDiscoveryReport } from './contactRules';
import {
  ContactCandidate,
  ContactDiscoveryReport,
  ContactEvidenceInput,
  ContactSearchDiagnostic,
} from './types';
import { manualContactEvidence } from './manualEvidence';

const roleTitles = [
  'QA Manager',
  'QA Lead',
  'Head of Quality',
  'Engineering Manager',
  'Director of Engineering',
  'VP Engineering',
  'CTO',
  'Head of Product',
] as const;
const titlePattern = '(QA Manager|QA Lead|QA Automation Lead|Test Automation Lead|Head of QA|Head of Quality|Director of Engineering|Engineering Manager|VP of Engineering|VP Engineering|Vice President of Engineering|Product Engineering Manager|CTO|Chief Technology Officer|Head of Product|Technical Product Manager|Product Owner|Product Manager|CEO|Chief Executive Officer)';
const namePattern = "([A-Z][A-Za-zÀ-ÖØ-öø-ÿ'’-]+(?:\\s+[A-Z][A-Za-zÀ-ÖØ-öø-ÿ'’-]+){1,3})";

interface ContactDiscoveryDependencies {
  hasApiKey?: boolean;
  search?: (query: string) => Promise<TavilySearchResponse>;
  verify?: (evidence: ContactEvidenceInput, companyDomain: string) => Promise<ContactEvidenceInput>;
  persist?: boolean;
  company?: {
    companyName: string;
    companyDomain: string;
    recommendedOffer: string;
  };
}

export function buildContactQueries(companyName: string, companyDomain: string): string[] {
  const queries = roleTitles.map((title) => title === 'CTO'
    ? `"${companyName}" CTO`
    : `"${companyName}" "${title}"`);
  queries.push(`site:linkedin.com/in "${companyName}" engineering`);
  if (companyDomain) queries.push(`site:${companyDomain} engineering leadership`);
  return queries;
}

export async function discoverContacts(
  companyOverride?: string,
  dependencies: ContactDiscoveryDependencies = {},
): Promise<ContactDiscoveryReport> {
  const company = dependencies.company ?? resolveCompany(companyOverride);
  const commercialFit = scoreCommercialFit(company.companyName, company.recommendedOffer);
  const queries = buildContactQueries(company.companyName, company.companyDomain);
  const evidence: ContactEvidenceInput[] = manualContactEvidence(company.companyName).map((item) => ({ ...item, commercialFit }));
  const limitations: string[] = [];
  const searchDiagnostics: ContactSearchDiagnostic[] = [];
  const runtime = getTavilyRuntimeConfig();
  const hasApiKey = dependencies.hasApiKey ?? runtime.hasApiKey;
  const search = dependencies.search ?? searchPublicContacts;
  const verify = dependencies.verify ?? verifyPublicEvidence;
  let totalSearchResults = 0;

  if (!hasApiKey) {
    limitations.push('Public search unavailable: TAVILY_API_KEY missing or provider request failed.');
    for (const query of queries) {
      searchDiagnostics.push({
        query,
        provider: 'tavily',
        status: 'SKIPPED',
        resultCount: 0,
        errorCategory: 'missing_configuration',
        urlsConsidered: [],
        rejectedUrls: [],
      });
    }
  } else {
    for (const query of queries) {
      const diagnostic: ContactSearchDiagnostic = {
        query,
        provider: 'tavily',
        status: 'SUCCESS',
        resultCount: 0,
        urlsConsidered: [],
        rejectedUrls: [],
      };
      try {
        const response = await search(query);
        diagnostic.resultCount = response.results.length;
        totalSearchResults += response.results.length;
        for (const result of response.results) {
          diagnostic.urlsConsidered.push(result.url);
          const parsed = parseContactEvidence(company.companyName, company.companyDomain, result);
          if (!parsed) {
            diagnostic.rejectedUrls.push({
              url: result.url,
              reason: rejectionReason(company.companyName, result),
            });
            continue;
          }
          evidence.push({ ...await verify(parsed, company.companyDomain), commercialFit });
        }
      } catch (error) {
        diagnostic.status = 'FAILED';
        diagnostic.errorCategory = errorCategory(error);
        limitations.push('Public search unavailable: TAVILY_API_KEY missing or provider request failed.');
      }
      searchDiagnostics.push(diagnostic);
    }
  }

  const candidates = deduplicate(evidence.map(buildContactCandidate));
  const selection = selectContacts(candidates);
  const successfulQueries = searchDiagnostics.filter((item) => item.status === 'SUCCESS').length;
  const failedQueries = searchDiagnostics.filter((item) => item.status === 'FAILED').length;
  const status = selection.status === 'READY'
    ? 'READY'
    : candidates.length > 0
      ? 'NEEDS_MANUAL_REVIEW'
      : successfulQueries === 0 && failedQueries > 0 || !hasApiKey
        ? 'SEARCH_UNAVAILABLE'
        : 'NO_CANDIDATES_FOUND';
  if (status === 'NO_CANDIDATES_FOUND') limitations.push('Public search completed, but no named role-relevant contacts were supported by returned text.');
  if (status === 'NEEDS_MANUAL_REVIEW') limitations.push('Candidates were found, but none met verified-evidence thresholds.');
  if (commercialFit === 'LOW') limitations.push('Commercial fit is low for the current small-business QA Audit motion; do not select for cold outreach without a strong explicit trigger.');

  const report: ContactDiscoveryReport = {
    generatedAt: new Date().toISOString(),
    companyName: company.companyName,
    companyDomain: company.companyDomain,
    recommendedOffer: company.recommendedOffer,
    commercialFit,
    ...selection,
    status,
    rejectedCandidates: selection.rejectedCandidates.filter((candidate) => candidate.roleScore === 0 || candidate.employmentStatus === 'past'),
    manualVerificationCandidates: candidates.filter((candidate) => candidate.roleScore > 0 && candidate.employmentStatus !== 'past' && (
      !candidate.currentEmploymentVerified || candidate.confidenceScore < 70
    )),
    candidates,
    searchQueries: queries,
    searchDiagnostics,
    totalSearchResults,
    limitations: [...new Set(limitations)],
    safetyRules: [
      'Public professional data only.',
      'No contact was messaged.',
      'No email address was guessed.',
      'No LinkedIn automation was performed.',
      'Human approval is required before external action.',
    ],
  };
  if (dependencies.persist !== false) {
    const outputPath = writeContactDiscoveryReport(report);
    console.log(`Contact candidates stored: ${path.relative(process.cwd(), outputPath)}`);
    console.log(`Company: ${report.companyName}`);
    console.log(`Status: ${report.status}`);
    console.log(`Candidates: ${report.candidates.length}`);
    console.log('Public research only. No external outreach was performed.');
  }
  return report;
}

async function searchPublicContacts(query: string): Promise<TavilySearchResponse> {
  return tavilySearch(query, {
    maxResults: 3,
    searchDepth: 'basic',
    includeAnswer: false,
    includeImages: false,
    timeoutMs: 10_000,
    retainLinkedInSearchSnippets: true,
  });
}

export function parseContactEvidence(
  companyName: string,
  companyDomain: string,
  result: TavilySearchResult,
): ContactEvidenceInput | null {
  if (!allowedPublicUrl(result.url) && !allowedLinkedInSnippetUrl(result.url)) return null;
  const text = `${result.title}\n${result.content}`.replace(/\s+/g, ' ').trim();
  if (!containsCompany(text, companyName)) return null;

  const patterns = [
    new RegExp(`${namePattern}\\s*(?:,|–|-|is)?\\s*(?:the\\s+)?${titlePattern}\\s+(?:at|of|for)\\s+${escapeRegExp(companyName)}`, 'i'),
    new RegExp(`${titlePattern}\\s+(?:at|of|for)\\s+${escapeRegExp(companyName)}\\s*(?:is|:|-|–)?\\s*${namePattern}`, 'i'),
    new RegExp(`${escapeRegExp(companyName)}\\s+${titlePattern}\\s+${namePattern}`, 'i'),
    new RegExp(`${namePattern}\\s+${titlePattern}\\s+at\\s+${escapeRegExp(companyName)}`, 'i'),
    new RegExp(`^${namePattern}\\s*(?:-|–|\\|)\\s*${titlePattern}(?:\\s*(?:-|–|\\|)\\s*${escapeRegExp(companyName)})?`, 'i'),
    new RegExp(`^${namePattern}\\s*(?:-|–|\\|)\\s*${titlePattern}.*\\b${escapeRegExp(companyName)}\\b`, 'i'),
    new RegExp(`${namePattern}\\s*:\\s*${titlePattern}.*\\b${escapeRegExp(companyName)}\\b`, 'i'),
  ];

  for (const [index, pattern] of patterns.entries()) {
    const match = text.match(pattern);
    if (!match) continue;
    const titleFirst = index === 1 || index === 2;
    const title = clean(titleFirst ? match[1] : match[2]);
    const fullName = clean(titleFirst ? match[2] : match[1]);
    if (!validName(fullName) || !title) continue;

    return {
      companyName,
      fullName,
      title,
      sourceUrl: result.url,
      sourceType: classifySource(result.url, companyDomain),
      evidenceSummary: truncate(text, 280),
      currentEmploymentVerified: false,
      snippetOnly: true,
      ...(allowedLinkedInSnippetUrl(result.url) ? { publicProfileUrl: result.url } : {}),
    };
  }
  return null;
}

async function verifyPublicEvidence(
  evidence: ContactEvidenceInput,
  companyDomain: string,
): Promise<ContactEvidenceInput> {
  if (!allowedPublicUrl(evidence.sourceUrl)) return evidence;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(evidence.sourceUrl, {
      signal: controller.signal,
      headers: { 'user-agent': 'AI-Testing-Engineer-Studio/1.0 public-contact-verification' },
    });
    const contentType = response.headers.get('content-type') ?? '';
    if (!response.ok || !contentType.includes('text/html')) return evidence;
    const text = htmlToText(await response.text());
    const confirmsIdentity = includesAll(text, [evidence.companyName, evidence.fullName, evidence.title]);
    if (!confirmsIdentity) return evidence;
    const verifiedSourceType = classifyVerifiedSource(evidence.sourceUrl, companyDomain);
    if (verifiedSourceType === 'official-company-page' && !isPersonSpecificOfficialUrl(evidence.sourceUrl, evidence.fullName)) {
      return {
        ...evidence,
        evidenceSummary: truncate(textAround(text, evidence.fullName), 280),
        employmentStatus: evidence.employmentStatus ?? 'unknown',
      };
    }
    const staleEvidence = isStaleEvidence(text);
    return {
      ...evidence,
      sourceType: verifiedSourceType,
      evidenceSummary: truncate(textAround(text, evidence.fullName), 280),
      currentEmploymentVerified: !staleEvidence,
      employmentStatus: staleEvidence ? 'unknown' : 'current',
      snippetOnly: false,
      staleEvidence,
    };
  } catch {
    return evidence;
  } finally {
    clearTimeout(timeout);
  }
}

function resolveCompany(companyOverride?: string): { companyName: string; companyDomain: string; recommendedOffer: string } {
  const report = buildRevenueIntelligenceReport();
  const companyName = companyOverride || report.actionableLead?.companyName || report.topLead?.companyName;
  if (!companyName) throw new Error('No actionable top lead is available.');
  const actionableLead = report.actionableLead?.companyName === companyName ? report.actionableLead : null;
  const rankedLead = report.topLead?.companyName === companyName ? report.topLead : null;
  const website = actionableLead?.website || rankedLead?.website || '';
  return {
    companyName,
    companyDomain: hostname(website),
    recommendedOffer: actionableLead
      ? actionableLead.recommendedOffer
      : rankedLead?.recommendedOffer ?? 'QA Audit ($199-$500)',
  };
}

function classifySource(url: string, companyDomain: string): string {
  const host = hostname(url);
  if (companyDomain && (host === companyDomain || host.endsWith(`.${companyDomain}`))) {
    if (/\/blog\//i.test(url)) return 'official-company-blog';
    if (/\/(press|news)\//i.test(url)) return 'official-press-release';
    return 'official-company-page';
  }
  if (/github\.com$/i.test(host)) return 'public-github-profile';
  if (/(conference|speaker|summit|podcast)/i.test(url)) return 'conference-speaker-profile';
  return 'search-result-snippet';
}

function classifyVerifiedSource(url: string, companyDomain: string): string {
  const host = hostname(url);
  if (companyDomain && (host === companyDomain || host.endsWith(`.${companyDomain}`))) {
    if (/\/blog\//i.test(url)) return 'official-company-blog';
    if (/\/(press|news)\//i.test(url)) return 'official-press-release';
    return 'official-company-page';
  }
  if (/github\.com$/i.test(host)) return 'public-github-profile';
  if (/(conference|speaker|summit)/i.test(url)) return 'conference-speaker-profile';
  if (/podcast/i.test(url)) return 'public-podcast-profile';
  if (/(reuters|bloomberg|forbes|techcrunch|businessinsider)\.com$/i.test(host)) return 'reputable-public-article';
  return 'public-web-page';
}

function deduplicate(candidates: ContactCandidate[]): ContactCandidate[] {
  const byIdentity = new Map<string, ContactCandidate>();
  for (const candidate of candidates) {
    const key = `${candidate.fullName.toLowerCase()}|${candidate.title.toLowerCase()}`;
    const existing = byIdentity.get(key);
    if (!existing || candidate.confidenceScore > existing.confidenceScore) byIdentity.set(key, candidate);
  }
  return [...byIdentity.values()];
}

function rejectionReason(companyName: string, result: TavilySearchResult): string {
  if (!allowedPublicUrl(result.url) && !allowedLinkedInSnippetUrl(result.url)) return 'URL is not an allowed public page or LinkedIn profile snippet.';
  const text = `${result.title} ${result.content}`;
  if (!containsCompany(text, companyName)) return 'Returned text does not mention the target company.';
  return 'Returned text did not support both a human name and a relevant professional title.';
}

function errorCategory(error: unknown): string {
  const message = errorMessage(error).toLowerCase();
  if (message.includes('api key')) return 'missing_configuration';
  if (message.includes('abort') || message.includes('timeout')) return 'timeout';
  if (message.includes('401') || message.includes('403')) return 'authentication';
  if (message.includes('429') || message.includes('rate')) return 'rate_limit';
  return 'provider_request_failed';
}

function containsCompany(text: string, companyName: string): boolean {
  return text.toLowerCase().includes(companyName.toLowerCase());
}

function includesAll(text: string, values: string[]): boolean {
  const normalized = text.toLowerCase();
  return values.every((value) => normalized.includes(value.toLowerCase()));
}

function isStaleEvidence(text: string): boolean {
  const years = [...text.matchAll(/\b(20\d{2})\b/g)].map((match) => Number(match[1]));
  if (years.length === 0) return false;
  return Math.max(...years) < new Date().getFullYear() - 2;
}

function htmlToText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function textAround(text: string, value: string): string {
  const index = text.toLowerCase().indexOf(value.toLowerCase());
  if (index < 0) return text;
  return text.slice(Math.max(0, index - 100), index + value.length + 180).trim();
}

function validName(value: string): boolean {
  return value.split(/\s+/).length >= 2
    && value.split(/\s+/).length <= 4
    && !/\b(the|setmore|company|team|software|funding|followers?|about|logo|profile|linkedin|joomla|featuring|join us|episode|series|webinar|interview|unveiled|creatorsunveiled)\b/i.test(value)
    && !/[.!?]/.test(value);
}

function isPersonSpecificOfficialUrl(url: string, fullName: string): boolean {
  try {
    const pathName = new URL(url).pathname.toLowerCase();
    const nameParts = fullName.toLowerCase().split(/\s+/).filter((part) => part.length > 2);
    return pathName !== '/'
      && (
        nameParts.some((part) => pathName.includes(part))
        || /\/(team|people|leadership|author|authors|staff|management)(?:\/|$)/.test(pathName)
      );
  } catch {
    return false;
  }
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function clean(value: string | undefined): string {
  return String(value ?? '').trim().replace(/[.,:;]+$/, '');
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1).trim()}…`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function readCompanyArg(): string | undefined {
  const args = process.argv.slice(2);
  const index = args.indexOf('--company');
  return index >= 0 ? args[index + 1] : undefined;
}

if (require.main === module) {
  discoverContacts(readCompanyArg()).catch((error) => {
    console.error(errorMessage(error));
    process.exitCode = 1;
  });
}
