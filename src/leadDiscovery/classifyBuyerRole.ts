import fs = require('fs');
import path = require('path');
import { BuyerRole, BuyerRoleClassification, BuyerRoleConfidence } from './buyerRoleTypes';
import { BuyerType } from './buyerIntentTypes';
import { LeadVertical } from './types';

interface BuyerRoleInput {
  clientId: string;
  vertical: LeadVertical;
  title: string;
  snippet: string;
  url: string;
  sourceName: string;
  sourceCategory: string;
  query?: string;
  buyerType?: BuyerType;
  estimatedLeadType?: string;
  estimatedEventType?: string;
  estimatedTripType?: string;
}

const floraNegativeSignalsPath = path.join(process.cwd(), 'data', 'lead-discovery', 'negative-signals', 'flora-staffing-signals.json');
const floraPositiveSignalsPath = path.join(process.cwd(), 'data', 'lead-discovery', 'positive-signals', 'flora-buyer-signals.json');

const fallbackFloraStaffingSignals = [
  'hiring',
  'looking for staff',
  'looking for servers',
  'hiring bartenders',
  'looking for models',
  'event staff',
  'pay rate',
  '$/hr',
  'shift',
  'hours',
  'employment',
  'job',
  'work',
  'looking to work',
  'experience required',
  'dm me to work',
  'staff needed',
  'hiring immediately',
];

const fallbackFloraBuyerSignals = [
  'looking for caterer',
  'need catering recommendations',
  'accepting catering proposals',
  'our caterer cancelled',
  'need food vendor',
  'need bar service',
  'need rentals',
  'looking for catering',
  'food vendor recommendations',
  'recommend a caterer',
];

const lztBuyerSignals = [
  'tanque septico se rebalsa',
  'tanque séptico se rebalsa',
  'no tengo espacio para drenaje',
  'el terreno no drena',
  'necesito ptar',
  'ptar para hotel',
  'fuera de red aya',
  'permiso minsa aguas residuales',
  'construyendo hotel',
  'construyendo cabinas',
  'arquitecto necesita solucion de aguas residuales',
  'arquitecto necesita solución de aguas residuales',
  'planta de tratamiento',
  'aguas residuales',
];

const lztNonBuyerSignals = [
  'limpiar tanque septico',
  'limpiar tanque séptico',
  'destape de tuberias',
  'destape de tuberías',
  'necesito fontanero',
  'servicio mas barato',
  'servicio más barato',
];

const costaBuyerSignals = [
  'planning costa rica honeymoon',
  'planning costa rica family trip',
  'need itinerary help',
  'looking for villa recommendations',
  'planning family reunion',
  'corporate retreat in tamarindo',
  'group trip recommendations',
  'costa rica concierge recommendations',
];

const articleSignals = [
  'wikipedia article',
  'travel blog',
  'general costa rica guide',
  'cheap flights article',
  'top 10',
  'directory',
];

const employeeSeekingSignals = [
  'looking to work',
  'available to work',
  'seeking work',
  'looking for work',
  'catering experience looking',
  'server available',
  'bartender available',
];

const jobPostingSignals = [
  'job posting',
  'job opportunity',
  'apply now',
  'now hiring',
  'we are hiring',
  'hiring immediately',
  'open position',
  'experience required',
  'pay rate',
  '$/hr',
];

const staffingRecruitmentSignals = [
  'looking for model types',
  'to work',
  'work two catering events',
  'dm me to work',
  'staff needed',
  'event staff',
  'looking for staff',
  'looking for servers',
  'hiring bartenders',
  'looking for models',
];

