import fs = require('fs');
import path = require('path');
import { ContactAwareLeadEvaluation, ContactAwareRotationReport } from '../contactAwareRotation/types';
import { OutreachRecord } from '../outreachTracking/types';
import { buildFollowupQueue } from '../outreachTracking/outreachTrackingRules';
import { readWebsiteLeads } from '../websiteStudio/leadAdapter';
import { buildWebsiteRanking, RankedWebsiteLead } from '../websiteStudio/rankingWorkflow';
import { WebsiteLeadRecord } from '../websiteStudio/types';
import { DailyActionChannel, DailyRevenueAction, DailyRevenuePlan } from './types';

const outputRoot = path.join(process.cwd(), 'output', 'operator');
const statePath = path.join(process.cwd(), 'data', 'operator', 'daily-run-state.json');
const targetActions = 5;
const recentContactDays = 3;

export interface DailyPlanInput {
  now: Date;
  outreachRecords: OutreachRecord[];
  qaRotation: ContactAwareRotationReport;
  websiteLeads: WebsiteLeadRecord[];
  websiteRanking?: RankedWebsiteLead[];
  recurrenceCounts?: Record<string, number>;
}

export interface DailyRunHealth {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  modulesExecuted: string[];
  modulesReusedFromCache: string[];
  cachesBypassed: string[];
  searchProviderStatus: string;
  warnings: string[];
  errors: string[];
  notificationSucceeded: boolean;
  notificationDiagnostics: {
    attemptedCommand: string;
    exitCode: number | null;
    sanitizedStderr: string;
    nonInteractiveSession: boolean;
  };
  preparationRecurrence: Record<string, number>;
  nextScheduledRun: string;
}

