import fs = require('fs');
import path = require('path');
import { NormalizedLeadCandidate, RawLeadSignal } from './intakeTypes';
import { LeadScoreBreakdown } from './types';

const inputPath = path.join(process.cwd(), 'data', 'lead-discovery', 'raw-signals.sample.json');
const outputDir = path.join(process.cwd(), 'output', 'lead-discovery');
const jsonPath = path.join(outputDir, 'normalized-leads.json');
const reportPath = path.join(outputDir, 'intake-report.md');

function main(): void {
  const rawSignals = readRawSignals();
  const generatedAt = new Date().toISOString();
  const candidates = rawSignals.map((signal) => normalizeSignal(signal, generatedAt))
    .sort((left, right) => right.score - left.score);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify(candidates, null, 2)}\n`, 'utf8');
  fs.writeFileSync(reportPath, renderReport(candidates, generatedAt), 'utf8');

  console.log(`Normalized leads generated: ${path.relative(process.cwd(), jsonPath)}`);
  console.log(`Intake report generated: ${path.relative(process.cwd(), reportPath)}`);
  console.log('Manual intake only. No scraping, network calls, outreach, email, DM, or form submission was performed.');
}

function readRawSignals(): RawLeadSignal[] {
  const parsed = JSON.parse(fs.readFileSync(inputPath, 'utf8')) as RawLeadSignal[];
  return parsed.map(validateRawSignal);
}

function validateRawSignal(signal: RawLeadSignal): RawLeadSignal {
  if (!signal.id || !signal.vertical || !signal.rawText) {
    throw new Error('Invalid raw signal: id, vertical, and rawText are required.');
  }
  if (signal.sourceType !== 'sample_fixture') {
    throw new Error(`Sprint 2 sample intake accepts fictional sample_fixture records only: ${signal.id}`);
  }
  return signal;
}

function normalizeSignal(signal: RawLeadSignal, generatedAt: string): NormalizedLeadCandidate {
  const scoreBreakdown = scoreSignal(signal);
  const score = Number(Object.values(scoreBreakdown).reduce((total, value) => total + value, 0).toFixed(1));
  const requestedService = signal.serviceHint || serviceFromVertical(signal.vertical);
  const location = signal.locationHint || 'Unknown';
  const dateSignal = signal.dateHint || null;
  const budgetSignal = extractBudgetSignal(signal.rawText);

  return {
    id: `normalized-${signal.id}`,
    rawSignalId: signal.id,
    vertical: signal.vertical,
    nameOrHandle: `${signal.vertical.replace(/_leads$/, '')}_${signal.id}`,
    sourceUrl: signal.sourceUrl,
    sourceName: signal.sourceName,
    sourceType: signal.sourceType,
    location,
    intentSummary: summarizeIntent(signal.rawText),
    requestedService,
    dateSignal,
    budgetSignal,
    urgency: urgencyFor(signal),
    score,
    scoreBreakdown,
    salesAngle: salesAngleFor(signal, requestedService, location),
    suggestedFirstMessage: `Human review required: verify the public context, then ask one clarifying question about ${requestedService.toLowerCase()}.`,
    contactHint: signal.contactHint,
    riskFlags: riskFlagsFor(signal),
    status: 'needs_review',
    createdAt: generatedAt,
    updatedAt: generatedAt,
  };
}

function scoreSignal(signal: RawLeadSignal): LeadScoreBreakdown {
  const text = signal.rawText.toLowerCase();
  const clearIntent = Boolean(signal.serviceHint) || /\b(need|looking for|searching for|planning|help|contract)\b/.test(text);
  const hasDate = Boolean(signal.dateHint) || /\b(weeks?|month|spring|summer|winter|fall|before|launch|event)\b/.test(text);
  const hasBudget = /\b(budget|premium|luxury|boutique|business|corporate|private|contract|paid)\b/.test(text);

  return {
    intentClarity: clearIntent ? 2 : 0.8,
    locationRelevance: signal.locationHint ? 1 : 0,
    budgetSignal: hasBudget ? 1 : 0,
    urgencyDate: hasDate ? 1.5 : 0.3,
    sourceQuality: signal.sourceUrl ? 1.5 : 0.5,
    contactability: signal.contactHint ? 1 : 0,
    fitWithClientOffer: signal.serviceHint ? 1.5 : 0.8,
    duplicateRisk: signal.notes?.toLowerCase().includes('fictional') ? 0.5 : 0.2,
  };
}

function extractBudgetSignal(rawText: string): string | null {
  const text = rawText.toLowerCase();
  if (/\b(premium|luxury|boutique|private)\b/.test(text)) return 'Premium/luxury/private-service signal';
  if (/\b(business|corporate|contract|paid)\b/.test(text)) return 'Business or paid-service signal';
  if (/\b(guest|guests|group|team|people|person)\b/.test(text)) return 'Group size implies budget potential';
  return null;
}

function urgencyFor(signal: RawLeadSignal): NormalizedLeadCandidate['urgency'] {
  const text = `${signal.dateHint ?? ''} ${signal.rawText}`.toLowerCase();
  if (/\b(three weeks|next month|before|launch|event|onboarding push)\b/.test(text)) return 'high';
  if (signal.dateHint) return 'medium';
  return 'low';
}

function riskFlagsFor(signal: RawLeadSignal): string[] {
  const flags = ['manual_review_required'];
  if (!signal.locationHint) flags.push('unclear_location');
  if (!signal.dateHint) flags.push('unclear_date');
  if (!signal.contactHint) flags.push('contact_path_unclear');
  if (!extractBudgetSignal(signal.rawText)) flags.push('unclear_budget');
  return flags;
}

function summarizeIntent(rawText: string): string {
  return rawText.replace(/^Fictional (post|job post):\s*/i, '').trim();
}

function serviceFromVertical(vertical: RawLeadSignal['vertical']): string {
  const services: Record<RawLeadSignal['vertical'], string> = {
    travel_leads: 'Travel planning',
    catering_leads: 'Catering service',
    wedding_leads: 'Wedding vendor service',
    real_estate_leads: 'Real estate or relocation service',
    website_leads: 'Website improvement service',
    qa_leads: 'QA automation service',
  };
  return services[vertical];
}

function salesAngleFor(signal: RawLeadSignal, requestedService: string, location: string): string {
  return `${requestedService} need in ${location}; source context suggests public intent but requires human validation before delivery or contact.`;
}

function renderReport(candidates: NormalizedLeadCandidate[], generatedAt: string): string {
  const risky = candidates.filter((candidate) => candidate.riskFlags.length > 1);
  return `# Lead Discovery Intake Report

