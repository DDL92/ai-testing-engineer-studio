import fs = require('fs');
import path = require('path');
import { buildCommercialModeSummary } from '../commercialMode/commercialModeRules';
import { ContactReviewRecord } from '../contactReview/types';
import { Lead } from '../leads/types';
import { buildPlannedFollowUps, loadOutreachRecords } from '../outreachTracking/outreachTrackingRules';
import {
  MessageDraftSet,
  OutreachExecutionArtifacts,
  OutreachExecutionInput,
  OutreachExecutionLead,
  OutreachExecutionReport,
  OutreachExecutionSource,
} from './types';

const outputRoot = path.join(process.cwd(), 'output', 'outreach-execution');

const targetRoles = [
  'Founder',
  'CTO',
  'VP Engineering',
  'Head of Engineering',
  'Product Manager',
  'QA Manager',
  'Operations Lead',
];

const manualApprovalReminder = [
  'Human approval is required before sending any outreach or follow-up.',
  'This pack prepares manual outreach assets only. It does not send anything.',
  'No APIs, scraping, browsing, CRM, email sending, LinkedIn automation, outreach automation, payments, credentials, or external databases were used.',
  'Do not invent contacts, names, URLs, findings, metrics, company facts, ROI, urgency, or outcomes.',
];

export function loadOutreachExecutionInput(): OutreachExecutionInput {
  const generatedAt = new Date().toISOString();

  return {
    generatedAt,
    leads: readJson<Lead[]>(path.join('data', 'leads.json'), []),
    contactReviews: readJson<ContactReviewRecord[]>(path.join('data', 'contact-reviews.json'), []),
    contextSources: [
      readContextSource('Leads', path.join('data', 'leads.json')),
      readContextSource('Contact reviews', path.join('data', 'contact-reviews.json')),
      readContextSource('Top 5 real outreach', path.join('output', 'outreach-operating', 'top-5-real-outreach.md')),
      readContextSource('First audit offer path', path.join('output', 'outreach-operating', 'first-audit-offer-path.md')),
      readContextSource('Real client readiness pack', path.join('output', 'real-client-readiness', 'real-client-readiness-pack.md')),
      readContextSource('Top 5 contact plan', path.join('output', 'real-client-readiness', 'top-5-contact-plan.md')),
      readContextSource('Proposal command center', path.join('output', 'proposal-center', 'proposal-command-center.md')),
      readContextSource('SOW readiness report', path.join('output', 'proposal-center', 'sow-readiness-report.md')),
      readContextSource('Revenue command center', path.join('output', 'revenue-command-center', 'revenue-command-center.md')),
      readContextSource('Mac daily summary', path.join('output', 'mac-daily', 'mac-daily-summary.md')),
    ],
    actualFollowUps: buildPlannedFollowUps(loadOutreachRecords()),
  };
}

export function buildOutreachExecutionReport(input: OutreachExecutionInput): OutreachExecutionReport {
  const commercialSummary = buildCommercialModeSummary(input.leads);
  const commercialLeads = commercialSummary.commercialLeads;
  const contactReviewByLeadId = new Map(input.contactReviews.map((review) => [review.leadId, review]));
  const topLeadIds = parseTopLeadIds(input.contextSources);
  const selectedLeads = selectTopFive(commercialLeads, topLeadIds);
  const topFive = selectedLeads.map((lead) => buildExecutionLead(lead, contactReviewByLeadId.get(lead.id)));

  return {
    generatedAt: input.generatedAt,
    totalLeads: input.leads.length,
    commercialLeadCount: commercialLeads.length,
    excludedLeadCount: commercialSummary.demoLeads.length,
    topFive,
    contextSources: input.contextSources,
    actualFollowUps: input.actualFollowUps,
  };
}

export function writeOutreachExecutionOutputs(report: OutreachExecutionReport): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });

  const outputs = [
    { fileName: 'outreach-execution-pack.md', body: renderOutreachExecutionPack(report) },
    { fileName: 'final-message-drafts.md', body: renderFinalMessageDrafts(report) },
    { fileName: 'contact-research-plan.md', body: renderContactResearchPlan(report) },
    { fileName: 'follow-up-plan.md', body: renderFollowUpPlan(report) },
    { fileName: 'first-audit-cta.md', body: renderFirstAuditCta(report) },
    { fileName: 'approval-checklist.md', body: renderApprovalChecklist(report) },
  ];

  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }

  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

export function writeFollowUpPlanOutput(report: OutreachExecutionReport): string {
  fs.mkdirSync(outputRoot, { recursive: true });
  const outputPath = path.join(outputRoot, 'follow-up-plan.md');
  fs.writeFileSync(outputPath, renderFollowUpPlan(report), 'utf8');
  return outputPath;
}