export function buildDailyRevenuePlan(input: DailyPlanInput): DailyRevenuePlan {
  const generatedAt = input.now.toISOString();
  const today = generatedAt.slice(0, 10);
  const selected: DailyRevenueAction[] = [];
  const skipped: DailyRevenuePlan['skippedCandidates'] = [];
  const selectedCompanies = new Set<string>();
  const contactedRecently = recentCompanySet(input.outreachRecords, today);
  const recurrenceCounts = input.recurrenceCounts ?? {};

  const add = (action: DailyRevenueAction): boolean => {
    const companyKey = normalize(action.companyName);
    if (selected.length >= targetActions || selectedCompanies.has(companyKey)) return false;
    selected.push(action);
    selectedCompanies.add(companyKey);
    return true;
  };

  for (const item of buildFollowupQueue(input.outreachRecords, today)) {
    add({
      id: `follow-up:${identity(item.record.companyName)}`,
      priority: 1,
      actionType: item.record.replyReceived ? 'reply_required' : 'follow_up',
      companyName: item.record.companyName,
      vertical: 'qa_automation',
      contactName: usefulContact(item.record.contactName),
      contactRole: item.record.contactRole || undefined,
      channel: channel(item.record.channel),
      offer: 'Continue existing outreach conversation',
      reason: item.reason,
      evidenceStatus: 'Existing outreach',
      contactStatus: item.record.replyReceived ? 'REPLIED' : 'SENT',
      messagePath: existingMessagePath(item.record.companyName),
      followUpDate: item.record.nextFollowUpAt ?? undefined,
      source: item.record.source ?? 'Legacy Outreach',
      estimatedMinutes: 3,
      manualInstruction: 'Review the prior conversation and send manually only if still appropriate.',
    });
  }

  for (const record of input.outreachRecords.filter((item) => item.replyReceived)) {
    add({
      id: `reply:${identity(record.companyName)}`,
      priority: 1,
      actionType: 'reply_required',
      companyName: record.companyName,
      vertical: 'qa_automation',
      contactName: usefulContact(record.contactName),
      contactRole: record.contactRole || undefined,
      channel: channel(record.channel),
      offer: 'Respond to existing conversation',
      reason: 'A real reply is recorded and requires manual review.',
      evidenceStatus: 'Existing reply',
      contactStatus: 'REPLIED',
      source: record.source ?? 'Legacy Outreach',
      estimatedMinutes: 4,
      manualInstruction: 'Review the real reply and respond manually only after confirming context.',
    });
  }

  const readyQa = readyQaLeads(input.qaRotation);
  for (const lead of readyQa.slice(0, 3)) {
    if (selected.length >= targetActions) break;
    if (contactedRecently.has(normalize(lead.companyName))) {
      skipped.push({ companyName: lead.companyName, reason: 'Contacted within the last three days.' });
      continue;
    }
    add(qaAction(lead, 'send_qa_outreach', 2));
  }

  const ranking = input.websiteRanking ?? buildWebsiteRanking(input.websiteLeads);
  const recordsById = new Map(input.websiteLeads.map((record) => [record.lead.id, record]));
  let websiteCount = 0;
  for (const ranked of ranking.slice(0, 10)) {
    if (selected.length >= targetActions || websiteCount >= 2) break;
    const record = recordsById.get(ranked.leadId);
    if (!record) continue;
    if (selectedCompanies.has(normalize(record.lead.companyName))) {
      skipped.push({ companyName: record.lead.companyName, reason: 'Duplicate company across daily pipelines.' });
      continue;
    }
    if (contactedRecently.has(normalize(record.lead.companyName))) {
      skipped.push({ companyName: record.lead.companyName, reason: 'Contacted within the last three days.' });
      continue;
    }
    const action = websiteAction(record, ranked);
    if (!action) {
      skipped.push({ companyName: record.lead.companyName, reason: websiteSkipReason(record) });
      continue;
    }
    if (isPreparationAction(action) && recurrenceCounts[normalize(record.lead.companyName)] >= 2) {
      skipped.push({
        companyName: record.lead.companyName,
        reason: 'Temporarily deprioritized after appearing as preparation-only for three consecutive runs.',
      });
      continue;
    }
    if (add(action)) websiteCount += 1;
  }

  for (const record of input.websiteLeads.filter((lead) => lead.analysis.decision === 'NOT_QUALIFIED')) {
    skipped.push({
      companyName: record.lead.companyName,
      reason: record.migrationDetected
        ? 'Skipped — migrated domain; current official website has navigation, contact details, and booking paths.'
        : `Skipped — ${record.analysis.strongestOpportunity}.`,
    });
  }

  for (const lead of input.qaRotation.evaluatedLeads.slice(0, 10)) {
    if (selected.length >= targetActions) break;
    if (lead.contactStatus === 'READY' || lead.contactStatus === 'NOT_EVALUATED') continue;
    if (selectedCompanies.has(normalize(lead.companyName))) continue;
    if (lead.contactStatus === 'LOW_COMMERCIAL_FIT') {
      skipped.push({ companyName: lead.companyName, reason: lead.reason });
      continue;
    }
    if (contactedRecently.has(normalize(lead.companyName))) {
      skipped.push({ companyName: lead.companyName, reason: 'Contacted within the last three days.' });
      continue;
    }
    if (lead.contactStatus === 'CONTACT_BLOCKED') {
      if (recurrenceCounts[normalize(lead.companyName)] >= 2) {
        skipped.push({
          companyName: lead.companyName,
          reason: 'Temporarily deprioritized after appearing as blocked or preparation-only for three consecutive runs.',
        });
        continue;
      }
      add(qaAction(lead, 'verify_contact', 4));
    } else {
      skipped.push({ companyName: lead.companyName, reason: lead.reason });
    }
  }

  for (const lead of input.qaRotation.evaluatedLeads.slice(0, 10)) {
    if (selected.length >= targetActions) break;
    if (lead.contactStatus !== 'NOT_EVALUATED' || selectedCompanies.has(normalize(lead.companyName))) continue;
    if (recurrenceCounts[normalize(lead.companyName)] >= 2) {
      skipped.push({
        companyName: lead.companyName,
        reason: 'Temporarily deprioritized after appearing as blocked or preparation-only for three consecutive runs.',
      });
      continue;
    }
    add(qaAction(lead, 'review_evidence', 5));
  }

  const actionCounts = countActions(selected);
  const status: DailyRevenuePlan['status'] = selected.length === 0
    ? 'BLOCKED'
    : actionCounts.commerciallyReady >= 3 ? 'READY' : 'PARTIAL';
  return {
    generatedAt,
    date: today,
    status,
    targetActionCount: targetActions,
    selectedActions: selected,
    qaActions: selected.filter((action) => action.vertical === 'qa_automation'),
    websiteActions: selected.filter((action) => action.vertical === 'ai_website'),
    followUpActions: selected.filter((action) => action.actionType === 'follow_up' || action.actionType === 'reply_required'),
    actionCounts,
    skippedCandidates: uniqueSkipped(skipped),
    estimatedTotalMinutes: selected.reduce((total, action) => total + action.estimatedMinutes, 0),
    nextCommand: 'Review output/operator/today-action-checklist.md and perform approved actions manually.',
    safetyRules: [
      'No outreach, follow-up, email, form, connection request, meeting, invoice, or payment is sent automatically.',
      'Generated drafts are preparation only and never count as completed outreach.',
      'Only verified contacts may produce ready-to-send actions.',
      'Record actual sends and outcomes manually after external action.',
    ],
  };
}

