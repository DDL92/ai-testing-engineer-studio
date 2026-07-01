import { LeadLikeCandidateInput, LeadLikeClassification, LeadLikeClassificationResult } from './leadLikeTypes';

const floraPositiveSignals = [
  'looking for',
  'need',
  'recommend',
  'recommendations',
  'anyone know',
  'seeking',
  'searching',
  'help finding',
  'need help',
  'event request',
  'caterer cancelled',
  'fundraiser next week',
  'catering help',
  'request for proposals',
  'rfp',
  'food service',
  'food vendor recommendations',
  'bar service',
  'event rentals',
  'wedding catering',
  'private dinner',
  'corporate event',
  'charity event',
];

const lztPositiveSignals = [
  'necesito',
  'busco',
  'estoy construyendo',
  'tanque séptico',
  'tanque septico',
  'planta de tratamiento',
  'solucion de aguas residuales',
  'solución de aguas residuales',
  'ptar',
  'permiso minsa',
  'aguas residuales',
  'no tengo espacio',
  'arquitecto',
  'ingeniero',
  'desarrollador',
  'hotel',
  'cabinas',
  'condominio',
  'aya',
];

const costaPositiveSignals = [
  'planning trip',
  'planning costa rica honeymoon',
  'planning family reunion',
  'travel planning help',
  'family trip',
  'group trip',
  'honeymoon',
  'corporate retreat',
  'need itinerary',
  'itinerary help',
  'villa recommendations',
  'recommendations',
  'where should we stay',
  'costa rica trip',
  'tamarindo vacation',
];

const requestSignals = [
  'looking for',
  'planning',
  'fundraiser next week',
  'catering help',
  'need',
  'needs',
  'anyone know',
  'does anyone know',
  'can anyone recommend',
  'recommendations',
  'seeking',
  'searching for',
  'help finding',
  'where should we',
  'request for proposal',
  'request for proposals',
  'rfp',
  'necesito',
  'necesita solucion',
  'necesita solución',
  'busco',
  'construyendo',
];

const definitionSignals = [
  'definition',
  'meaning',
  'dictionary',
  'thesaurus',
  'what is',
  'what does',
  'wikipedia',
  'wiktionary',
  'merriam-webster',
  'cambridge dictionary',
  'collins dictionary',
];

const directorySignals = [
  'directory',
  'vendor',
  'vendors',
  'marketplace',
  'profile',
  'the knot',
  'theknot',
  'weddingwire',
  'zola',
  'eventective',
  'tripadvisor',
  'yelp',
  'top 10',
  'best caterers',
  'best catering companies',
  'catering companies',
  'near me',
];

const articleSignals = [
  'article',
  'guide',
  'how to',
  'tips',
  'ideas',
  'examples',
  'checklist',
  'blog',
  'news',
  'press release',
  'ultimate guide',
  'things to know',
  'assistance programs',
  'planning association',
  'planning software',
];

const serviceMismatchSignals = [
  'busco limpiar tanque septico',
  'busco limpiar tanque séptico',
  'limpiar tanque septico',
  'limpiar tanque séptico',
  'destape de tuberias',
  'destape de tuberías',
  'necesito fontanero',
  'servicio mas barato',
  'servicio más barato',
  'cheap flights',
];

const landingPageSignals = [
  'homepage',
  'official site',
  'services',
  'pricing',
  'about us',
  'contact us',
  'book now',
  'request a quote',
  'catering services',
  'travel services',
  'wastewater services',
  'venues',
  'venue',
];

