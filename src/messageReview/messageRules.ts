import fs = require('fs');
import path = require('path');
import { buildFirstRevenueExecutionPack } from '../executionPack/generateFirstRevenueChecklist';
import { buildExecutiveCompanyReport } from '../executiveLayer/executiveRules';
import { buildRevenueIntelligenceReport } from '../revenueIntelligence/revenueIntelligenceRules';
import { MessageDraft, MessageReviewReport } from './types';

const dataPath = path.join(process.cwd(), 'data', 'messages', 'message-drafts.json');
const outputRoot = path.join(process.cwd(), 'output', 'messages');

const safetyRules = [
  'Manual-only message review.',
  'Human approval is required before any message is copied or sent.',
  'Do not send messages, emails, proposals, meeting invites, invoices, payment links, or payments.',
  'Do not claim completed full audits, confirmed defects, lost customers, vulnerabilities, outages, replies, interest, or revenue.',
  'Use potential, may indicate, worth reviewing, public-page observations, and performance and release-confidence areas when uncertainty exists.',
];

export function buildMessageReview(company: string): MessageReviewReport {
  ensureMessageStore();
  const revenueIntelligence = buildRevenueIntelligenceReport();
  const defaultCompany = revenueIntelligence.actionableLead?.companyName ?? revenueIntelligence.topLead?.companyName ?? company;
  const selectedCompany = company && company !== 'No unified top lead' ? company : defaultCompany;
  const executionPack = buildFirstRevenueExecutionPack();
  const executive = safeExecutiveCompanyReport(selectedCompany);
  const companyName = executive?.companyName ?? selectedCompany;
  const companyId = executive?.companyId ?? slug(selectedCompany);
  const executiveRecommendation = executive?.executiveRecommendation ?? revenueIntelligence.actionableLead?.recommendedOffer ?? revenueIntelligence.topLead?.recommendedOffer ?? 'QA Audit ($199-$500)';
  const drafts = buildDrafts(companyName);

  return {
    generatedAt: new Date().toISOString(),
    companyId,
    companyName,
    currentOffer: executionPack.topTarget.companyName === companyName
      ? executionPack.topTarget.bestOffer
      : executiveRecommendation,
    goNoGo: executionPack.topTarget.companyName === companyName ? executionPack.recommendation : 'Needs Review',
    evidenceBasis: [
      `Requested company: ${company || 'default actionable lead'}`,
      `Revenue Intelligence top ranked lead: ${revenueIntelligence.topLead?.companyName ?? 'No top ranked lead'}`,
      `Lead Rotation actionable lead: ${revenueIntelligence.actionableLead?.companyName ?? 'No actionable lead'}`,
      `Current top target: ${executionPack.topTarget.companyName}`,
      `Execution recommendation: ${executionPack.recommendation}`,
      `Executive recommendation: ${executiveRecommendation}`,
      executive ? `Release confidence: ${executive.releaseConfidence}/100` : 'Release confidence: Not available for this web-qualified lead yet.',
      executive ? `Business risk level: ${executive.businessRiskLevel}` : 'Business risk level: Not available for this web-qualified lead yet.',
      'Language must describe a lightweight public-page QA review only.',
    ],
    drafts,
    priorities: [
      'Review LinkedIn short message first for a low-friction manual DM.',
      'Use email only if Daniel has a manually verified email contact.',
      'Use follow-up only after a real manual send is recorded in outcomes.',
      'If interested, keep the response scoped to a paid QA Audit and avoid claiming confirmed defects.',
    ],
    safetyRules,
  };
}

function safeExecutiveCompanyReport(companyName: string): ReturnType<typeof buildExecutiveCompanyReport> | null {
  try {
    return buildExecutiveCompanyReport(companyName);
  } catch {
    return null;
  }
}

export function writeMessageReview(report: MessageReviewReport): string[] {
  return writeOutputs([
    { fileName: `${report.companyId}-message-review.md`, body: renderMessageReview(report) },
    { fileName: 'message-priorities.md', body: renderMessagePriorities(report) },
  ]);
}

export function writeMessagePack(report: MessageReviewReport): string[] {
  return writeOutputs([
    { fileName: `${report.companyId}-message-pack.md`, body: renderMessagePack(report) },
    { fileName: 'approved-manual-messages.md', body: renderApprovedManualMessages(report) },
  ]);
}

