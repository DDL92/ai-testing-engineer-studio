import { Client } from '../clientReports/types';

export type ClientDeliveryDocumentName =
  | 'delivery-plan.md'
  | 'evidence-log.md'
  | 'qa-checklist.md'
  | 'weekly-delivery-summary.md'
  | 'client-update-draft.md';

export interface LocalDeliverySource {
  label: string;
  path: string;
  exists: boolean;
}

export interface ClientDeliveryInput {
  client: Client;
  sources: LocalDeliverySource[];
}

export interface ClientDeliveryDocument {
  fileName: ClientDeliveryDocumentName;
  title: string;
  body: string;
}

export interface EvidenceInventory {
  auditEvidence: string[];
  screenshots: string[];
  testResults: string[];
  defects: string[];
  risks: string[];
  recommendations: string[];
  followUpItems: string[];
}

export type DeliveryClientStatus = 'delivery-prep' | 'active' | 'paused' | 'completed' | 'at-risk';

export type DeliveryEngagementType =
  | 'QA Audit'
  | 'Playwright Starter Pack'
  | 'QA Automation Retainer'
  | 'Manual Review';

export type ClientHealthScore = 'Green' | 'Yellow' | 'Red';

export interface DeliveryClient {
  clientId: string;
  clientName: string;
  website: string;
  status: DeliveryClientStatus;
  startDate: string;
  engagementType: DeliveryEngagementType;
  scope: string[];
  deliverables: string[];
  reportingSchedule: string;
  nextMilestone: string;
  completedActivities: string[];
  coverageAdded: string[];
  observations: string[];
  nextWeekFocus: string[];
  riskAreas: string[];
  recommendations: string[];
  renewalNotes: string[];
}

export interface DeliverySource {
  label: string;
  path: string;
  exists: boolean;
}

export interface ClientDeliveryAutomationInput {
  generatedAt: string;
  client: DeliveryClient;
  sources: DeliverySource[];
}

export interface ClientDeliveryAssessment {
  healthScore: ClientHealthScore;
  valueDelivered: string[];
  renewalProbability: 'High' | 'Medium' | 'Low';
  expansionOpportunities: string[];
  recommendedNextStep: string;
}
