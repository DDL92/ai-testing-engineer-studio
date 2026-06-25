export type ResultRelevance =
  | 'relevant'
  | 'likely_irrelevant'
  | 'blocked_domain'
  | 'directory'
  | 'vendor'
  | 'definition_page'
  | 'reference_page'
  | 'marketplace';

export interface ResultRelevanceEvaluation {
  resultRelevance: ResultRelevance;
  relevanceReasons: string[];
  domainBlocked: boolean;
  domainCategory: string;
}