export function renderMessageReview(report: MessageReviewReport): string {
  return [
    '# Message Review',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Review Snapshot',
    renderList([
      `Company: ${report.companyName}`,
      `Current offer: ${report.currentOffer}`,
      `GO / NO GO: ${report.goNoGo}`,
      'Status: Manual review only.',
    ]),
    '',
    '## Evidence Basis',
    renderList(report.evidenceBasis),
    '',
    '## Draft Safety Check',
    renderDraftTable(report.drafts),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderMessagePack(report: MessageReviewReport): string {
  return [
    `# ${report.companyName} Message Pack`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    'Manual-only drafts for human review. Nothing was sent.',
    '',
    ...report.drafts.map(renderDraftBlock),
    '',
    '## Required Language Rules',
    renderList([
      'Use: I did a lightweight public-page QA review.',
      'Use: potential, may indicate, worth reviewing, public-page observations, performance and release-confidence areas.',
      'Do not say: I completed a full audit.',
      'Do not say: Your website is broken.',
      'Do not say: You have bugs.',
      'Do not say: You are losing customers.',
      'Do not say: You have vulnerabilities.',
    ]),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderMessagePriorities(report: MessageReviewReport): string {
  return [
    '# Message Priorities',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderList(report.priorities),
    '',
    '## Next Manual Message',
    `Review the LinkedIn short message for ${report.companyName}. Send nothing from Studio.`,
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderApprovedManualMessages(report: MessageReviewReport): string {
  return [
    '# Approved Manual Messages',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    'These drafts are not sent or approved for external use until Daniel manually reviews them.',
    '',
    renderList(report.drafts.map((draft) => `${draft.label}: ${draft.wordCount}/${draft.wordLimit} words`)),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

function buildDrafts(companyName: string): MessageDraft[] {
  const drafts = [
    draft('linkedin_short', 'LinkedIn Short Message', `I did a lightweight public-page QA review of ${companyName} and noticed potential performance and release-confidence areas worth reviewing. Open to a short summary?`, 35),
    draft('linkedin_normal', 'LinkedIn Normal Message', `Hi [Name], I did a lightweight public-page QA review of ${companyName} and noticed a few potential performance and release-confidence areas that may be worth reviewing. I help gym software teams turn those observations into a concise QA audit and practical next steps. Would it be useful if I sent the short summary for manual review?`, 75),
    draft('email', 'Email Version', `Subject: Lightweight QA observations for ${companyName}\n\nHi [Name],\n\nI did a lightweight public-page QA review of ${companyName} and noticed a few potential performance and release-confidence areas that may be worth reviewing. I help gym software teams translate public-page observations into a concise QA audit with prioritized next steps. If helpful, I can send a short summary for manual review. No pressure either way.\n\nDaniel`, 120),
    draft('follow_up', 'Short Follow-Up', `Hi [Name], quick follow-up. I had a few public-page observations on potential performance and release-confidence areas for ${companyName}. Worth sending the short summary for manual review?`, 60),
    draft('interested_reply', 'If They Reply Interested', 'Thanks, [Name]. I can share a concise QA Audit summary based on public-page observations only. It will frame items as potential areas to review, not confirmed defects. If it looks useful, the paid QA Audit is $199-$500 and includes prioritized findings and next steps.', 90),
    draft('executive_angle', 'Executive Angle', `For an executive review, the angle is release confidence: public-page performance and QA signals may indicate areas worth reviewing before they affect demo trust or buyer confidence.`, 75),
    draft('audit_offer_angle', 'Audit Offer Angle', `Offer a focused QA Audit: public-page observations, prioritized business risks, and practical next steps for $199-$500. No claim of a full audit until Daniel is engaged.`, 75),
  ];

  saveDraftState(companyName, drafts);
  return drafts;
}

function draft(type: MessageDraft['type'], label: string, body: string, wordLimit: number): MessageDraft {
  const wordCount = countWords(body);
  if (wordCount > wordLimit) {
    throw new Error(`${label} exceeds word limit: ${wordCount}/${wordLimit}`);
  }
  return { type, label, body, wordLimit, wordCount };
}

function ensureMessageStore(): void {
  fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, '{}\n', 'utf8');
  }
}

function saveDraftState(companyName: string, drafts: MessageDraft[]): void {
  fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  const raw = fs.existsSync(dataPath) ? fs.readFileSync(dataPath, 'utf8').trim() : '{}';
  const state = raw ? JSON.parse(raw) as Record<string, unknown> : {};
  state[slug(companyName)] = {
    updatedAt: new Date().toISOString(),
    companyName,
    drafts,
    safety: 'Manual-review only. No messages were sent.',
  };
  fs.writeFileSync(dataPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

function writeOutputs(outputs: { fileName: string; body: string }[]): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });
  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }
  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

function renderDraftTable(drafts: MessageDraft[]): string {
  return [
    '| Draft | Word Count | Limit | Status |',
    '| --- | ---: | ---: | --- |',
    ...drafts.map((draft) => `| ${draft.label} | ${draft.wordCount} | ${draft.wordLimit} | ${draft.wordCount <= draft.wordLimit ? 'Ready for manual review' : 'Too long'} |`),
  ].join('\n');
}

function renderDraftBlock(draft: MessageDraft): string {
  return [
    `## ${draft.label}`,
    '',
    `Word count: ${draft.wordCount}/${draft.wordLimit}`,
    '',
    draft.body,
    '',
  ].join('\n');
}

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}
