import { tavilySearch, TavilySearchResponse } from './tavilyClient';

export async function searchLeads(query: string, maxResults: number): Promise<TavilySearchResponse> {
  return tavilySearch(query, { maxResults });
}
