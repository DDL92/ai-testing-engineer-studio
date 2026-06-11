import { Opportunity } from '../types/lead';
import { readOpportunities, readSources, writeOpportunities } from '../storage/jsonStore';
import { extractOpportunities } from './opportunityExtractor';
import { fetchEnabledSources } from './sourceFetcher';

export interface FinderResult {
  sourcesChecked: number;
  opportunities: Opportunity[];
  warnings: string[];
}

export async function findLeads(): Promise<FinderResult> {
  const sources = readSources();
  const fetchedSources = await fetchEnabledSources(sources);
  const warnings = fetchedSources.flatMap((item) => item.warning ? [item.warning] : []);
  const existing = readOpportunities();
  const discovered = fetchedSources.flatMap((item) => extractOpportunities(item.source, item.content));
  const merged = mergeOpportunities(existing, discovered);
  writeOpportunities(merged);

  return {
    sourcesChecked: fetchedSources.length,
    opportunities: merged,
    warnings,
  };
}

function mergeOpportunities(existing: Opportunity[], discovered: Opportunity[]): Opportunity[] {
  const byKey = new Map<string, Opportunity>();

  for (const opportunity of existing) {
    byKey.set(dedupeKey(opportunity), opportunity);
  }

  for (const opportunity of discovered) {
    const key = dedupeKey(opportunity);
    const previous = byKey.get(key);
    byKey.set(key, previous ? { ...previous, ...opportunity, createdAt: previous.createdAt } : opportunity);
  }

  return Array.from(byKey.values()).sort((a, b) => b.score - a.score || a.companyName.localeCompare(b.companyName));
}

function dedupeKey(opportunity: Opportunity): string {
  return `${opportunity.companyName}|${opportunity.website}|${opportunity.sourceUrl}`.toLowerCase();
}
