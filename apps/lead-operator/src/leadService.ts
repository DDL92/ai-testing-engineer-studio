import { generateActionCockpit as buildActionCockpit } from './actions/actionCockpitService';
import { optimizeLeadMessage, optimizeMessageFile } from './ai/messageOptimizer';
import { generateSourceQualityReport } from './sources/sourceQualityService';
import { generateWeeklyDashboard } from './business/weeklyDashboardService';
import { findLeads } from './finder/leadFinder';
import { getDueLeads, writeFollowUpDueDrafts } from './followups/followupDueWriter';
import { nextFollowUpDate, parseOutreachChannel } from './outreach/outreachCadence';
import { markMessageSent, reviewMessage, scanMessageQueue } from './messages/messageReviewService';
import { analyzePipeline } from './pipeline/pipelineAnalyzer';
import { writePipelineSummary } from './pipeline/pipelineWriter';
import { writeProposalDrafts } from './proposals/proposalWriter';
import { buildLeadReviewContext, LeadReviewContext, writeLeadReview } from './review/leadReviewWriter';
import { closeLead, convertLead, generateRevenueSummary } from './revenue/revenueService';
import { applyScoreToLead, opportunityToLead } from './scoring/scorer';
import { ensureLeadDataFiles, readClosedLeads, readConversions, readLeads, readOpportunities, readOutreachHistory, writeLeads, writeOpportunities, writeOutreachHistory } from './storage/jsonStore';
import { generateDailySummary } from './dailySummary';
import { parseLeadStatus, updateLeadStatus } from './status/statusUpdater';
import { Lead, OutreachRecord } from './types/lead';
import { stableId } from './utils/ids';
import { validateEmail, validateHttpUrl } from './utils/validation';

export function addLead(): void {
  ensureLeadDataFiles();
  const leads = readLeads();
  const now = new Date().toISOString();
  const sampleLeads: Lead[] = [];
  if (!leads.some((lead) => lead.id === 'sample-lead')) {
    sampleLeads.push({
      id: 'sample-lead',
      companyName: 'Sample SaaS Company',
      website: 'https://example.com',
      contactName: '',
      contactRole: 'Founder',
      contactEmail: '',
      linkedinUrl: '',
      source: 'manual',
      sourceUrl: '',
      detectedPainPoint: 'SaaS web app with signup, dashboard, and possible regression testing needs.',
      techStackHints: ['SaaS', 'web app', 'dashboard', 'Playwright'],
      qaFitReason: 'Good fit for a Playwright-based QA audit.',
      score: 0,
      scoreBreakdown: { positive: [], negative: [], total: 0, category: 'ignore' },
      status: 'new',
      suggestedOffer: '',
      nextAction: '',
      createdAt: now,
      updatedAt: now,
      lastContactedAt: '',
      nextFollowUpAt: '',
      notes: 'Edit or replace this local seed lead.',
    });
  }

  if (!leads.some((lead) => lead.id === 'sample-lead-close')) {
    sampleLeads.push({
      id: 'sample-lead-close',
      companyName: 'Sample Close Test Company',
      website: 'https://example.com',
      contactName: 'Close Test Founder',
      contactRole: 'Founder',
      contactEmail: 'close-test@example.com',
      linkedinUrl: 'https://linkedin.com/in/close-test-founder',
      source: 'manual',
      sourceUrl: '',
      detectedPainPoint: 'Validation-only close workflow sample.',
      techStackHints: ['SaaS', 'web app'],
      qaFitReason: 'Used only for validating lead:close safely.',
      score: 0,
      scoreBreakdown: { positive: [], negative: [], total: 0, category: 'ignore' },
      status: 'new',
      suggestedOffer: '',
      nextAction: '',
      createdAt: now,
      updatedAt: now,
      lastContactedAt: '',
      nextFollowUpAt: '',
      notes: 'Validation-only close workflow sample.',
    });
  }

  if (sampleLeads.length > 0) writeLeads([...leads, ...sampleLeads]);
}

export function scoreLeads(): Lead[] {
  ensureLeadDataFiles();
  const existingLeads = readLeads();
  const opportunityLeads = readOpportunities().map(opportunityToLead);
  const merged = mergeLeads(existingLeads, opportunityLeads).map(applyScoreToLead);
  writeLeads(merged);
  return merged;
}