export function writeDailyRevenuePlanOutputs(plan: DailyRevenuePlan): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  const outputs: Array<[string, string]> = [
    ['daily-revenue-plan.md', renderDailyRevenuePlan(plan)],
    ['daily-revenue-plan.json', `${JSON.stringify(plan, null, 2)}\n`],
    ['today-action-checklist.md', renderChecklist(plan)],
    ['skipped-candidates.md', renderSkipped(plan)],
  ];
  for (const [fileName, body] of outputs) fs.writeFileSync(path.join(outputRoot, fileName), body, 'utf8');
  return outputs.map(([fileName]) => path.join(outputRoot, fileName));
}

export function writeDailyRunState(plan: DailyRevenuePlan, health: DailyRunHealth): string {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, `${JSON.stringify({ ...health, plan }, null, 2)}\n`, 'utf8');
  fs.mkdirSync(outputRoot, { recursive: true });
  fs.writeFileSync(path.join(outputRoot, 'operator-health.md'), renderHealth(plan, health), 'utf8');
  return statePath;
}

export function loadWebsitePlanData(): { leads: WebsiteLeadRecord[]; ranking: RankedWebsiteLead[] } {
  const leads = readWebsiteLeads();
  return { leads, ranking: buildWebsiteRanking(leads) };
}

function qaAction(
  lead: ContactAwareLeadEvaluation,
  actionType: 'send_qa_outreach' | 'verify_contact' | 'review_evidence',
  priority: number,
): DailyRevenueAction {
  return {
    id: `${actionType}:${lead.companyId}`,
    priority,
    actionType,
    companyName: lead.companyName,
    vertical: 'qa_automation',
    contactName: lead.primaryContactName,
    contactRole: lead.primaryContactTitle,
    channel: lead.primaryContactName ? 'linkedin' : 'unknown',
    offer: coldQaOffer(lead.recommendedOffer),
    reason: lead.reason,
    evidenceStatus: lead.evidenceStatus,
    contactStatus: lead.contactStatus,
    messagePath: actionType === 'send_qa_outreach' ? existingMessagePath(lead.companyName) : undefined,
    evidencePath: lead.contactPackPath,
    source: 'Contact-Aware QA Rotation',
    estimatedMinutes: actionType === 'send_qa_outreach' ? 5 : 6,
    manualInstruction: actionType === 'send_qa_outreach'
      ? 'Review the company-specific draft and send manually only after approval.'
      : actionType === 'verify_contact'
        ? 'Verify the named contact and current role using public sources; do not send a message.'
        : 'Review the evidence blocker and decide whether this lead remains commercially usable.',
  };
}

