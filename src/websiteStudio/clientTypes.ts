import type { SalesPackJson } from './salesTypes';
import type { WebsiteLeadRecord } from './types';

export type DepositStatus = 'not_recorded' | 'pending' | 'confirmed_manually';
export type PriceRangeStatus = 'within' | 'below' | 'above' | 'not_supplied';

export interface ClientAcceptanceInput {
  clientId: string;
  leadId: string;
  clientName: string;
  acceptanceStatus: 'accepted';
  selectedOffer: string;
  agreedPriceUsd: number | null;
  depositStatus: DepositStatus;
  scopeConfirmed: true;
  targetStartDate: string | null;
  targetDeliveryDate: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  domainStatus: string;
  hostingStatus: string;
  brandAssetsStatus: string;
  contentStatus: string;
  notes: string | null;
}

export interface ParsedPriceRange {
  minimumUsd: number;
  maximumUsd: number;
}

export interface ClientRecord {
  clientId: string;
  leadId: string;
  clientName: string;
  createdAt: string;
  acceptanceStatus: 'accepted';
  selectedOffer: string;
  proposedPriceRange: string;
  agreedPriceUsd: number | null;
  priceRangeStatus: PriceRangeStatus;
  depositStatus: DepositStatus;
  scopeConfirmed: true;
  targetStartDate: string | null;
  targetDeliveryDate: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  domainStatus: string;
  hostingStatus: string;
  brandAssetsStatus: string;
  contentStatus: string;
  leadPackPath: string;
  demoPackPath: string;
  salesPackPath: string;
  onboardingStatus: 'not_started';
  deliveryStatus: 'planning';
  qaStatus: 'not_started';
  maintenanceStatus: 'proposed';
  deploymentAuthorized: false;
  credentialsStored: false;
  paymentVerified: false;
  manualReviewRequired: true;
  notes: string | null;
}

export interface ClientHistoryRecord {
  clientId: string;
  leadId: string;
  clientName: string;
  selectedOffer: string;
  acceptanceStatus: 'accepted';
  createdAt: string;
  outputDirectory: string;
}

export interface ClientPackContext {
  acceptance: ClientAcceptanceInput;
  lead: WebsiteLeadRecord;
  salesPack: SalesPackJson;
  proposal: string;
  sow: string;
  proposedPriceRange: string;
  priceRangeStatus: PriceRangeStatus;
  fictional: boolean;
  leadPackPath: string;
  demoPackPath: string;
  salesPackPath: string;
}
