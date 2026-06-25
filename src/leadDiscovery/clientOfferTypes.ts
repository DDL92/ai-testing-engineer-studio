export type OfferTierName =
  | 'Pilot Package'
  | 'Growth Package'
  | 'Premium Package';

export interface OfferTier {
  name: OfferTierName;
  leadVolume: string;
  cadence: string;
  priceRange: string;
  bestFor: string;
  includes: string[];
}

export interface OfferDeliverable {
  name: string;
  description: string;
  includedIn: OfferTierName[];
}

export interface LeadDefinition {
  name: 'Qualified Cold Lead' | 'Warm Intent Lead' | 'Interest-Verified Lead';
  definition: string;
  requirements: string[];
  typicalSignals: string[];
  confidenceExpectation: string;
}

export interface ExclusionDefinition {
  name: string;
  reason: string;
  examples: string[];
}

export interface CommercialTerms {
  leadQuality: string;
  salesGuarantee: string;
  outreachResponsibility: string;
  humanReview: string;
  interestVerification: string;
  advisoryUse: string;
}

export interface ClientOfferPack {
  generatedAt: string;
  client: string;
  serviceName: string;
  serviceExplanation: {
    title: string;
    summary: string;
    capabilities: string[];
    explicitLimits: string[];
  };
  leadDefinitions: LeadDefinition[];
  exclusions: ExclusionDefinition[];
  pricing: OfferTier[];
  deliverables: OfferDeliverable[];
  terms: CommercialTerms;
  readiness: {
    offerStatus: 'READY';
    pricingStatus: 'READY';
    termsStatus: 'READY';
    valueModelStatus: 'PENDING' | 'READY';
  };
}
