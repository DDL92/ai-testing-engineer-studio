import { tavilySearch, TavilySearchResponse } from './tavilyClient';

export async function searchPainPoints(query: string, maxResults: number): Promise<TavilySearchResponse> {
  return tavilySearch(query, { maxResults });
}
