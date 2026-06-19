import fs = require('fs');
import path = require('path');
import { readWebsiteLeads } from './leadAdapter';
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

  return [...leads]
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
