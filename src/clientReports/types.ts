export type ClientServiceType =
  | 'qa-audit'
  | 'playwright-starter-pack'
  | 'qa-automation-retainer'
  | 'agency-partner-retainer';

export type ClientStatus = 'active' | 'paused' | 'completed' | 'at-risk';

export interface Client {
  id: string;
  companyName: string;
  website: string;
  serviceType: ClientServiceType;
  status: ClientStatus;
  startDate: string;
  monthlyFee: number;
  currentFocus: string;
  completedWork: string[];
  openRisks: string[];
  recommendedNextSteps: string[];
  lastReportDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientReportSection {
  title: string;
  body: string[];
}

export interface ClientReport {
  clientId: string;
  companyName: string;
  generatedAt: string;
  sections: ClientReportSection[];
}
