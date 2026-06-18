export type ClientPackage = 'qa-audit' | 'starter-pack' | 'retainer';

export type ClientConversionStatus =
  | 'lead'
  | 'interested'
  | 'qualified'
  | 'client'
  | 'delivery-prep'
  | 'delivery-active'
  | 'completed';

export interface ClientRecord {
  clientId: string;
  clientName: string;
  website: string;
  sourceLead: string;
  sourceLeadRank: number;
  commercialReadiness: number;
  selectedPackage: ClientPackage;
  status: ClientConversionStatus;
  createdAt: string;
  updatedAt: string;
  approvalStatus: 'human-review-required';
}

export interface ClientHistoryEntry {
  eventId: string;
  clientId: string;
  clientName: string;
  event: 'converted-to-delivery-prep' | 'package-selected' | 'status-reviewed';
  status: ClientConversionStatus;
  selectedPackage: ClientPackage;
  createdAt: string;
  notes: string;
}

export interface PackageSelection {
  clientId: string;
  clientName: string;
  selectedPackage: ClientPackage;
  selectedAt: string;
  selectionBasis: string[];
  approvalStatus: 'human-review-required';
}

export interface ClientConversionResult {
  generatedAt: string;
  record: ClientRecord;
  packageSelection: PackageSelection;
  previousStatus: ClientConversionStatus | null;
  conversionStatus: 'CREATED' | 'UPDATED';
  nextAction: string;
  safetyRules: string[];
}

export interface ClientConversionDashboard {
  clientStatus: string;
  selectedPackage: string;
  clientName: string;
  nextClientAction: string;
}
