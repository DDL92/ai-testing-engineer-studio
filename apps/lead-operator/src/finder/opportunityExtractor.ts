import { LeadSource, Opportunity } from '../types/lead';
import { stableId } from '../utils/ids';
import { detectKeywords } from './keywordExtractor';
import { recommendedOffer, scoreText } from '../scoring/scorer';

export function extractOpportunities(source: LeadSource, content: string): Opportunity[] {
  if (!content.trim()) return [];

  const rawRecords = source.type === 'manual_json'
    ? recordsFromManualJson(content)
    : recordsFromText(source, content);

  const now = new Date().toISOString();
  const maxResults = Math.max(1, Math.min(source.maxResults ?? 80, 100));
  return rawRecords
    .slice(0, maxResults)
    .map((record) => {
      const text = `${record.companyName} ${record.website} ${record.title} ${record.summary}`;
      const scoreBreakdown = scoreText({ companyName: record.companyName, website: record.website, text, source: source.name });
      const id = stableId(record.companyName, record.website, source.id, record.sourceUrl);
      const detectedKeywords = detectKeywords(text);
      const includeKeywords = source.includeKeywords ?? [];
      const excludeKeywords = source.excludeKeywords ?? [];

      return {
        id,
        companyName: record.companyName,
        website: record.website,
        source: source.name,
        sourceId: source.id,
        sourceName: source.name,
        sourceCategory: source.category,
        sourceUrl: record.sourceUrl || source.url || source.path || '',
        matchedKeywords: includeKeywords.filter((keyword) => text.toLowerCase().includes(keyword.toLowerCase())),
        excludedKeywords: excludeKeywords.filter((keyword) => text.toLowerCase().includes(keyword.toLowerCase())),
        sourcePriority: source.priority,
        foundAt: now,
        title: record.title,
        summary: record.summary,
        detectedKeywords,
        score: scoreBreakdown.total,
        scoreBreakdown,
        category: scoreBreakdown.category,
        suggestedOffer: recommendedOffer(scoreBreakdown.total),
        createdAt: now,
        updatedAt: now,
      };
    })
    .filter((opportunity) => opportunity.excludedKeywords?.length === 0 && isAllowedDomain(source.allowedDomains, opportunity.sourceUrl || opportunity.website) && (opportunity.detectedKeywords.length > 0 || opportunity.score >= 20));
}

function recordsFromManualJson(content: string): RawOpportunity[] {
  const parsed = JSON.parse(content) as Array<Partial<RawOpportunity>>;
  return parsed.map((item, index) => ({
    companyName: item.companyName || `Manual Lead ${index + 1}`,
    website: item.website || '',
    sourceUrl: item.sourceUrl || item.website || '',
    title: item.title || item.companyName || `Manual Lead ${index + 1}`,
    summary: item.summary || '',
  }));
}

function recordsFromText(source: LeadSource, content: string): RawOpportunity[] {
  const rssRecords = recordsFromRss(content);
  if (rssRecords.length > 0) return rssRecords;

  const normalized = stripTags(content)
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length >= 40 && line.length <= 1000);

  return normalized.slice(0, 80).map((line, index) => {
    const website = extractUrl(line) || '';
    const companyName = extractCompanyName(line, source.name, index);
    return {
      companyName,
      website,
      sourceUrl: website || source.url || '',
      title: line.slice(0, 120),
      summary: line.slice(0, 700),
    };
  });
}

function recordsFromRss(content: string): RawOpportunity[] {
  const items = Array.from(content.matchAll(/<item\b[\s\S]*?<\/item>/gi)).slice(0, 80);
  return items.map((match, index) => {
    const item = match[0];
    const title = decodeEntities(extractTag(item, 'title') || `RSS Opportunity ${index + 1}`);
    const link = sanitizeUrl(decodeEntities(extractTag(item, 'link') || ''));
    const description = decodeEntities(stripTags(extractTag(item, 'description') || '')).replace(/\s+/g, ' ').trim();

    return {
      companyName: title.split(/\s[-|:]\s/)[0]?.slice(0, 80) || `RSS Opportunity ${index + 1}`,
      website: link,
      sourceUrl: link,
      title,
      summary: description || title,
    };
  });
}

function extractTag(content: string, tagName: string): string {
  const match = content.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match?.[1]?.trim() ?? '';
}

function stripTags(content: string): string {
  return content
    .replace(/<script[\s\S]*?<\/script>/gi, '\n')
    .replace(/<style[\s\S]*?<\/style>/gi, '\n')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractUrl(text: string): string | undefined {
  const match = text.match(/https?:\/\/[^\s)"'<]+/i);
  return match ? sanitizeUrl(match[0]) : undefined;
}

function extractCompanyName(text: string, sourceName: string, index: number): string {
  const beforeDash = text.split(/\s[-|:]\s/)[0]?.trim();
  if (beforeDash && beforeDash.length <= 80) return beforeDash;
  return `${sourceName} Opportunity ${index + 1}`;
}

interface RawOpportunity {
  companyName: string;
  website: string;
  sourceUrl: string;
  title: string;
  summary: string;
}

function sanitizeUrl(url: string): string {
  return url.replace(/[.,;]+$/, '').trim();
}

function isAllowedDomain(allowedDomains: string[] | undefined, urlValue: string): boolean {
  if (!allowedDomains?.length || !urlValue) return true;
  try {
    const hostname = new URL(urlValue).hostname.replace(/^www\./, '');
    return allowedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return true;
  }
}

function decodeEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}
