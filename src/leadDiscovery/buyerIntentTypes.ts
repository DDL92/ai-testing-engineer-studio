export type BuyerType =
  | 'buyer'
  | 'vendor'
  | 'directory'
  | 'unknown';

export type IntentStrength =
  | 'weak'
  | 'medium'
  | 'strong';

export interface BuyerIntentClassification {
  buyerType: BuyerType;
  intentStrength: IntentStrength;
  intentSignals: string[];
  exclusionSignals: string[];
  competitorDetected: boolean;
}
