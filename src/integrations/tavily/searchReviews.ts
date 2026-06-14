import { tavilySearch, TavilySearchResponse } from './tavilyClient';

export async function searchReviews(query: string, maxResults: number): Promise<TavilySearchResponse> {
  return tavilySearch(query, { maxResults });
}
