import { BuyerIntentClassification, BuyerType, IntentStrength } from './buyerIntentTypes';
import { LeadVertical } from './types';

interface BuyerIntentInput {
  clientId: string;
  vertical: LeadVertical;
  title: string;
  snippet: string;
  url: string;
  sourceName: string;
  sourceCategory: string;
  estimatedLeadType?: string;
  estimatedEventType?: string;
  estimatedTripType?: string;
}

const floraBuyerSignals = [
  'looking for catering',
  'need catering',
  'searching for caterer',
  'searching for catering',
  'wedding planning',
  'planning a wedding',
  'planning wedding',
  'planning event',
  'corporate event',
  'planning corporate event',
  'fundraiser',
  'private dinner',
  'charity event',
  'reception',
  'birthday party',
  'recommendations for catering',
  'recommendations requested',
  'seeking vendors',
  'looking for rentals',
  'event rentals needed',
  'need bar service',
  'bar service needed',
  'need food service',
  'food service needed',
  'need food and bar service',
];

const floraVendorSignals = [
  'caterer',
  'caterers',
  'catering company',
  'catering companies',
  'food service provider',
  'market',
  'restaurant',
  'vendor profile',
  'event vendor',
  'company profile',
  'caterers near me',
  'venue rentals',
  'venue rental',
  'event venue',
  'wedding venue',
  'host your next',
  'civic center',
];

const floraDirectorySignals = [
  'eventective caterers',
  'directory listing',
  'event planner directory',
  'vendor directory',
  'vendor directories',
  'caterer directory',
  'catering directory',
  'directory',
];

const costaBuyerSignals = [
  'travelers',
  'families',
  'groups',
  'corporate retreats',
  'corporate retreat',
  'honeymoon planning',
  'trip planning',
  'planning a trip',
  'planning costa rica trip',
  'looking for retreat',
  'need retreat',
  'family vacation',
  'group travel',
];

const costaVendorSignals = [
  'travel agency',
  'travel agencies',
  'tour operator',
  'tour operators',
  'travel company',
  'tour company',
  'resort operator',
];

const costaDirectorySignals = [
  'resort directory',
  'travel directory',
  'tour directory',
  'hotel directory',
  'directory listing',
];

const strongIntentSignals = [
  'need catering',
  'looking for catering',
  'searching for catering',
  'planning wedding',
  'planning a wedding',
  'planning corporate event',
  'seeking vendors',
  'need food and bar service',
  'looking for rentals',
  'event rentals needed',
  'food service needed',
  'bar service needed',
  'corporate retreat',
  'honeymoon planning',
  'trip planning',
];

export function classifyBuyerIntent(input: BuyerIntentInput): BuyerIntentClassification {
  const text = searchableText(input);
  const intentSignals = detectIntentSignals(input, text);
  const exclusionSignals = detectExclusionSignals(input, text, intentSignals);
  const buyerType = detectBuyerType(input, intentSignals, exclusionSignals);
  const competitorDetected = detectCompetitorSignals(input, text, intentSignals).length > 0;

  return {
    buyerType: competitorDetected && buyerType !== 'directory' ? 'vendor' : buyerType,
    intentStrength: detectIntentStrength(input, intentSignals),
    intentSignals,
    exclusionSignals,
    competitorDetected,
  };
}

export function detectBuyerType(
  input: BuyerIntentInput,
  intentSignals = detectIntentSignals(input, searchableText(input)),
  exclusionSignals = detectExclusionSignals(input, searchableText(input), intentSignals),
): BuyerType {
  if (exclusionSignals.some((signal) => signal.includes('directory'))) return 'directory';
  if (detectCompetitorSignals(input, searchableText(input), intentSignals).length > 0) return 'vendor';
  if (intentSignals.length > 0) return 'buyer';
  return 'unknown';
}

export function detectIntentStrength(input: BuyerIntentInput, intentSignals = detectIntentSignals(input, searchableText(input))): IntentStrength {
  if (intentSignals.some((signal) => strongIntentSignals.includes(signal))) return 'strong';
  if (intentSignals.length >= 2) return 'strong';
  if (intentSignals.length === 1) return 'medium';
  return 'weak';
}

export function detectCompetitorSignals(
  input: BuyerIntentInput,
  text = searchableText(input),
  intentSignals = detectIntentSignals(input, text),
): string[] {
  const vendorSignals = vendorSignalSet(input);
  const matched = matchSignals(text, vendorSignals);
  const profileSignals = matched.filter((signal) => (
    signal.includes('profile')
    || signal.includes('company')
    || signal.includes('provider')
    || signal.includes('agency')
    || signal.includes('operator')
  ));
  const buyerContext = intentSignals.length > 0;

  if (profileSignals.length > 0) return profileSignals;
  if (!buyerContext) return matched;

  return matched.filter((signal) => !['caterer', 'caterers', 'market', 'restaurant'].includes(signal));
}

function detectIntentSignals(input: BuyerIntentInput, text: string): string[] {
  return matchSignals(text, buyerSignalSet(input));
}

function detectExclusionSignals(input: BuyerIntentInput, text: string, intentSignals: string[]): string[] {
  const directorySignals = [
    ...matchSignals(text, directorySignalSet(input)),
    ...hostDirectorySignals(input, text),
  ];
  const competitorSignals = detectCompetitorSignals(input, text, intentSignals);
  return [...new Set([...directorySignals, ...competitorSignals])];
}

function hostDirectorySignals(input: BuyerIntentInput, text: string): string[] {
  if (input.vertical === 'travel_leads') {
    return [
      text.includes('resort directory') ? 'resort directory' : '',
      text.includes('travel agency directory') ? 'travel agency directory' : '',
    ].filter(Boolean);
  }

  const signals: string[] = [];
  if (text.includes('eventective') && (text.includes('caterer') || text.includes('caterers'))) {
    signals.push('vendor directory: eventective caterers');
  }
  if (text.includes('weddingwire')) signals.push('vendor directory: weddingwire');
  if (text.includes('theknot')) signals.push('vendor directory: the knot');
  if (text.includes('zola')) signals.push('vendor directory: zola');
  if (text.includes(' caterers ') && (text.includes('find caterers') || text.includes('top caterers'))) {
    signals.push('vendor directory: caterer listing');
  }
  return signals;
}

function buyerSignalSet(input: BuyerIntentInput): string[] {
  return input.vertical === 'travel_leads' ? costaBuyerSignals : floraBuyerSignals;
}

function vendorSignalSet(input: BuyerIntentInput): string[] {
  return input.vertical === 'travel_leads' ? costaVendorSignals : floraVendorSignals;
}

function directorySignalSet(input: BuyerIntentInput): string[] {
  return input.vertical === 'travel_leads' ? costaDirectorySignals : floraDirectorySignals;
}

function searchableText(input: BuyerIntentInput): string {
  return normalize([
    input.title,
    input.snippet,
    input.url,
    input.sourceName,
    input.sourceCategory,
    input.estimatedLeadType ?? '',
    input.estimatedEventType ?? '',
    input.estimatedTripType ?? '',
  ].join(' '));
}

function matchSignals(text: string, signals: string[]): string[] {
  return signals.filter((signal) => text.includes(normalize(signal)));
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}