export function generateProposalDrafts(leadId?: string): string[] {
  const leads = scoreLeads();
  const selectedLeads = leadId ? leads.filter((lead) => lead.id === leadId) : leads;
  if (leadId && selectedLeads.length === 0) throw new Error(`Lead not found: ${leadId}`);
  return writeProposalDrafts(selectedLeads);
}

export function generateFollowUps(): string[] {
  return generateProposalDrafts();
}

export function generateDailyOnly(): void {
  const leads = scoreLeads();
  const proposalFiles = writeProposalDrafts(leads);
  const pipeline = analyzePipeline(leads, new Date().toISOString(), readOutreachHistory(), readConversions(), readClosedLeads());
  writePipelineSummary(pipeline);
  generateRevenueSummary();
  generateDailySummary({
    sourcesChecked: 0,
    opportunities: readOpportunities(),
    leads,
    proposalFiles,
    warnings: [],
  });
}

export async function runAuto(): Promise<void> {
  ensureLeadDataFiles();
  const finderResult = await findLeads();
  const leads = scoreLeads();
  const proposalFiles = writeProposalDrafts(leads);
  const pipeline = analyzePipeline(leads, new Date().toISOString(), readOutreachHistory(), readConversions(), readClosedLeads());
  writePipelineSummary(pipeline);
  generateRevenueSummary();
  generateDailySummary({
    sourcesChecked: finderResult.sourcesChecked,
    opportunities: finderResult.opportunities,
    leads,
    proposalFiles,
    warnings: finderResult.warnings,
  });
}

export async function runFindOnly(): Promise<void> {
  ensureLeadDataFiles();
  await findLeads();
}

export function updateLeadById(input: { id?: string; status?: string; note?: string }): Lead {
  if (!input.id) throw new Error('Missing --id. Example: npm run lead:update -- --id sample-lead --status contacted');
  const status = parseLeadStatus(input.status);
  const existingLeads = readLeads();
  const opportunityLeads = readOpportunities().map(opportunityToLead);
  const leads = mergeLeads(existingLeads, opportunityLeads);
  const lead = leads.find((item) => item.id === input.id);

  if (!lead) throw new Error(`Lead or opportunity not found: ${input.id}`);

  const updatedLead = updateLeadStatus(lead, status, input.note);
  writeLeads(leads.map((item) => item.id === updatedLead.id ? updatedLead : item));
  writeOpportunities(readOpportunities().map((opportunity) => opportunity.id === updatedLead.id
    ? { ...opportunity, status, notes: [opportunity.notes, input.note].filter(Boolean).join('\n'), updatedAt: updatedLead.updatedAt }
    : opportunity));
  return updatedLead;
}

export function enrichLead(input: {
  id?: string;
  contactName?: string;
  contactRole?: string;
  contactEmail?: string;
  linkedinUrl?: string;
  companyName?: string;
  website?: string;
  note?: string;
}): Lead {
  if (!input.id) throw new Error('Missing --id. Example: npm run lead:enrich -- --id sample-lead --email "sample@example.com"');
  validateEmail(input.contactEmail);
  validateHttpUrl(input.linkedinUrl, 'LinkedIn');
  validateHttpUrl(input.website, 'website');

  const leads = mergeLeads(readLeads(), readOpportunities().map(opportunityToLead));
  const lead = leads.find((item) => item.id === input.id);
  if (!lead) throw new Error(`Lead or opportunity not found: ${input.id}`);

  const now = new Date().toISOString();
  const updatedLead: Lead = {
    ...lead,
    companyName: input.companyName ?? lead.companyName,
    website: input.website ?? lead.website,
    contactName: input.contactName ?? lead.contactName,
    contactRole: input.contactRole ?? lead.contactRole,
    contactEmail: input.contactEmail ?? lead.contactEmail,
    linkedinUrl: input.linkedinUrl ?? lead.linkedinUrl,
    notes: appendHistoryNote(lead.notes, 'enrichment', input.note, now),
    updatedAt: now,
  };

  writeLeads(leads.map((item) => item.id === updatedLead.id ? updatedLead : item));
  writeOpportunities(readOpportunities().map((opportunity) => opportunity.id === updatedLead.id
    ? {
      ...opportunity,
      companyName: updatedLead.companyName,
      website: updatedLead.website,
      notes: appendHistoryNote(opportunity.notes ?? '', 'enrichment', input.note, now),
      updatedAt: now,
    }
    : opportunity));

  return updatedLead;
}

