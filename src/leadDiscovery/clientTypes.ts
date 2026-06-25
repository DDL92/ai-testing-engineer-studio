import { LeadVertical } from './types';

export type LeadDiscoveryClientStatus = 'active' | 'paused' | 'archived';
export type LeadDeliveryCadence = 'daily' | 'weekly' | 'manual';

export interface LeadDiscoveryClientConfig {
  clientId: string;
  clientName: string;
  status: LeadDiscoveryClientStatus;
  vertical: LeadVertical;
  targetLocations: string[];
  preferredLeadTypes: string[];
  excludedLeadTypes: string[];
  minScore: number;
  leadGoalPerDay: number;
  deliveryCadence: LeadDeliveryCadence;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
