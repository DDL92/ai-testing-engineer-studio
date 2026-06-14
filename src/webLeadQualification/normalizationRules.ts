import fs = require('fs');
import path = require('path');
import { WebLeadCandidate } from '../webLeadDiscovery/types';
import {
  LeadCategory,
  LeadQualificationDashboard,
  LeadQualificationReport,
  NormalizedWebLead,
  QualifiedLeadScoreBreakdown,
  RecommendedQualifiedOffer,
} from './types';

const rawLeadsPath = path.join(process.cwd(), 'data', 'web-discovery', 'discovered-web-leads.json');
const normalizedLeadsPath = path.join(process.cwd(), 'data', 'web-discovery', 'normalized-leads.json');
const outputRoot = path.join(process.cwd(), 'output', 'lead-qualification');

const safetyRules = [
  'Qualification uses existing discovered Tavily lead data only.',
  'Raw web discovery data is preserved and not modified.',
  'No outreach, emails, LinkedIn messages, CRM integrations, meetings, invoices, payments, or external actions are created.',
  'No companies, pain signals, revenue, replies, or client interest are invented.',
  'Human approval is required before promoting any qualified lead.',
];

export function buildLeadQualificationReport(): LeadQualificationReport {
  return buildLeadQualificationReportFromCandidates(loadRawLeads());
}

export function buildLeadQualificationReportFromCandidates(rawLeads: WebLeadCandidate[]): LeadQualificationReport {
  const normalizedCandidates = rawLeads.map((lead) => qualifyLead(lead));
  const deduped = dedupeQualifiedLeads(normalizedCandidates);
  const topQualifiedLeads = [...deduped].sort(sortQualifiedLeads);
  const best = topQualifiedLeads[0];

  return {
    generatedAt: new Date().toISOString(),
    rawCount: rawLeads.length,
    normalizedLeads: topQualifiedLeads,
    duplicatesRemoved: rawLeads.length - topQualifiedLeads.length,
    topQualifiedLeads,
    bestCategory: best?.category ?? 'None',
    bestOffer: best?.recommendedOffer ?? 'None',
    safetyRules,
  };
}

export function writeNormalizedLeads(report: LeadQualificationReport): string[] {
  fs.mkdirSync(path.dirname(normalizedLeadsPath), { recursive: true });
  fs.writeFileSync(normalizedLeadsPath, `${JSON.stringify(report.normalizedLeads, null, 2)}\n`, 'utf8');
  return [normalizedLeadsPath];
}

export function writeClassificationOutput(report: LeadQualificationReport): string[] {
  return writeOutputs([
    { fileName: 'lead-classification.md', body: renderClassification(report) },
  ]);
}

export function writeQualificationOutput(report: LeadQualificationReport): string[] {
  writeNormalizedLeads(report);
  return writeOutputs([
    { fileName: 'lead-qualification.md', body: renderQualification(report) },
  ]);
}

export function writeQaOpportunityOutput(report: LeadQualificationReport): string[] {
  writeNormalizedLeads(report);
  return writeOutputs([
    { fileName: 'qa-opportunity-scores.md', body: renderQaOpportunity(report) },
  ]);
}

export function writeQualifiedRankingOutput(report: LeadQualificationReport): string[] {
  writeNormalizedLeads(report);
  return writeOutputs([
    { fileName: 'qualified-ranking.md', body: renderQualifiedRanking(report) },
    { fileName: 'recommended-offers.md', body: renderRecommendedOffers(report) },
  ]);
}

export function buildLeadQualificationDashboard(): LeadQualificationDashboard {
  const report = buildLeadQualificationReport();
  const best = report.topQualifiedLeads[0];
  const highestQa = [...report.topQualifiedLeads].sort((left, right) => right.qaOpportunityScore - left.qaOpportunityScore || right.qualificationScore - left.qualificationScore)[0];

  return {
    bestQualifiedLead: best?.normalizedName ?? 'No qualified web leads',
    bestCategory: best?.category ?? 'None',
    highestQaOpportunity: highestQa ? `${highestQa.normalizedName} (${highestQa.qaOpportunityScore}/100)` : 'No QA opportunity scored',
    recommendedOffer: best?.recommendedOffer ?? 'None',
    qualifiedLeadsCount: report.normalizedLeads.length,
  };
}