Generated: ${generatedAt}

## Summary

- Raw signals normalized: ${candidates.length}
- Average score: ${average(candidates.map((candidate) => candidate.score)).toFixed(1)}
- Candidates with extra risk flags: ${risky.length}
- Safety: Human review required before delivery or contact.
- Automation boundary: No scraping, network calls, outbound email, DMs, or forms were used.

## Normalized Candidates

${candidates.map((candidate, index) => renderCandidate(candidate, index + 1)).join('\n\n')}
`;
}

function renderCandidate(candidate: NormalizedLeadCandidate, rank: number): string {
  return `### ${rank}. ${candidate.nameOrHandle}

- ID: ${candidate.id}
- Raw signal: ${candidate.rawSignalId}
- Vertical: ${candidate.vertical}
- Score: ${candidate.score.toFixed(1)}
- Status: ${candidate.status}
- Location: ${candidate.location}
- Requested service: ${candidate.requestedService}
- Date signal: ${candidate.dateSignal ?? 'Not supplied'}
- Budget signal: ${candidate.budgetSignal ?? 'Not supplied'}
- Urgency: ${candidate.urgency}
- Source: ${candidate.sourceName} — ${candidate.sourceUrl}
- Intent: ${candidate.intentSummary}
- Sales angle: ${candidate.salesAngle}
- Suggested first message: ${candidate.suggestedFirstMessage}
- Risk flags: ${candidate.riskFlags.join(', ') || 'None'}`;
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((total, value) => total + value, 0) / values.length;
}

if (require.main === module) main();