export function classifyLeadLikeCandidate(input: LeadLikeCandidateInput): LeadLikeClassificationResult {
  const resultText = normalize(`${input.title} ${input.snippet}`);
  const fullText = normalize(`${input.title} ${input.snippet} ${input.sourceUrl} ${input.sourceName} ${input.sourceCategory}`);
  const urlText = normalize(input.sourceUrl);
  const queryText = normalize(input.query);
  const reasons: string[] = [];
  const strongSignals = unique(findSignals(resultText, requestSignals));
  const positiveSignals = unique([
    ...findSignals(resultText, requestSignals),
    ...findSignals(resultText, floraPositiveSignals),
    ...findSignals(resultText, lztPositiveSignals),
    ...findSignals(resultText, costaPositiveSignals),
  ]);
  const querySignals = unique([
    ...findSignals(queryText, floraPositiveSignals),
    ...findSignals(queryText, lztPositiveSignals),
    ...findSignals(queryText, costaPositiveSignals),
  ]);
  const negativeClassification = negativeClassFor(fullText);
  const publicDiscussionBoost = /\b(reddit\.com|facebook\.com)\b/.test(urlText) ? 1.2 : 0;
  const rfpBoost = /\b(rfp|request for proposal|request for proposals|event request)\b/.test(resultText) ? 1.8 : 0;
  const score = clampScore(
    strongSignals.length * 2.6
    + Math.max(0, positiveSignals.length - strongSignals.length) * 0.9
    + querySignals.length * 0.4
    + publicDiscussionBoost
    + rfpBoost
    - negativePenalty(negativeClassification),
  );

  if (positiveSignals.length > 0) reasons.push(`Result behavior signals: ${positiveSignals.join(', ')}.`);
  if (querySignals.length > 0) reasons.push(`Query intent context: ${querySignals.slice(0, 4).join(', ')}.`);
  if (publicDiscussionBoost > 0) reasons.push('Public social/forum source context.');
  if (rfpBoost > 0) reasons.push('Request/RFP language detected.');
  if (negativeClassification !== 'unknown') reasons.push(`Non-lead content signal: ${negativeClassification}.`);

  const classification = classificationFor(score, positiveSignals, strongSignals, negativeClassification);
  return {
    leadLikeClassification: classification,
    leadLikeReasons: reasons.length > 0 ? reasons : ['No clear lead-like or exclusion signal detected.'],
    leadLikeScore: score,
    leadLikeConfidence: confidenceFor(classification, score, positiveSignals.length, negativeClassification),
    leadLikeSignals: positiveSignals,
  };
}

function negativeClassFor(text: string): LeadLikeClassification {
  if (findSignals(text, definitionSignals).length > 0) return 'definition';
  if (findSignals(text, serviceMismatchSignals).length > 0) return 'article';
  if (isAllowedDiscussionText(text) && findSignals(text, requestSignals).length > 0) return 'unknown';
  if (findSignals(text, directorySignals).length > 0 && !/\b(vendor recommendations|food vendor recommendations|need food vendor)\b/.test(text)) return 'directory';
  if (findSignals(text, articleSignals).length > 0) return 'article';
  if (findSignals(text, landingPageSignals).length > 0) return 'landing_page';
  return 'unknown';
}

function isAllowedDiscussionText(text: string): boolean {
  return /\b(forum|forums|wedding-forums|boards|discussion|thread|community|groups|public_forum)\b/.test(text)
    && !/\b(vendor profile|vendor listing|marketplace listing|business listing|pricing page|company profile)\b/.test(text);
}

function classificationFor(
  score: number,
  positiveSignals: string[],
  strongSignals: string[],
  negativeClassification: LeadLikeClassification,
): LeadLikeClassification {
  if (negativeClassification !== 'unknown' && positiveSignals.length === 0) return negativeClassification;
  if (negativeClassification !== 'unknown' && score < 5.5) return negativeClassification;
  if (strongSignals.length >= 1 && positiveSignals.length >= 2 && score >= 6.5) return 'lead_like';
  if (strongSignals.length >= 1 && score >= 4.2) return 'possibly_lead_like';
  if (negativeClassification !== 'unknown') return negativeClassification;
  return score > 0 ? 'generic_content' : 'unknown';
}

function confidenceFor(
  classification: LeadLikeClassification,
  score: number,
  positiveCount: number,
  negativeClassification: LeadLikeClassification,
): number {
  if (classification === 'lead_like') return clampConfidence(0.65 + positiveCount * 0.08);
  if (classification === 'possibly_lead_like') return clampConfidence(0.45 + positiveCount * 0.08);
  if (negativeClassification !== 'unknown') return clampConfidence(0.72 + Math.min(0.18, score / 50));
  return 0.35;
}

function negativePenalty(classification: LeadLikeClassification): number {
  if (classification === 'definition') return 6;
  if (classification === 'directory') return 5;
  if (classification === 'article') return 3.5;
  if (classification === 'landing_page') return 2.5;
  return 0;
}

function findSignals(text: string, signals: string[]): string[] {
  return signals.filter((signal) => text.includes(normalize(signal)));
}

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

function clampConfidence(score: number): number {
  return Math.max(0, Math.min(0.95, Math.round(score * 100) / 100));
}
