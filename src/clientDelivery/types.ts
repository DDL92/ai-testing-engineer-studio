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
