import fs = require('fs');
import path = require('path');

export type BuyerSignalCategory = 'pain' | 'urgency' | 'purchase' | 'recommendation' | 'planning' | 'commercial_value';
export type BuyerSignalStrength = 'weak' | 'medium' | 'strong';

export interface IntentPhraseLibrary {
  pain: string[];
  urgency: string[];
  purchase: string[];
  recommendation: string[];
  planning: string[];
  commercial_value: string[];
}

export interface BuyerSignalExtraction {
  buyerSignals: string[];
  buyerSignalCount: number;
  buyerSignalCategories: BuyerSignalCategory[];
  buyerSignalStrength: BuyerSignalStrength;
}

const libraryDir = path.join(process.cwd(), 'data', 'lead-discovery', 'intent-library');

export function extractBuyerSignals(input: {
  clientId: string;
  title?: string;
  snippet?: string;
  query?: string;
}): BuyerSignalExtraction {
  const library = readIntentPhraseLibrary(input.clientId);
  const text = normalize(`${input.title ?? ''} ${input.snippet ?? ''} ${input.query ?? ''}`);
  if (!library) return emptyExtraction();

  const matches = categoryEntries(library)
    .flatMap(([category, phrases]) => phrases
      .filter((phrase) => text.includes(normalize(phrase)))
      .map((phrase) => ({ category, phrase })));
  const buyerSignals = unique(matches.map((match) => match.phrase));
  const buyerSignalCategories = unique(matches.map((match) => match.category));
  return {
    buyerSignals,
    buyerSignalCount: buyerSignals.length,
    buyerSignalCategories,
    buyerSignalStrength: signalStrength(buyerSignalCategories, buyerSignals.length),
  };
}

export function readIntentPhraseLibrary(clientId: string): IntentPhraseLibrary | null {
  const fileName = clientId === 'flora_and_fauna_foods_001'
    ? 'flora-intent-phrases.json'
    : clientId === 'costa_retreats_001'
      ? 'costa-intent-phrases.json'
      : clientId === 'lzt_costa_rica_001'
        ? 'lzt-intent-phrases.json'
        : null;
  if (!fileName) return null;
  const filePath = path.join(libraryDir, fileName);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as IntentPhraseLibrary;
}

function signalStrength(categories: BuyerSignalCategory[], count: number): BuyerSignalStrength {
  const hasAction = categories.some((category) => ['pain', 'urgency', 'purchase', 'recommendation'].includes(category));
  const hasValue = categories.includes('commercial_value');
  if (count >= 3 && hasAction && hasValue) return 'strong';
  if (count >= 2 && hasAction) return 'medium';
  if (count >= 1) return 'weak';
  return 'weak';
}

function categoryEntries(library: IntentPhraseLibrary): Array<[BuyerSignalCategory, string[]]> {
  return [
    ['pain', library.pain],
    ['urgency', library.urgency],
    ['purchase', library.purchase],
    ['recommendation', library.recommendation],
    ['planning', library.planning],
    ['commercial_value', library.commercial_value],
  ];
}

function emptyExtraction(): BuyerSignalExtraction {
  return {
    buyerSignals: [],
    buyerSignalCount: 0,
    buyerSignalCategories: [],
    buyerSignalStrength: 'weak',
  };
}

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}
