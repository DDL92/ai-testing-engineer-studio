import { LeadVertical } from './types';

export type ConversationUrgencyLevel = 'low' | 'medium' | 'high';

export interface ConversationPattern {
  patternId: string;
  clientId: string;
  vertical: LeadVertical;
  phrase: string;
  intentCategory: string;
  urgencyLevel: ConversationUrgencyLevel;
  expectedBuyerRole: string;
  expectedEventOrProjectType: string;
  negativeTerms: string[];
  preferredSources: string[];
  priorityWeight: number;
}

