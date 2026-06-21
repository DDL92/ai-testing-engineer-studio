import fs = require('fs');
import path = require('path');
import { readWebsiteLeads, writeWebsiteLeads } from './leadAdapter';
import { evaluateTavilyCandidate } from './tavilyDiscovery';
import { WebsiteDecision, WebsiteLeadRecord } from './types';

export interface RankedWebsiteLead {
  rank: number;
  leadId: string;
  business: string;
  category: string;
  websitePresence: string;
  score: number;
  decision: WebsiteDecision;
  strongestOpportunity: string;
  primaryOffer: string;
  mainEvidenceGap: string;
  recommendedNextAction: string;
}

export function buildWebsiteRanking(leads: WebsiteLeadRecord[] = readWebsiteLeads()): RankedWebsiteLead[] {
  const order: Record<WebsiteDecision, number> = {
    PRIORITY: 0,
    QUALIFIED: 1,
    REVIEW: 2,
    LOW_PRIORITY: 3,
  };

  const usingStoredLeads = arguments.length === 0;
  const cleaned = leads.map(cleanTavilyRecord);
  if (usingStoredLeads && JSON.stringify(cleaned) !== JSON.stringify(leads)) writeWebsiteLeads(cleaned);

  return cleaned
    .filter((record) => !isFixtureWebsiteLead(record))
    .filter((record) => record.analysis.nextAction !== 'archive low-priority lead')
    .sort((left, right) => (
      order[left.analysis.decision] - order[right.analysis.decision]
      || right.analysis.score - left.analysis.score
      || left.lead.companyName.localeCompare(right.lead.companyName)
    ))
    .map((record, index) => ({
      rank: index + 1,
      leadId: record.lead.id,
      business: record.lead.companyName,
      category: record.lead.industry,
      websitePresence: record.analysis.presence,
      score: record.analysis.score,
      decision: record.analysis.decision,
      strongestOpportunity: record.analysis.strongestOpportunity,
      primaryOffer: record.analysis.primaryOffer.name,
      mainEvidenceGap: record.analysis.evidenceGaps[0] ?? 'None recorded',
      recommendedNextAction: record.analysis.nextAction,
    }));
}

export function isFixtureWebsiteLead(record: WebsiteLeadRecord): boolean {
  const source = record.lead.source.toLowerCase();
  return record.lead.id.startsWith('example_')
    || (record as WebsiteLeadRecord & { fixture?: boolean }).fixture === true
    || source === 'fixture'
    || source === 'test'
    || source.startsWith('fixture:')
    || source.includes('_fixture')
    || source.includes('_test')
    || /\bfictional\b/i.test(record.lead.fitNotes)
    || record.discovery?.sources.some((item) => item.sourceUrl.startsWith('fixture:')) === true;
}

function cleanTavilyRecord(record: WebsiteLeadRecord): WebsiteLeadRecord {
  if (record.lead.source !== 'tavily_search') return record;
  const evaluation = evaluateTavilyCandidate({
    title: record.lead.companyName,
    url: record.lead.website ?? '',
    content: stripConfidenceMarkers(record.lead.fitNotes),
    score: tavilyScore(record.lead.fitNotes),
  }, {
    category: record.lead.industry,
    location: record.location,
  });

  if (!evaluation.candidate) {
    if (record.analysis.nextAction === 'archive low-priority lead') return record;
    return {
      ...record,
      lead: {
        ...record.lead,
        fitNotes: appendMarker(record.lead.fitNotes, `[tavily-rejected:${evaluation.rejectionCategory ?? 'non_business'}]`),
        nextAction: 'archive low-priority lead',
      },
      analysis: {
        ...record.analysis,
        presence: 'unknown',
        score: 0,
        decision: 'LOW_PRIORITY',
        primaryOffer: { name: 'Website QA & Performance Audit', priceRange: record.analysis.primaryOffer.priceRange },
        strongestOpportunity: 'Tavily result rejected as a non-business or editorial page',
        evidenceGaps: unique([
          ...record.analysis.evidenceGaps,
          `Tavily candidate rejected: ${evaluation.diagnostic.reason}`,
        ]),
        nextAction: 'archive low-priority lead',
      },
    };
  }

  if (evaluation.confidence === 'low') {
    const alreadyCapped = record.analysis.decision === 'REVIEW'
      && record.analysis.presence === 'unknown'
      && record.analysis.nextAction === 'verify official business website';
    if (alreadyCapped) return record;
    return {
      ...record,
      lead: {
        ...record.lead,
        fitNotes: appendMarker(record.lead.fitNotes, '[tavily-confidence:low]'),
        nextAction: 'verify official business website',
      },
      analysis: {
        ...record.analysis,
        presence: 'unknown',
        score: Math.min(record.analysis.score, 59),
        decision: 'REVIEW',
        primaryOffer: { name: 'Website QA & Performance Audit', priceRange: record.analysis.primaryOffer.priceRange },
        strongestOpportunity: 'Official business identity requires verification',
        evidenceGaps: unique([...record.analysis.evidenceGaps, 'Official business identity requires manual verification']),
        nextAction: 'verify official business website',
      },
    };
  }
  if (evaluation.candidate.businessName !== record.lead.companyName) {
    return {
      ...record,
      lead: {
        ...record.lead,
        companyName: evaluation.candidate.businessName,
      },
    };
  }
  return record;
}

function tavilyScore(notes: string): number | undefined {
  const match = notes.match(/\[tavily-score:(\d+(?:\.\d+)?)\]/i);
  return match ? Number(match[1]) : undefined;
}

function stripConfidenceMarkers(notes: string): string {
  return notes.replace(/\[tavily-[^\]]+\]\s*/gi, '').trim();
}

function appendMarker(notes: string, marker: string): string {
  return notes.includes(marker) ? notes : `${marker} ${notes}`.trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function writeWebsiteRanking(ranked: RankedWebsiteLead[]): { jsonPath: string; markdownPath: string } {
  const outputDir = path.join(process.cwd(), 'output', 'website-studio');
  const jsonPath = path.join(outputDir, 'lead-ranking.json');
  const markdownPath = path.join(outputDir, 'lead-ranking.md');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify(ranked, null, 2)}\n`, 'utf8');
  fs.writeFileSync(markdownPath, renderRanking(ranked), 'utf8');
  return { jsonPath, markdownPath };
}

function renderRanking(ranked: RankedWebsiteLead[]): string {
  const rows = ranked.map((lead) => (
    `| ${lead.rank} | ${lead.leadId} | ${lead.business} | ${lead.category} | ${lead.websitePresence} | ${lead.score} | ${lead.decision} | ${lead.strongestOpportunity} | ${lead.primaryOffer} | ${lead.mainEvidenceGap} | ${lead.recommendedNextAction} |`
  ));
  return `# Website Studio Lead Ranking

| Rank | Lead ID | Business | Category | Presence | Score | Decision | Strongest opportunity | Primary offer | Main evidence gap | Recommended next action |
| ---: | --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- |
${rows.join('\n')}
`;
}
