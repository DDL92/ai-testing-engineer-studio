import { tavilySearch, TavilySearchResponse } from './tavilyClient';

export async function searchCompetitors(query: string, maxResults: number): Promise<TavilySearchResponse> {
  return tavilySearch(query, { maxResults });
}