function websiteAction(record: WebsiteLeadRecord, ranked: RankedWebsiteLead): DailyRevenueAction | null {
  if (record.analysis.decision === 'NOT_QUALIFIED') return null;
  const meaningfulSignal = record.analysis.opportunitySignals[0];
  const publicChannel = websiteChannel(record);
  const needsWebsiteVerification = record.analysis.evidenceGaps.some((gap) => /website presence requires manual verification/i.test(gap));
  const weakModernSite = record.analysis.presence === 'functioning_website'
    && (!meaningfulSignal || meaningfulSignal === 'Evidence is incomplete and requires manual verification');
  if (weakModernSite) return null;

  const inspectionInconclusive = record.analysis.decision === 'INSPECTION_INCONCLUSIVE';
  const canSend = Boolean(meaningfulSignal)
    && !needsWebsiteVerification
    && !inspectionInconclusive
    && publicChannel !== 'unknown'
    && record.analysis.decision !== 'REVIEW';
  const actionType = canSend ? 'send_website_outreach' : 'review_evidence';
  return {
    id: `${actionType}:${record.lead.id}`,
    priority: 3,
    actionType,
    companyName: record.lead.companyName,
    vertical: 'ai_website',
    channel: publicChannel,
    offer: record.analysis.primaryOffer.name,
    reason: meaningfulSignal
      ? `Verified public opportunity signal: ${meaningfulSignal}.`
      : ranked.strongestOpportunity,
    evidenceStatus: record.analysis.presence,
    contactStatus: inspectionInconclusive
      ? 'INSPECTION INCONCLUSIVE'
      : publicChannel === 'unknown' ? 'PUBLIC CONTACT NOT VERIFIED' : 'PUBLIC BUSINESS CHANNEL',
    messagePath: canSend ? `output/website-studio/leads/${record.lead.id}/outreach-drafts.md` : undefined,
    evidencePath: `output/website-studio/leads/${record.lead.id}/lead-pack.md`,
    source: record.lead.source,
    estimatedMinutes: canSend ? 5 : 6,
    manualInstruction: canSend
      ? 'Review the Website Studio draft and send manually only after verifying the business and public channel.'
      : inspectionInconclusive
        ? 'Retry or manually review the website inspection evidence; do not infer downtime or prepare outreach.'
        : 'Verify the website opportunity and public contact before preparing outreach.',
  };
}

function websiteSkipReason(record: WebsiteLeadRecord): string {
  if (record.analysis.decision === 'NOT_QUALIFIED') return record.analysis.strongestOpportunity;
  if (record.analysis.decision === 'INSPECTION_INCONCLUSIVE') return 'Inspection inconclusive; retry before judging website availability.';
  if (record.analysis.presence === 'functioning_website') {
    return 'Working site has no sufficiently specific verified opportunity for today.';
  }
  return record.analysis.evidenceGaps[0] ?? 'No useful Website Studio action available.';
}

function readyQaLeads(report: ContactAwareRotationReport): ContactAwareLeadEvaluation[] {
  const ready = report.readyLeads ?? [];
  if (ready.length > 0) return ready;
  return report.evaluatedLeads.filter((lead) => lead.contactStatus === 'READY').slice(0, 3);
}

function recentCompanySet(records: OutreachRecord[], today: string): Set<string> {
  return new Set(records
    .filter((record) => record.messageSent)
    .filter((record) => daysBetween(record.sentAt, today) >= 0 && daysBetween(record.sentAt, today) < recentContactDays)
    .map((record) => normalize(record.companyName)));
}

function existingMessagePath(companyName: string): string | undefined {
  const candidates = [
    path.join('output', 'messages', `${identity(companyName)}-message-pack.md`),
    path.join('output', 'outreach-packs', identity(companyName), 'linkedin-message.md'),
  ];
  return candidates.find((candidate) => fs.existsSync(path.join(process.cwd(), candidate)));
}

