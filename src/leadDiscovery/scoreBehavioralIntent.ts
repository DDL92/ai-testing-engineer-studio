import fs = require('fs');
import path = require('path');

export interface BuyerIntentSignals {
  planningSignals: string[];
  painSignals: string[];
  urgencySignals: string[];
  recommendationSignals: string[];
  purchaseSignals: string[];
  commercialValueSignals: string[];
  exclusionSignals: string[];
}

export interface BehavioralIntentScore {
  behaviorScore: number;
  behaviorConfidence: number;
  behaviorReasons: string[];
  matchedPlanningSignals: string[];
  matchedPainSignals: string[];
  matchedUrgencySignals: string[];
  matchedRecommendationSignals: string[];
  matchedPurchaseSignals: string[];
  matchedCommercialValueSignals: string[];
  matchedExclusionSignals: string[];
}

const signalDir = path.join(process.cwd(), 'data', 'lead-discovery', 'buyer-intent-signals');

export function readBuyerIntentSignals(clientId: string): BuyerIntentSignals | null {
  const fileName = clientId === 'flora_and_fauna_foods_001'
    ? 'flora-intent-signals.json'
    : clientId === 'costa_retreats_001'
      ? 'costa-intent-signals.json'
      : clientId === 'lzt_costa_rica_001'
        ? 'lzt-intent-signals.json'
        : null;
  if (!fileName) return null;
  const filePath = path.join(signalDir, fileName);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as BuyerIntentSignals;
}

export function scoreBehavioralIntent(input: {
  clientId: string;
  title?: string;
  snippet?: string;
  query?: string;
  sourceUrl?: string;
  signals?: BuyerIntentSignals | null;
}): BehavioralIntentScore {
  const signals = input.signals ?? readBuyerIntentSignals(input.clientId);
  const text = normalize(`${input.title ?? ''} ${input.snippet ?? ''} ${input.query ?? ''} ${input.sourceUrl ?? ''}`);
  if (!signals) {
    return {
      behaviorScore: 0,
      behaviorConfidence: 0,
      behaviorReasons: ['No buyer behavior signal library found for client.'],
      matchedPlanningSignals: [],
      matchedPainSignals: [],
      matchedUrgencySignals: [],
      matchedRecommendationSignals: [],
      matchedPurchaseSignals: [],
      matchedCommercialValueSignals: [],
      matchedExclusionSignals: [],
    };
  }

  const matchedPlanningSignals = matchSignals(text, signals.planningSignals);
  const matchedPainSignals = matchSignals(text, signals.painSignals);
  const matchedUrgencySignals = matchSignals(text, signals.urgencySignals);
  const matchedRecommendationSignals = matchSignals(text, signals.recommendationSignals);
  const matchedPurchaseSignals = matchSignals(text, signals.purchaseSignals);
  const matchedCommercialValueSignals = matchSignals(text, signals.commercialValueSignals);
  const matchedExclusionSignals = matchSignals(text, signals.exclusionSignals);
  const rawScore = (
    matchedPlanningSignals.length * 1.5
    + matchedPainSignals.length * 3.2
    + matchedUrgencySignals.length * 2.8
    + matchedRecommendationSignals.length * 2.0
    + matchedPurchaseSignals.length * 3.0
    + matchedCommercialValueSignals.length * 2.4
    - matchedExclusionSignals.length * 4.0
  );
  const behaviorScore = clampScore(rawScore);
  const positiveSignalCount = matchedPlanningSignals.length
    + matchedPainSignals.length
    + matchedUrgencySignals.length
    + matchedRecommendationSignals.length
    + matchedPurchaseSignals.length
    + matchedCommercialValueSignals.length;
  const behaviorConfidence = clampConfidence(positiveSignalCount * 0.12 + (matchedExclusionSignals.length > 0 ? 0.2 : 0));
  const behaviorReasons = [
    matchedPainSignals.length > 0 ? `Pain signals: ${matchedPainSignals.join(', ')}.` : '',
    matchedUrgencySignals.length > 0 ? `Urgency signals: ${matchedUrgencySignals.join(', ')}.` : '',
    matchedPurchaseSignals.length > 0 ? `Purchase signals: ${matchedPurchaseSignals.join(', ')}.` : '',
    matchedCommercialValueSignals.length > 0 ? `Commercial value signals: ${matchedCommercialValueSignals.join(', ')}.` : '',
    matchedPlanningSignals.length > 0 ? `Planning signals: ${matchedPlanningSignals.join(', ')}.` : '',
    matchedRecommendationSignals.length > 0 ? `Recommendation signals: ${matchedRecommendationSignals.join(', ')}.` : '',
    matchedExclusionSignals.length > 0 ? `Exclusion signals: ${matchedExclusionSignals.join(', ')}.` : '',
  ].filter(Boolean);

  return {
    behaviorScore,
    behaviorConfidence,
    behaviorReasons: behaviorReasons.length > 0 ? behaviorReasons : ['No behavioral buyer-intent signals matched.'],
    matchedPlanningSignals,
    matchedPainSignals,
    matchedUrgencySignals,
    matchedRecommendationSignals,
    matchedPurchaseSignals,
    matchedCommercialValueSignals,
    matchedExclusionSignals,
  };
}

function matchSignals(text: string, signals: string[]): string[] {
  return signals.filter((signal) => text.includes(normalize(signal)));
}

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(10, Math.round(value * 10) / 10));
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(0.95, Math.round(value * 100) / 100));
}
