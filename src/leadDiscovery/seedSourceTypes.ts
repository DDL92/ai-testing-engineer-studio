import { LeadVertical } from './types';

export type SeedSourcePriority = 'high' | 'medium' | 'low';
export type ExpectedLeadQuality = 'high' | 'medium' | 'low';

export interface SeedSource {
  sourceId: string;
  clientId: string;
  vertical: LeadVertical | string;
  sourceName: string;
  sourceCategory: string;
  sourceUrlPattern: string;
  region: string;
  priority: SeedSourcePriority;
  enabled: boolean;
  requiresLogin: boolean;
  allowedForAutomation: boolean;
  expectedLeadQuality: ExpectedLeadQuality;
  notes: string;
}