function usefulContact(value: string): string | undefined {
  return value && value !== 'Lead operator contact' ? value : undefined;
}

function channel(value: string): DailyActionChannel {
  if (value === 'linkedin' || value === 'email') return value;
  if (value === 'website-form') return 'contact_form';
  return 'unknown';
}

function websiteChannel(record: WebsiteLeadRecord): DailyActionChannel {
  if (record.publicContact.email) return 'email';
  if (record.publicContact.instagramUrl) return 'instagram';
  if (record.publicContact.phone) return 'whatsapp';
  if (record.lead.website && (record.inspection.mailtoLinkPresent || record.inspection.telLinkPresent)) return 'contact_form';
  return 'unknown';
}

function coldQaOffer(offer: string): string {
  return /retainer/i.test(offer) ? 'QA Audit ($199-$500)' : offer;
}

export function renderDailyRevenuePlan(plan: DailyRevenuePlan): string {
  return `# Studio Daily Revenue Plan

Date: ${plan.date}
Status: ${plan.status}
Actions: ${plan.selectedActions.length}
Estimated time: ${plan.estimatedTotalMinutes} minutes

## Commercial Readiness

- Send-ready QA outreach: ${plan.actionCounts.sendReadyQaOutreach}
- Send-ready Website outreach: ${plan.actionCounts.sendReadyWebsiteOutreach}
- Follow-ups requiring review: ${plan.actionCounts.followUpsRequiringReview}
- Replies requiring action: ${plan.actionCounts.repliesRequiringAction}
- Contact verification: ${plan.actionCounts.contactVerification}
- Evidence review: ${plan.actionCounts.evidenceReview}
- Total commercially ready actions: ${plan.actionCounts.commerciallyReady}
- Total preparation actions: ${plan.actionCounts.preparationActions}

## Do First

${plan.selectedActions.map((action, index) => renderAction(action, index + 1)).join('\n\n') || '- No useful manual revenue actions are currently available.'}

## Skipped Today

${plan.skippedCandidates.map((item) => `- ${cleanSpacing(item.companyName)} — ${cleanSpacing(item.reason)}`).join('\n') || '- None.'}

## Safety Rules

${plan.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

function renderAction(action: DailyRevenueAction, index: number): string {
  const label = action.actionType.replace(/_/g, ' ');
  return `### ${index}. ${label} — ${cleanSpacing(action.companyName)}
- Vertical: ${action.vertical}
- Contact: ${action.contactName ?? 'Manual verification required'}
- Channel: ${action.channel ?? 'unknown'}
- Offer: ${action.offer}
- Reason: ${cleanSpacing(action.reason)}
- Evidence: ${action.evidenceStatus}${action.evidencePath ? ` — ${action.evidencePath}` : ''}
- Contact status: ${action.contactStatus}
- Follow-up date: ${action.followUpDate ?? 'Not applicable'}
- Message: ${action.messagePath ?? 'Not generated until readiness is verified'}
- Action: ${cleanSpacing(action.manualInstruction)}
- Estimated time: ${action.estimatedMinutes} minutes`;
}

function renderChecklist(plan: DailyRevenuePlan): string {
  return `# Today’s ${plan.estimatedTotalMinutes}-Minute Studio Checklist

${plan.selectedActions.map((action, index) => `- [ ] ${index + 1}. ${cleanSpacing(action.manualInstruction)} — ${cleanSpacing(action.companyName)}`).join('\n') || '- [ ] Review blockers; no external action is ready.'}
- [ ] Record only actual sent outcomes after manual action
`;
}

function renderSkipped(plan: DailyRevenuePlan): string {
  return `# Skipped Candidates

Generated: ${plan.generatedAt}

${plan.skippedCandidates.map((item) => `- ${cleanSpacing(item.companyName)}: ${cleanSpacing(item.reason)}`).join('\n') || '- None.'}
`;
}

export function renderHealth(plan: DailyRevenuePlan, health: DailyRunHealth): string {
  return `# Daily Revenue Operator Health

- Last run: ${health.completedAt}
- Duration: ${health.durationMs} ms
- Modules executed: ${health.modulesExecuted.join(', ') || 'none'}
- Modules reused from cache: ${health.modulesReusedFromCache.join(', ') || 'none'}
- Caches bypassed: ${health.cachesBypassed.join(', ') || 'none'}
- Actions selected: ${plan.selectedActions.length}
- QA actions: ${plan.qaActions.length}
- Website actions: ${plan.websiteActions.length}
- Send-ready QA outreach: ${plan.actionCounts.sendReadyQaOutreach}
- Send-ready Website outreach: ${plan.actionCounts.sendReadyWebsiteOutreach}
- Follow-ups requiring review: ${plan.actionCounts.followUpsRequiringReview}
- Replies requiring action: ${plan.actionCounts.repliesRequiringAction}
- Contact verification: ${plan.actionCounts.contactVerification}
- Evidence review: ${plan.actionCounts.evidenceReview}
- Total commercially ready actions: ${plan.actionCounts.commerciallyReady}
- Total preparation actions: ${plan.actionCounts.preparationActions}
- Blocked/skipped leads: ${plan.skippedCandidates.length}
- Search provider status: ${health.searchProviderStatus}
- Warnings: ${health.warnings.join('; ') || 'none'}
- Errors: ${health.errors.join('; ') || 'none'}
- Next scheduled run: ${health.nextScheduledRun}
- Notification succeeded: ${health.notificationSucceeded ? 'yes' : 'no'}
- Notification attempted command: ${health.notificationDiagnostics.attemptedCommand || 'none'}
- Notification exit code: ${health.notificationDiagnostics.exitCode ?? 'unknown'}
- Notification stderr: ${health.notificationDiagnostics.sanitizedStderr || 'none'}
- Notification non-interactive session: ${health.notificationDiagnostics.nonInteractiveSession ? 'yes' : 'no'}
`;
}

export function countActions(actions: DailyRevenueAction[]): DailyRevenuePlan['actionCounts'] {
  const count = (type: DailyRevenueAction['actionType']) => actions.filter((action) => action.actionType === type).length;
  const sendReadyQaOutreach = count('send_qa_outreach');
  const sendReadyWebsiteOutreach = count('send_website_outreach');
  const followUpsRequiringReview = count('follow_up');
  const repliesRequiringAction = count('reply_required');
  const contactVerification = count('verify_contact');
  const evidenceReview = count('review_evidence');
  return {
    sendReadyQaOutreach,
    sendReadyWebsiteOutreach,
    followUpsRequiringReview,
    repliesRequiringAction,
    contactVerification,
    evidenceReview,
    commerciallyReady: sendReadyQaOutreach + sendReadyWebsiteOutreach + followUpsRequiringReview + repliesRequiringAction,
    preparationActions: contactVerification + evidenceReview,
  };
}

export function preparationRecurrence(plan: DailyRevenuePlan): Record<string, number> {
  return Object.fromEntries(plan.selectedActions
    .filter(isPreparationAction)
    .map((action) => [normalize(action.companyName), 1]));
}

function isPreparationAction(action: DailyRevenueAction): boolean {
  return action.actionType === 'verify_contact' || action.actionType === 'review_evidence';
}

export function cleanSpacing(value: string): string {
  return value
    .replace(/\bfortoday\b/gi, 'for today')
    .replace(/\bbusinessand\b/gi, 'business and')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueSkipped(items: DailyRevenuePlan['skippedCandidates']): DailyRevenuePlan['skippedCandidates'] {
  return [...new Map(items.map((item) => [`${normalize(item.companyName)}|${item.reason}`, item])).values()];
}

function daysBetween(start: string, end: string): number {
  const startDate = new Date(`${start.slice(0, 10)}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  return Math.floor((endDate.getTime() - startDate.getTime()) / 86_400_000);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function identity(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