export function classifyBuyerRole(input: BuyerRoleInput): BuyerRoleClassification {
  const text = searchableText(input);
  const staffingSignals = matchSignals(text, [...readSignals(floraNegativeSignalsPath, fallbackFloraStaffingSignals), ...staffingRecruitmentSignals]);
  const jobSignals = matchSignals(text, jobPostingSignals);
  const employeeSignals = matchSignals(text, employeeSeekingSignals);
  const buyerSignals = matchSignals(text, buyerSignalsFor(input));
  const nonBuyerSignals = matchSignals(text, nonBuyerSignalsFor(input));

  if (nonBuyerSignals.length > 0) {
    return result(articleSignals.some((signal) => nonBuyerSignals.includes(signal)) ? 'directory' : 'unknown', confidence(nonBuyerSignals.length, buyerSignals.length), nonBuyerSignals, [
      'Candidate matches local non-buyer or service-mismatch signals.',
    ]);
  }

  if (employeeSignals.length > 0) {
    return result('employee_seeking_work', confidence(employeeSignals.length, buyerSignals.length), employeeSignals, [
      'Person appears to be seeking work, not buying a service.',
    ]);
  }

  const staffingPatternDetected = hasStaffingPattern(text);
  if (staffingSignals.length >= 2 || staffingPatternDetected) {
    return result('staffing_recruitment', staffingPatternDetected || staffingSignals.length >= 3 ? 'high' : confidence(staffingSignals.length, buyerSignals.length), staffingSignals, [
      'Post is recruiting workers or event staff instead of purchasing catering services.',
    ]);
  }

  if (jobSignals.length > 0) {
    return result('job_posting', confidence(jobSignals.length, buyerSignals.length), jobSignals, [
      'Post contains employment or job-posting language.',
    ]);
  }

  if (input.buyerType === 'directory') {
    return result('directory', 'high', ['buyer intent classifier: directory'], [
      'Existing buyer intent classifier identified a directory/listing result.',
    ]);
  }

  if (input.buyerType === 'vendor') {
    return result('vendor', 'high', ['buyer intent classifier: vendor'], [
      'Existing buyer intent classifier identified a vendor or competitor result.',
    ]);
  }

  if (buyerSignals.length > 0 || input.buyerType === 'buyer') {
    return result('buyer_service', confidence(buyerSignals.length || 1, staffingSignals.length + jobSignals.length), buyerSignals, [
      'Candidate shows service-buying language or was classified as a buyer by intent rules.',
    ]);
  }

  return result('unknown', 'low', [], [
    'No clear buyer, vendor, directory, staffing, job, or employee-seeking signals were detected.',
  ]);
}

function result(
  buyerRole: BuyerRole,
  buyerRoleConfidence: BuyerRoleConfidence,
  buyerRoleSignals: string[],
  buyerRoleReasons: string[],
): BuyerRoleClassification {
  return {
    buyerRole,
    buyerRoleConfidence,
    buyerRoleSignals: [...new Set(buyerRoleSignals)],
    buyerRoleReasons,
  };
}

function confidence(positiveSignals: number, counterSignals: number): BuyerRoleConfidence {
  if (positiveSignals >= 2 && counterSignals === 0) return 'high';
  if (positiveSignals >= 2) return 'medium';
  if (positiveSignals === 1) return 'medium';
  return 'low';
}

function hasStaffingPattern(text: string): boolean {
  return (
    text.includes('catering experience')
    && text.includes('work')
    && (text.includes('dm me') || text.includes('asap') || text.includes('event staff') || text.includes('model types'))
  );
}

function buyerSignalsFor(input: BuyerRoleInput): string[] {
  if (input.clientId === 'lzt_costa_rica_001') return lztBuyerSignals;
  if (input.clientId === 'costa_retreats_001' || input.vertical === 'travel_leads') return costaBuyerSignals;
  return readSignals(floraPositiveSignalsPath, fallbackFloraBuyerSignals);
}

function nonBuyerSignalsFor(input: BuyerRoleInput): string[] {
  if (input.clientId === 'lzt_costa_rica_001') return lztNonBuyerSignals;
  if (input.clientId === 'costa_retreats_001' || input.vertical === 'travel_leads') return articleSignals;
  return [];
}

function readSignals(filePath: string, fallback: string[]): string[] {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
    if (!Array.isArray(parsed)) return fallback;
    return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  } catch {
    return fallback;
  }
}

function searchableText(input: BuyerRoleInput): string {
  return normalize([
    input.query ?? '',
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
  return value.toLowerCase().replace(/[^a-z0-9/$]+/g, ' ').replace(/\s+/g, ' ').trim();
}