export function markProposalSent(input: { id?: string; channel?: string; note?: string }): { lead: Lead; record: OutreachRecord } {
  if (!input.id) throw new Error('Missing --id. Example: npm run lead:sent -- --id sample-lead --channel linkedin');
  const channel = parseOutreachChannel(input.channel);
  const leads = mergeLeads(readLeads(), readOpportunities().map(opportunityToLead));
  const lead = leads.find((item) => item.id === input.id);
  if (!lead) throw new Error(`Lead or opportunity not found: ${input.id}`);

  const sentAt = new Date().toISOString();
  const nextFollowUpAt = nextFollowUpDate(sentAt);
  const updatedLead: Lead = {
    ...lead,
    status: 'proposal_sent',
    lastContactedAt: sentAt,
    nextFollowUpAt,
    notes: appendHistoryNote(lead.notes, `sent:${channel}`, input.note, sentAt),
    updatedAt: sentAt,
  };
  const record: OutreachRecord = {
    id: stableId(updatedLead.id, channel, sentAt),
    leadId: updatedLead.id,
    companyName: updatedLead.companyName,
    channel,
    messageType: 'proposal',
    sentAt,
    nextFollowUpAt,
    note: input.note ?? '',
  };

  writeLeads(leads.map((item) => item.id === updatedLead.id ? updatedLead : item));
  writeOpportunities(readOpportunities().map((opportunity) => opportunity.id === updatedLead.id
    ? { ...opportunity, status: 'proposal_sent' as const, notes: appendHistoryNote(opportunity.notes ?? '', `sent:${channel}`, input.note, sentAt), updatedAt: sentAt }
    : opportunity));
  writeOutreachHistory([...readOutreachHistory(), record]);

  return { lead: updatedLead, record };
}

export function generateFollowUpsDue(): { files: string[]; dueCount: number } {
  const leads = readLeads();
  const outreachHistory = readOutreachHistory();
  const files = writeFollowUpDueDrafts(leads, outreachHistory);
  return { files, dueCount: getDueLeads(leads).length };
}

export function generatePipeline(): { file: string; summary: ReturnType<typeof analyzePipeline> } {
  const leads = scoreLeads();
  const summary = analyzePipeline(leads, new Date().toISOString(), readOutreachHistory(), readConversions(), readClosedLeads());
  const file = writePipelineSummary(summary);
  return { file, summary };
}

export function reviewLeadById(leadId?: string): { file: string; context: LeadReviewContext } {
  if (!leadId) throw new Error('Missing --id. Example: npm run lead:review -- --id sample-lead');
  const leads = mergeLeads(readLeads(), readOpportunities().map(opportunityToLead));
  const lead = leads.find((item) => item.id === leadId);
  if (!lead) throw new Error(`Lead or opportunity not found: ${leadId}`);

  const context = buildLeadReviewContext(lead, readOutreachHistory());
  const file = writeLeadReview(context);
  return { file, context };
}

export function generateActionCockpit() {
  return buildActionCockpit();
}

export { markMessageSent, reviewMessage, scanMessageQueue };
export { optimizeLeadMessage, optimizeMessageFile };
export { generateSourceQualityReport };
export { closeLead, convertLead, generateRevenueSummary };
export { generateWeeklyDashboard };

function appendHistoryNote(existingNotes: string, label: string, note: string | undefined, timestamp: string): string {
  if (!note?.trim()) return existingNotes;
  return [existingNotes.trim(), `[${timestamp}] ${label}: ${note.trim()}`].filter(Boolean).join('\n');
}

function mergeLeads(existing: Lead[], incoming: Lead[]): Lead[] {
  const byId = new Map<string, Lead>();
  for (const lead of existing) byId.set(lead.id, lead);
  for (const lead of incoming) byId.set(lead.id, { ...lead, ...byId.get(lead.id), scoreBreakdown: lead.scoreBreakdown });
  return Array.from(byId.values()).sort((a, b) => b.score - a.score || a.companyName.localeCompare(b.companyName));
}