export function renderQualifiedRanking(report: LeadQualificationReport): string {
  return [
    '# Qualified Web Lead Ranking',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Rank | Company | Category | Qualification Score | QA Opportunity Score | Recommended Offer |',
    '| ---: | --- | --- | ---: | ---: | --- |',
    ...report.topQualifiedLeads.map((lead, index) => `| ${index + 1} | ${escapeTable(lead.normalizedName)} | ${lead.category} | ${lead.qualificationScore} | ${lead.qaOpportunityScore} | ${lead.recommendedOffer} |`),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderRecommendedOffers(report: LeadQualificationReport): string {
  return [
    '# Recommended Offers',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Company | Recommended Offer | Why |',
    '| --- | --- | --- |',
    ...report.topQualifiedLeads.map((lead) => `| ${escapeTable(lead.normalizedName)} | ${lead.recommendedOffer} | ${escapeTable(offerReason(lead))} |`),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

function renderClassification(report: LeadQualificationReport): string {
  return [
    '# Lead Classification',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Company | Raw Title | Category | Website |',
    '| --- | --- | --- | --- |',
    ...report.normalizedLeads.map((lead) => `| ${escapeTable(lead.normalizedName)} | ${escapeTable(lead.rawName)} | ${lead.category} | ${escapeTable(lead.website)} |`),
    '',
  ].join('\n');
}

function renderQualification(report: LeadQualificationReport): string {
  return [
    '# Lead Qualification',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderList([
      `Raw Tavily leads reviewed: ${report.rawCount}`,
      `Normalized leads: ${report.normalizedLeads.length}`,
      `Duplicates removed: ${report.duplicatesRemoved}`,
      `Best category: ${report.bestCategory}`,
      `Best offer: ${report.bestOffer}`,
    ]),
    '',
    renderQualifiedRanking(report),
  ].join('\n');
}

function renderQaOpportunity(report: LeadQualificationReport): string {
  return [
    '# QA Opportunity Scores',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Company | QA Opportunity Score | Public Journeys | Booking | Checkout | Mobile | Scheduling | Membership | Integrations | Release Risk |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...report.topQualifiedLeads.map((lead) => `| ${escapeTable(lead.normalizedName)} | ${lead.qaOpportunityScore} | ${lead.scoreBreakdown.publicJourneys} | ${lead.scoreBreakdown.bookingFlow} | ${lead.scoreBreakdown.checkoutFlow} | ${lead.scoreBreakdown.mobileFlow} | ${lead.scoreBreakdown.schedulingFlow} | ${lead.scoreBreakdown.membershipFlow} | ${lead.scoreBreakdown.integrations} | ${lead.scoreBreakdown.releaseRisk} |`),
    '',
  ].join('\n');
}

function qualifyLead(rawLead: WebLeadCandidate): NormalizedWebLead {
  const normalizedName = normalizeCompanyName(rawLead);
  const text = leadText(rawLead, normalizedName);
  const category = classifyLead(text, rawLead.website);
  const isAggregatorOrArticle = aggregatorOrArticle(text, rawLead.sourceUrl || rawLead.source);
  const breakdown = scoreBreakdown(text, rawLead, category, isAggregatorOrArticle);
  const qualificationScore = Math.min(100, Math.round(
    breakdown.industryFit * 0.2
    + breakdown.qaFit * 0.2
    + breakdown.automationOpportunity * 0.2
    + breakdown.painSignalPresence * 0.1
    + breakdown.websiteQuality * 0.15
    + breakdown.productComplexity * 0.15,
  ));
  const qaOpportunityScore = Math.min(100, Math.round(
    breakdown.publicJourneys * 0.15
    + breakdown.bookingFlow * 0.15
    + breakdown.checkoutFlow * 0.15
    + breakdown.mobileFlow * 0.15
    + breakdown.schedulingFlow * 0.15
    + breakdown.membershipFlow * 0.1
    + breakdown.integrations * 0.075
    + breakdown.releaseRisk * 0.075,
  ));

  return {
    id: `${slug(normalizedName)}-${slug(originFor(rawLead.website || rawLead.sourceUrl))}`,
    rawName: rawLead.name || rawLead.companyName,
    normalizedName,
    website: rawLead.website,
    source: rawLead.source || rawLead.sourceUrl,
    sourceTitle: rawLead.sourceTitle,
    query: rawLead.query,
    date: rawLead.discoveryDate,
    category,
    qualificationScore,
    qaOpportunityScore,
    recommendedOffer: recommendOffer(qualificationScore, qaOpportunityScore, isAggregatorOrArticle),
    duplicateOf: null,
    isAggregatorOrArticle,
    confidence: rawLead.confidence,
    notes: rawLead.notes || rawLead.snippet,
    scoreBreakdown: breakdown,
    rawLead,
  };
}

function normalizeCompanyName(rawLead: WebLeadCandidate): string {
  const title = cleanSeparators(rawLead.name || rawLead.companyName || rawLead.sourceTitle || '');
  const host = hostBrand(rawLead.website || rawLead.sourceUrl);
  const known = knownBrandFromText(`${title} ${rawLead.sourceUrl}`);
  if (known) return known;

  const afterDash = lastMeaningfulSegment(title);
  if (afterDash && brandLike(afterDash)) return afterDash;

  const beforePipe = title.split('|')[0]?.trim();
  if (beforePipe && brandLike(beforePipe) && !genericTitle(beforePipe)) return beforePipe;

  return host || title || 'Unknown';
}

function classifyLead(text: string, website: string): LeadCategory {
  const lower = `${text} ${website}`.toLowerCase();
  if (/marketplace|directory|getlatka|capterra|g2\.com|softwareadvice|getapp|trustradius/.test(lower)) return 'Marketplace';
  if (/agency|studio services|development studio/.test(lower)) return 'Agency';
  if (/schedule|scheduling|appointment|calendar/.test(lower)) return 'Scheduling SaaS';
  if (/booking|reservation/.test(lower)) return 'Booking SaaS';
  if (/gym|crossfit|martial arts/.test(lower)) return 'Gym SaaS';
  if (/membership|member management/.test(lower)) return 'Membership SaaS';
  if (/fitness|wellness|yoga|personal training/.test(lower)) return 'Fitness SaaS';
  return 'Unknown';
}

function scoreBreakdown(text: string, rawLead: WebLeadCandidate, category: LeadCategory, isAggregatorOrArticle: boolean): QualifiedLeadScoreBreakdown {
  const lower = text.toLowerCase();
  const has = (terms: string[]) => terms.some((term) => lower.includes(term));
  const penalty = isAggregatorOrArticle ? -35 : 0;
  const industryFit = clamp((category === 'Marketplace' || category === 'Unknown' ? 45 : 80) + (has(['gym', 'fitness', 'booking', 'membership', 'scheduling']) ? 15 : 0) + penalty);
  const qaFit = clamp((has(['booking', 'payment', 'checkout', 'mobile', 'schedule', 'member', 'integration']) ? 80 : 45) + penalty);
  const automationOpportunity = clamp((has(['booking', 'scheduling', 'class', 'member', 'mobile', 'app']) ? 85 : 45) + penalty);
  const painSignalPresence = clamp(rawLead.painSignalCount > 0 || has(['review', 'complaint', 'problem', 'support']) ? 70 : 35);
  const websiteQuality = clamp(rawLead.website && !isAggregatorOrArticle ? 80 : rawLead.website ? 40 : 20);
  const productComplexity = clamp((has(['booking', 'payment', 'membership', 'schedule', 'integration', 'mobile', 'class']) ? 85 : 45) + penalty);

  return {
    industryFit,
    qaFit,
    automationOpportunity,
    painSignalPresence,
    websiteQuality,
    productComplexity,
    publicJourneys: clamp(has(['demo', 'pricing', 'signup', 'booking', 'schedule']) ? 80 : 45),
    bookingFlow: clamp(has(['booking', 'reservation']) ? 90 : 35),
    checkoutFlow: clamp(has(['payment', 'checkout', 'billing', 'stripe']) ? 85 : 35),
    mobileFlow: clamp(has(['mobile', 'app']) ? 85 : 35),
    schedulingFlow: clamp(has(['schedule', 'scheduling', 'calendar', 'appointment']) ? 90 : 35),
    membershipFlow: clamp(has(['membership', 'member']) ? 85 : 35),
    integrations: clamp(has(['integration', 'stripe', 'api', 'connect']) ? 75 : 35),
    releaseRisk: clamp(has(['saas', 'platform', 'software', 'app']) ? 70 : 40),
  };
}

function recommendOffer(qualificationScore: number, qaOpportunityScore: number, isAggregatorOrArticle: boolean): RecommendedQualifiedOffer {
  if (!isAggregatorOrArticle && qualificationScore >= 75 && qaOpportunityScore >= 70) return 'QA Automation Retainer ($1500-$3000/month)';
  if (qualificationScore >= 60 && qaOpportunityScore >= 55) return 'Playwright Starter Pack ($900-$1500)';
  return 'QA Audit ($199-$500)';
}

function dedupeQualifiedLeads(leads: NormalizedWebLead[]): NormalizedWebLead[] {
  const merged = new Map<string, NormalizedWebLead>();
  for (const lead of leads) {
    const key = lead.normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const current = merged.get(key);
    if (!current || sortQualifiedLeads(lead, current) < 0) {
      merged.set(key, { ...lead, duplicateOf: current?.id ?? null });
    }
  }
  return [...merged.values()];
}

function sortQualifiedLeads(left: NormalizedWebLead, right: NormalizedWebLead): number {
  return right.qualificationScore - left.qualificationScore
    || right.qaOpportunityScore - left.qaOpportunityScore
    || left.normalizedName.localeCompare(right.normalizedName);
}

function loadRawLeads(): WebLeadCandidate[] {
  return readJson<WebLeadCandidate[]>(rawLeadsPath, []);
}

function writeOutputs(outputs: { fileName: string; body: string }[]): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });
  return outputs.map((output) => {
    const outputPath = path.join(outputRoot, output.fileName);
    fs.writeFileSync(outputPath, output.body, 'utf8');
    return outputPath;
  });
}

function offerReason(lead: NormalizedWebLead): string {
  if (lead.recommendedOffer.startsWith('QA Automation Retainer')) return 'High qualification and QA opportunity scores with workflow complexity.';
  if (lead.recommendedOffer.startsWith('Playwright')) return 'Good automation fit, but needs human review before a larger retainer path.';
  return 'Start with a scoped manual QA audit because evidence needs review or the source is article/listing-like.';
}

function leadText(rawLead: WebLeadCandidate, normalizedName: string): string {
  return [
    normalizedName,
    rawLead.name,
    rawLead.companyName,
    rawLead.sourceTitle,
    rawLead.snippet,
    rawLead.notes,
    rawLead.query,
    rawLead.website,
    rawLead.sourceUrl,
  ].join(' ');
}

function knownBrandFromText(value: string): string | undefined {
  const brands = ['Appointy', 'GymMaster', 'SuperSaaS', 'Resamania', 'Glofox', 'Outseta', 'Lunacal', 'Fitune', 'SimplyBook.me', 'Join It', 'PushPress', 'MartialArts.io', 'GetLatka', 'GrowthZone', 'Zoho Creator', 'Setmore', '1Club', 'WildApricot', 'Gymflow', 'ShapeNet Software', 'YourMembership', 'AXIS Martial Arts', 'Atlas Martial Arts', 'BooGYMan', 'Fit Viz', 'Wod.guru'];
  const normalized = normalizeLookup(value);
  return brands.find((brand) => normalized.includes(normalizeLookup(brand)));
}

function lastMeaningfulSegment(value: string): string {
  const segments = value.split(/\s[-–|·]\s/).map((item) => item.trim()).filter(Boolean);
  return segments.length > 1 ? cleanupBrand(segments[segments.length - 1]) : '';
}

function hostBrand(value: string): string {
  const host = originFor(value).replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0] ?? '';
  if (!host) return '';
  const special: Record<string, string> = {
    '1club': '1Club',
    appointy: 'Appointy',
    axismartialarts: 'AXIS Martial Arts',
    atlasmartialartssoftware: 'Atlas Martial Arts',
    boogyman: 'BooGYMan',
    gymmaster: 'GymMaster',
    supersaas: 'SuperSaaS',
    resamania: 'Resamania',
    glofox: 'Glofox',
    simplybook: 'SimplyBook.me',
    joinit: 'Join It',
    pushpress: 'PushPress',
    setmore: 'Setmore',
    shapenetsoftware: 'ShapeNet Software',
    theswolekitchen: 'The Swole Kitchen',
    wod: 'Wod.guru',
    gymflow: 'Gymflow',
  };
  return special[host] ?? cleanupBrand(host);
}

function normalizeLookup(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function cleanupBrand(value: string): string {
  return value
    .replace(/\b(Member Management|Management Software|Software|Platform|SaaS|Reviews?|Pricing|Blog|Guide)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function cleanSeparators(value: string): string {
  return value.replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
}

function brandLike(value: string): boolean {
  return value.length >= 2 && value.length <= 45 && !genericTitle(value);
}

function genericTitle(value: string): boolean {
  return /\b(best|top|free|online|software|platforms?|options?|guide|what is|compare|reviews?)\b/i.test(value);
}

function aggregatorOrArticle(text: string, source: string): boolean {
  const lower = `${text} ${source}`.toLowerCase();
  return /\b(best|top|compare|alternatives|guide|what is|reviews?|platforms? \[|youtube|newsroom|blog|posts?|stories)\b/.test(lower);
}

function originFor(value: string): string {
  if (!value) return '';
  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'lead';
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function renderList(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function escapeTable(value: string): string {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