export function renderOutreachExecutionPack(report: OutreachExecutionReport): string {
  return [
    '# Real Outreach Execution Pack',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Executive Summary',
    renderList([
      `Total leads reviewed: ${report.totalLeads}`,
      `Commercial leads eligible: ${report.commercialLeadCount}`,
      `Excluded demo/sample/not-fit/paused/lost leads: ${report.excludedLeadCount}`,
      `Top 5 outreach leads prepared: ${report.topFive.length}`,
      'No messages were sent.',
    ]),
    '',
    '## Top 5 Outreach Leads',
    renderTopFiveTable(report.topFive),
    '',
    '## Readiness Status',
    renderLeadStatusList(report.topFive, 'readinessStatus'),
    '',
    '## Contact Research Status',
    renderLeadStatusList(report.topFive, 'contactResearchStatus'),
    '',
    '## Message Status',
    renderLeadStatusList(report.topFive, 'messageStatus'),
    '',
    '## Follow-Up Status',
    renderLeadStatusList(report.topFive, 'followUpStatus'),
    '',
    '## First Audit Offer Path',
    renderList([
      'Start with a focused QA Audit priced at $199-$500.',
      'Use only verified local context and manually reviewed public company information.',
      'Upgrade path: QA Audit -> Playwright Starter Pack -> QA Automation Retainer.',
      'Do not claim completed audit findings unless a local audit pack exists.',
    ]),
    '',
    '## Suggested Commands',
    renderList(suggestedCommands(report.topFive).map((command) => `\`${command}\``)),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderFinalMessageDrafts(report: OutreachExecutionReport): string {
  return [
    '# Final Message Drafts',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    'Use these drafts as review-only starting points. Replace `[Name]` manually after Daniel verifies a real public contact.',
    '',
    report.topFive.length === 0 ? 'No Top 5 outreach leads available.' : report.topFive.map(renderMessageDraftsForLead).join('\n\n'),
    '',
    '## Message Safety Rules',
    renderList([
      'No fake claims.',
      'No completed audit claim unless local audit pack exists.',
      'No invented metrics.',
      'No pressure language.',
      'No guarantees.',
      'No invented contact name.',
      'Manual personalization placeholder must be reviewed before sending.',
    ]),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderContactResearchPlan(report: OutreachExecutionReport): string {
  return [
    '# Contact Research Plan',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    report.topFive.length === 0 ? 'No Top 5 outreach leads available.' : report.topFive.map(renderContactResearchForLead).join('\n\n'),
    '',
    '## Global Research Rules',
    renderList([
      'Do not invent names or URLs.',
      'Do not scrape.',
      'Do not export or enrich contacts.',
      'Use only manually reviewed public information.',
      'Record the source and role in local notes only after Daniel verifies the match.',
    ]),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderFollowUpPlan(report: OutreachExecutionReport): string {
  return [
    '# Follow-Up Plan',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Actual Due or Upcoming Follow-Ups',
    '',
    report.actualFollowUps.length === 0
      ? '- No actual due or upcoming follow-ups are recorded.'
      : report.actualFollowUps.map(renderActualFollowUp).join('\n\n'),
    '',
    '## Prepared Lead Follow-Up Guidance',
    '',
    report.topFive.length === 0 ? 'No Top 5 outreach leads available.' : report.topFive.map(renderFollowUpForLead).join('\n\n'),
    '',
    '## Timing Rules',
    renderList([
      'Follow-up 1: 3-4 business days later.',
      'Follow-up 2: 7-10 business days later.',
      'Stop after 2 follow-ups unless they respond.',
      'Do not schedule automatically.',
    ]),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

function renderActualFollowUp(item: OutreachExecutionReport['actualFollowUps'][number]): string {
  const record = item.record;
  return [
    `### ${record.companyName} - ${record.contactName}`,
    '',
    `- Company: ${record.companyName}`,
    `- Contact: ${record.contactName}`,
    `- Channel: ${record.channel}`,
    `- Sent: ${record.sentAt}`,
    `- Response: ${record.replyReceived ? 'Replied' : 'Pending'}`,
    `- Follow-up due: ${record.nextFollowUpAt}`,
    `- Source: ${record.source ?? 'Legacy Outreach'}`,
    `- Manual action: ${item.recommendedAction}`,
  ].join('\n');
}

export function renderFirstAuditCta(_report: OutreachExecutionReport): string {
  return [
    '# First Audit CTA',
    '',
    '## Offer',
    'A focused QA Audit for one or two critical public workflows, reviewed manually before any client-facing use.',
    '',
    '## Price Range',
    'QA Audit: $199-$500',
    '',
    '## Scope',
    renderList([
      'Review approved public or provided workflows for QA risk and automation opportunities.',
      'Focus on onboarding, booking, checkout, payments, mobile, or release-risk flows only when those signals exist in local lead data.',
      'Do not test private, authenticated, production, payment, or client systems without explicit approval.',
    ]),
    '',
    '## Deliverables',
    renderList([
      'QA risk summary.',
      'Playwright smoke-test opportunities.',
      'Automation roadmap.',
      'Executive summary.',
      'Recommended next step when evidence supports it.',
    ]),
    '',
    '## Upgrade Path',
    'QA Audit -> Playwright Starter Pack -> QA Automation Retainer',
    '',
    '## CTA Variations',
    renderList([
      'If useful, I can send a short outline for a focused QA Audit.',
      'Would a small QA Audit around the highest-risk public workflow be worth reviewing?',
      'I can keep this small: a short audit outline, a few risk areas, and a practical automation next step.',
    ]),
    '',
    '## Do Not Claim',
    renderList([
      'Do not claim completed audit findings without a local audit pack.',
      'Do not claim ROI, compliance, performance scores, accessibility certification, production readiness, or complete coverage.',
      'Do not imply a relationship with a contact that has not been manually verified.',
      'Do not guarantee outcomes.',
    ]),
    '',
    '## Approval Notes',
    renderList([
      'Daniel must approve the CTA before sending.',
      'Pricing must be approved before sending.',
      'Scope must be reviewed before a discovery call or SOW.',
    ]),
    '',
  ].join('\n');
}

export function renderApprovalChecklist(_report: OutreachExecutionReport): string {
  return [
    '# Approval Checklist',
    '',
    renderChecklist([
      'company verified',
      'contact verified',
      'role verified',
      'message personalized',
      'no fake findings',
      'no fake metrics',
      'no unsupported ROI claims',
      'no mass outreach',
      'no automation',
      'Daniel approved before sending',
      'follow-up date manually recorded',
    ]),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

function buildExecutionLead(lead: Lead, contactReview: ContactReviewRecord | undefined): OutreachExecutionLead {
  const artifacts = detectArtifacts(lead.id, Boolean(contactReview));
  const missingAssets = missingAssetsFor(artifacts);

  return {
    lead,
    contactReview,
    artifacts,
    readinessStatus: readinessStatusFor(artifacts),
    contactResearchStatus: contactReview ? `Contact review exists; status ${contactReview.contactStatus}` : 'Manual contact research needed.',
    messageStatus: contactReview ? `Message status ${contactReview.messageStatus}` : 'Drafts prepared only; no message sent.',
    followUpStatus: contactReview?.nextFollowUpDate ? `Manual follow-up date recorded: ${contactReview.nextFollowUpDate}` : 'No follow-up scheduled. Manual tracking required after initial send.',
    recommendedChannel: contactReview?.channel ?? 'linkedin or website-contact-form',
    nextAction: nextActionFor(lead, artifacts, contactReview),
    suggestedCommand: suggestedCommandFor(lead, contactReview),
    missingAssets,
  };
}

function detectArtifacts(leadId: string, hasContactReview: boolean): OutreachExecutionArtifacts {
  return {
    researchPack: exists(path.join('output', 'research', `${leadId}-research-pack.md`)),
    leadPack: exists(path.join('output', 'lead-packs', `${leadId}.md`)),
    auditPack: exists(path.join('output', 'audit-packs', leadId)),
    outreachPack: exists(path.join('output', 'outreach-packs', leadId)),
    contactReview: hasContactReview || exists(path.join('output', 'contact-reviews', leadId, 'contact-review.md')),
    proposalCenter: exists(path.join('output', 'proposal-center', 'proposal-command-center.md')),
    sowReadiness: exists(path.join('output', 'proposal-center', 'sow-readiness-report.md')),
  };
}

function missingAssetsFor(artifacts: OutreachExecutionArtifacts): string[] {
  const missing: string[] = [];
  if (!artifacts.researchPack) missing.push('Research pack');
  if (!artifacts.leadPack) missing.push('Lead pack');
  if (!artifacts.auditPack) missing.push('Audit pack');
  if (!artifacts.outreachPack) missing.push('Outreach pack');
  if (!artifacts.contactReview) missing.push('Contact review');
  return missing;
}

function readinessStatusFor(artifacts: OutreachExecutionArtifacts): string {
  if (artifacts.auditPack && artifacts.outreachPack && artifacts.contactReview) return 'READY for Daniel review';
  if (artifacts.researchPack || artifacts.leadPack || artifacts.auditPack) return 'PARTIAL';
  return 'NOT READY';
}

function nextActionFor(lead: Lead, artifacts: OutreachExecutionArtifacts, contactReview: ContactReviewRecord | undefined): string {
  if (!artifacts.researchPack) return `Generate research pack for ${lead.companyName}.`;
  if (!artifacts.leadPack) return `Generate lead pack for ${lead.companyName}.`;
  if (!artifacts.auditPack) return `Generate audit pack for ${lead.companyName}.`;
  if (!artifacts.outreachPack) return `Generate outreach pack for ${lead.companyName}.`;
  if (!artifacts.contactReview || !contactReview) return `Generate contact review for ${lead.companyName}.`;
  return `Daniel reviews final message drafts for ${lead.companyName}.`;
}

function suggestedCommandFor(lead: Lead, _contactReview: ContactReviewRecord | undefined): string {
  return `npm run contact:review -- --id ${lead.id}`;
}

function renderTopFiveTable(leads: OutreachExecutionLead[]): string {
  if (leads.length === 0) return 'No Top 5 commercial outreach leads found.';

  return [
    '| Rank | Company | Website | Industry | Readiness | Recommended Channel | Next Action | Suggested Command |',
    '| ---: | --- | --- | --- | --- | --- | --- | --- |',
    ...leads.map((item, index) => `| ${index + 1} | ${escapeTable(item.lead.companyName)} | ${escapeTable(item.lead.website)} | ${escapeTable(item.lead.industry)} | ${escapeTable(item.readinessStatus)} | ${escapeTable(item.recommendedChannel)} | ${escapeTable(item.nextAction)} | \`${escapeTable(item.suggestedCommand)}\` |`),
  ].join('\n');
}

function renderLeadStatusList(leads: OutreachExecutionLead[], field: 'readinessStatus' | 'contactResearchStatus' | 'messageStatus' | 'followUpStatus'): string {
  if (leads.length === 0) return '- No Top 5 commercial outreach leads found.';
  return leads.map((item) => `- ${item.lead.companyName}: ${item[field]}`).join('\n');
}

function renderMessageDraftsForLead(item: OutreachExecutionLead, index: number): string {
  const drafts = buildMessageDrafts(item);

  return [
    `## ${index + 1}. ${item.lead.companyName}`,
    '',
    `- Company: ${item.lead.companyName}`,
    `- Website: ${item.lead.website}`,
    `- Manual personalization placeholder: [Name]`,
    `- Local audit pack exists: ${item.artifacts.auditPack ? 'yes' : 'no'}`,
    '',
    '### LinkedIn Connection Note',
    drafts.linkedinConnectionNote,
    '',
    '### LinkedIn Follow-Up Message',
    drafts.linkedinFollowUpMessage,
    '',
    '### Email Draft',
    drafts.emailDraft,
    '',
    '### Website Contact Form Draft',
    drafts.websiteContactFormDraft,
    '',
    '### Short Follow-Up Message',
    drafts.shortFollowUpMessage,
  ].join('\n');
}

function buildMessageDrafts(item: OutreachExecutionLead): MessageDraftSet {
  const company = item.lead.companyName;
  const painPoint = primaryPainPoint(item.lead);
  const auditLine = item.artifacts.auditPack
    ? 'I have a local audit outline to review before sharing anything externally.'
    : 'I am not claiming completed findings; this would start as a small audit outline.';

  return {
    linkedinConnectionNote: `Hi [Name], I help SaaS teams reduce QA risk around critical flows like ${painPoint}. I was reviewing ${company} as a possible fit for a small QA Audit. Open to connecting?`,
    linkedinFollowUpMessage: `Hi [Name], thanks for connecting. I help teams tighten QA coverage around flows like ${painPoint} without overbuilding. ${auditLine} If useful, I can share a short QA Audit outline for ${company}.`,
    emailDraft: `Subject: Small QA Audit idea for ${company}\n\nHi [Name],\n\nI help SaaS teams reduce QA risk around critical flows like ${painPoint}. I was reviewing ${company} as a possible fit for a focused QA Audit.\n\nThe audit would stay small: review one or two important workflows, summarize practical QA risks, and identify Playwright smoke-test opportunities. ${auditLine}\n\nIf useful, I can send a short audit outline for Daniel-approved review.\n\nBest,\nDaniel`,
    websiteContactFormDraft: `Hi ${company} team, I help SaaS teams reduce QA risk around critical flows like ${painPoint}. I was reviewing ${company} as a possible fit for a focused QA Audit. If useful, I can share a short audit outline. This is manually reviewed and does not claim completed findings.`,
    shortFollowUpMessage: `Hi [Name], quick follow-up on the small QA Audit idea for ${company}. No pressure. If QA risk around ${painPoint} is relevant, I can share a short outline for review.`,
  };
}

function renderContactResearchForLead(item: OutreachExecutionLead, index: number): string {
  return [
    `## ${index + 1}. ${item.lead.companyName}`,
    '',
    `- Target roles: ${targetRoles.join(', ')}`,
    '- Where to search manually: company website, LinkedIn company page, public leadership/team pages, public product/about pages.',
    '- What to verify: company match, current role, relevance to product/engineering/operations/QA, public source quality.',
    '- What not to do: do not scrape, export, enrich, guess names, guess emails, or use private data.',
    `- Recommended contact channel: ${item.recommendedChannel}`,
    `- Next command after contact is found: \`npm run contact:review -- --id ${item.lead.id}\``,
  ].join('\n');
}

function renderFollowUpForLead(item: OutreachExecutionLead, index: number): string {
  return [
    `## ${index + 1}. ${item.lead.companyName}`,
    '',
    '- Initial message day: Daniel manually records the send date after approval.',
    '- Follow-up 1 timing: 3-4 business days later.',
    '- Follow-up 2 timing: 7-10 business days later.',
    '- Stop condition: stop after 2 follow-ups unless they respond, or stop immediately if not relevant/not interested.',
    `- Manual tracking note: update local contact review only after manual action. Suggested command: \`npm run contact:review -- --id ${item.lead.id}\``,
  ].join('\n');
}

function suggestedCommands(leads: OutreachExecutionLead[]): string[] {
  const commands = [
    commandForLead(leads, 'pushpress'),
    commandForLead(leads, 'teamup'),
    commandForLead(leads, 'wodify'),
    commandForLead(leads, 'abc-glofox'),
    commandForLead(leads, 'bookee'),
    'npm run outreach:operating-pack',
    'npm run proposal:center',
    'npm run mac:daily',
    'npm run revenue:command-center',
  ].filter((command): command is string => Boolean(command));

  return [...new Set(commands)];
}

function commandForLead(leads: OutreachExecutionLead[], leadId: string): string | undefined {
  return leads.some((item) => item.lead.id === leadId) ? `npm run contact:review -- --id ${leadId}` : undefined;
}

function selectTopFive(commercialLeads: Lead[], topLeadIds: string[]): Lead[] {
  const byLeadId = new Map(commercialLeads.map((lead) => [lead.id, lead]));
  const selected = topLeadIds
    .map((leadId) => byLeadId.get(leadId))
    .filter((lead): lead is Lead => Boolean(lead));

  if (selected.length >= 5) return selected.slice(0, 5);

  const selectedIds = new Set(selected.map((lead) => lead.id));
  const fallback = [...commercialLeads]
    .filter((lead) => !selectedIds.has(lead.id))
    .sort((a, b) => b.score - a.score || a.companyName.localeCompare(b.companyName));
  return [...selected, ...fallback].slice(0, 5);
}

function parseTopLeadIds(contextSources: OutreachExecutionSource[]): string[] {
  const source = contextSources.find((candidate) => candidate.path === path.join('output', 'outreach-operating', 'top-5-real-outreach.md'));
  if (!source?.exists) return [];

  const content = fs.readFileSync(path.join(process.cwd(), source.path), 'utf8');
  return [...content.matchAll(/--id\s+([a-z0-9-]+)/gi)].map((match) => match[1]);
}

function primaryPainPoint(lead: Lead): string {
  if (lead.painPoints.length > 0) return lead.painPoints.slice(0, 3).join(', ');
  return 'onboarding, booking, checkout, and releases';
}

function readJson<T>(relativePath: string, fallback: T): T {
  const absolutePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(absolutePath)) return fallback;
  const raw = fs.readFileSync(absolutePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function readContextSource(label: string, relativePath: string): OutreachExecutionSource {
  const absolutePath = path.join(process.cwd(), relativePath);
  const exists = fs.existsSync(absolutePath);
  const content = exists ? fs.readFileSync(absolutePath, 'utf8') : '';

  return {
    label,
    path: relativePath,
    exists,
    excerpt: summarizeMarkdown(content),
  };
}

function summarizeMarkdown(content: string): string {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('|') && !line.startsWith('---'))
    .slice(0, 4)
    .join(' ');
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function renderChecklist(items: string[]): string {
  return items.map((item) => `- [ ] ${item}`).join('\n');
}

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), relativePath));
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
