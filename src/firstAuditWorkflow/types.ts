import { Client } from '../clientReports/types';
import { Lead } from '../leads/types';

export interface FirstAuditWorkflowSource {
  label: string;
  path: string;
  exists: boolean;
  excerpt: string;
}

export interface FirstAuditWorkflowInput {
  generatedAt: string;
  leads: Lead[];
  clients: Client[];
  contextSources: FirstAuditWorkflowSource[];
}

export interface FirstAuditWorkflowReport {
  generatedAt: string;
  leadsReviewed: number;
  clientsReviewed: number;
  contextSources: FirstAuditWorkflowSource[];
  suggestedCommands: string[];
}

export interface WorkflowDocument {
  fileName: string;
  body: string;
}
