import fs = require('fs');
import path = require('path');
import type { Lead } from '../leads/types';
import { readWebsiteLeads } from '../websiteStudio/leadAdapter';
import type {
  CommercialFinding,
  FollowUpItem,
  LeadType,
  LifecycleEntry,
  MetricsEvent,
  StudioMetrics,
} from './types';

const WEEKLY_DIR = path.join(process.cwd(), 'output', 'studio-operator', 'weekly');
const FOLLOWUP_DIR = path.join(process.cwd(), 'output', 'studio-operator', 'followups');
const CLOSE_PACK_DIR = path.join(process.cwd(), 'output', 'studio-operator', 'close-packs');
const BUSINESS_DAY_MS = 24 * 60 * 60 * 1000;
const FIRST_FOLLOW_UP_DAYS = 3;
const SECOND_FOLLOW_UP_DAYS = 5;
const FINAL_FOLLOW_UP_DAYS = 7;
const PROPOSAL_FOLLOW_UP_DAYS = 3;
const SECOND_PROPOSAL_FOLLOW_UP_DAYS = 7;

export function generateWeeklyReport(entries: LifecycleEntry[], metrics: StudioMetrics, now = new Date()): {
  reportingPeriod: { start: string; end: string };
  counts: Record<string, number>;
  confirmedMrrUsd: number;
  confirmedOneTimeRevenueUsd: number;
  targetMinimumUsd: 3000;
  targetUpperUsd: 5000;
  gapToMinimumUsd: number;
  gapToUpperUsd: number;
  conversionRates: Record<string, string>;
  conversionByLeadType: Record<string, Record<string, number>>;
  conversionBySource: Record<string, Record<string, number>>;
  conversionByOffer: Record<string, Record<string, number>>;
  medianStageDays: string;
  stalledByStage: Record<string, number>;
  primaryBottleneck: {
    stage: string;
    evidence: string;
    recommendedOperatorAction: string;
    exactExistingCommand: string | null;
  };
  nextSevenDayActions: string[];
} {
  const productionEntries = entries.filter((entry) => !isFixture(entry));
  const productionEvents = metrics.events.filter((event) => !isEventFixture(event, entries));
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  const periodEvents = productionEvents.filter((event) => {
    const date = new Date(event.recordedAt);
    return date >= start && date <= end;
  });
  const eventNames = [
    'leadsDiscovered', 'leadsVerified', 'leadsQualified', 'packsReady', 'outreachApproved',
    'messagesSent', 'repliesReceived', 'callsScheduled', 'proposalsReady', 'proposalsSent',
    'clientsWon', 'clientsLost',
  ];
  const counts = Object.fromEntries(eventNames.map((name) => [name, periodEvents.filter((event) => event.event === name).length]));
  const confirmedMrrUsd = sum(productionEntries.map((entry) => entry.confirmedMrrUsd ?? 0));
  const confirmedOneTimeRevenueUsd = sum(productionEntries.map((entry) => entry.confirmedOneTimeRevenueUsd ?? 0));
  const conversionByLeadType = breakdown(periodEvents, (event) => event.leadType);
  const conversionBySource = breakdown(periodEvents, (event) => event.source ?? 'unknown');
  const conversionByOffer = breakdown(periodEvents, (event) => event.offer ?? 'unknown');
  const bottleneck = determineBottleneck(productionEntries);
  return {
    reportingPeriod: { start: dateKey(start), end: dateKey(end) },
    counts,
    confirmedMrrUsd,
    confirmedOneTimeRevenueUsd,
    targetMinimumUsd: 3000,
    targetUpperUsd: 5000,
    gapToMinimumUsd: Math.max(0, 3000 - confirmedMrrUsd),
    gapToUpperUsd: Math.max(0, 5000 - confirmedMrrUsd),
    conversionRates: {
      sentToReply: safeRate(counts.messagesSent, counts.repliesReceived),
      replyToCall: safeRate(counts.repliesReceived, counts.callsScheduled),
      proposalToWin: safeRate(counts.proposalsSent, counts.clientsWon),
    },
    conversionByLeadType,
    conversionBySource,
    conversionByOffer,
    medianStageDays: 'INSUFFICIENT DATA',
    stalledByStage: countByStatus(productionEntries),
    primaryBottleneck: bottleneck,
    nextSevenDayActions: weeklyActions(bottleneck, productionEntries).slice(0, 5),
  };
}

export function writeWeeklyReport(report: ReturnType<typeof generateWeeklyReport>): { json: string; markdown: string } {
  const history = path.join(WEEKLY_DIR, 'history');
  fs.mkdirSync(history, { recursive: true });
  const json = path.join(WEEKLY_DIR, 'latest.json');
  const markdown = path.join(WEEKLY_DIR, 'latest.md');
  writeJson(json, report);
  fs.writeFileSync(markdown, renderWeekly(report), 'utf8');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  writeJson(path.join(history, `${stamp}.json`), report);
  fs.writeFileSync(path.join(history, `${stamp}.md`), renderWeekly(report), 'utf8');
  prune(history, 12);
  return { json, markdown };
}

export function buildFollowUps(
  entries: LifecycleEntry[],
  options: { leadType?: LeadType; leadId?: string; includeFixtures?: boolean } = {},
  now = new Date(),
): FollowUpItem[] {
  return entries
    .filter((entry) => options.includeFixtures || !isFixture(entry))
    .filter((entry) => !options.leadType || entry.leadType === options.leadType)
    .filter((entry) => !options.leadId || entry.leadId === options.leadId)
    .filter((entry) => ['contacted', 'replied', 'proposal_sent', 'call_scheduled'].includes(entry.status))
    .map((entry) => followUpFor(entry, now))
    .filter((item): item is FollowUpItem => item !== null)
    .filter((item) => item.due)
    .sort((a, b) => a.recommendedDate.localeCompare(b.recommendedDate));
}

export function writeFollowUps(items: FollowUpItem[]): string[] {
  const files: string[] = [];
  for (const item of items) {
    const dir = path.join(FOLLOWUP_DIR, item.leadId);
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${item.recommendedFollowUpType}.md`);
    const finding = firstConfirmedFinding(item.leadId, item.leadType);
    fs.writeFileSync(filePath, `# Follow-up Draft: ${item.businessName}

Status: **DRAFT — NOT APPROVED — NOT SENT**

Hello,

Following up on my previous note${finding ? ` about ${finding.description.toLowerCase()}` : ''}. If it would be useful, I can share the concise review or answer one specific question.

Would a short review be helpful?

[OPERATOR NAME]

Manual approval required. No message was sent or scheduled.
`, 'utf8');
    item.draftTextPath = path.relative(process.cwd(), filePath);
    files.push(filePath);
  }
  return files;
}

export function generateClosePack(
  entry: LifecycleEntry,
  options: { allowFixture?: boolean } = {},
): { outputDir: string; offer: { name: string; priceRange: string }; findings: CommercialFinding[] } {
  if (!['replied', 'call_scheduled', 'proposal_ready', 'proposal_sent'].includes(entry.status)) {
    throw new Error(`Close pack requires replied, call_scheduled, proposal_ready, or proposal_sent; current status is ${entry.status}.`);
  }
  if (['archived', 'lost', 'won'].includes(entry.status)) throw new Error(`Close pack is not allowed for ${entry.status} leads.`);
  if (isFixture(entry) && !options.allowFixture) throw new Error('Fixture close packs require explicit fixture validation.');
  const findings = confirmedFindings(entry);
  const offer = routeOffer(entry, findings);
  const outputDir = path.join(CLOSE_PACK_DIR, entry.leadId);
  fs.mkdirSync(outputDir, { recursive: true });
  const existing = existingFiles(entry);
  const fixtureNotice = isFixture(entry) ? '> Fictional validation close pack. Do not send or use commercially.\n\n' : '';
  const files = {
    'executive-summary.md': `${fixtureNotice}# Executive Summary: ${entry.businessName}

- Lead type: ${entry.leadType}
- Lifecycle status: ${entry.status}
- Verified business record: ${entry.sourceRecordPath ?? 'Requires confirmation'}
- Confirmed needs: ${findings.length ? findings.map((finding) => finding.description).join('; ') : 'Requires discovery confirmation'}
- Confirmed findings: ${findings.length ? findings.map((finding) => finding.description).join('; ') : 'None available'}
- Contact history: ${contactHistory(entry)}
- Current offer: ${offer.name} — ${offer.priceRange}
- Next commercial decision: confirm scope and decide whether the existing proposal should advance.
`,
    'discovery-call.md': `${fixtureNotice}# Discovery Call Brief: ${entry.businessName}

## Opening

Thanks for taking the time. I want to confirm the current situation, the impact of the observed issues, and whether a focused next step is worthwhile.

## Five high-value questions

1. Which website or QA workflows matter most to the business today?
2. What happens operationally when those workflows fail or regress?
3. What result would make a focused engagement worthwhile?
4. Who participates in scope and purchase decisions?
5. What budget and timeline constraints should shape the next step?

## Current-state and impact questions

- Which issues are already known?
- How are changes currently validated?
- Where does manual effort or uncertainty remain?

## Desired result and decision process

- What would a useful first deliverable contain?
- What evidence is needed to approve implementation?
- Who provides final approval?

## Close

I will summarize only what we confirmed and recommend the smallest existing offer that fits.

## Facts that must not be claimed

- Guaranteed revenue, conversion, SEO, accessibility, performance, or defect-free operation
- Unverified business impact
- Work completed or changes made without approval
`,
    'offer-recommendation.md': `${fixtureNotice}# Offer Recommendation

Recommended: **${offer.name} — ${offer.priceRange}**

Reason: ${offerReason(entry, findings)}

Path: ${entry.leadType === 'qa'
    ? 'QA Audit → Playwright Starter Pack → QA Automation Retainer when recurring regression coverage is confirmed.'
    : 'Website QA & Performance Audit → confirmed improvement scope → Monthly Website Care when ongoing work is justified.'}

No new package or price was created.
`,
    'proposal-review.md': `${fixtureNotice}# Proposal Review

Existing proposal: ${existing.proposal ?? 'Not found'}
Existing SOW: ${existing.sow ?? 'Not found'}

- [ ] Verified client identity
- [ ] Correct existing offer
- [ ] Correct existing price range
- [ ] Confirmed scope
- [ ] Explicit exclusions
- [ ] Timeline reviewed
- [ ] Deliverables reviewed
- [ ] Acceptance criteria present
- [ ] Dependencies identified
- [ ] Payment assumptions marked for manual confirmation
- [ ] No guaranteed results
- [ ] No invented business facts
- [ ] No credentials included
- [ ] Manual approval required

Proposal status was not changed or marked sent.
`,
    'objection-handling.md': `${fixtureNotice}# Advisory Objection Responses

## “We already have someone handling this.”

That makes sense. The review can be used as an independent, limited evidence check and shared with the existing team if useful.

## “The website or tests work fine.”

The goal is not to claim otherwise. The recommendation is based only on confirmed observations and can be limited to validating whether they matter.

## “We do not have budget.”

Understood. The smallest existing audit option can clarify priorities before any implementation commitment.

## “Send more information.”

I can send the concise findings, scope, exclusions, and the relevant existing offer for review.

## “Why do we need ongoing maintenance?”

Ongoing work is recommended only when recurring updates, regression coverage, reporting, or maintenance needs are confirmed.

## “Can you guarantee results?”

No. I can define the scope, evidence, acceptance criteria, and validation process, but not guarantee business or third-party outcomes.

All responses are advisory drafts and require manual approval.
`,
    'next-actions.md': `${fixtureNotice}# Next Actions

1. Review ${existing.pack ?? entry.packPath ?? 'the existing lead pack'} manually.
2. Review ${existing.proposal ?? 'the proposal requirements'}; do not mark it sent.
3. Use \`npm run studio:mark -- --id ${entry.leadId} --type ${entry.leadType} --status call_scheduled\` only after a call is actually scheduled.
4. Confirm the selected existing offer and scope.
5. After a proposal is manually sent, record it with \`npm run studio:mark -- --id ${entry.leadId} --type ${entry.leadType} --status proposal_sent\`.
`,
  };
  for (const [name, body] of Object.entries(files)) fs.writeFileSync(path.join(outputDir, name), body, 'utf8');
  writeJson(path.join(outputDir, 'close-pack.json'), {
    leadId: entry.leadId,
    leadType: entry.leadType,
    businessName: entry.businessName,
    lifecycleStatus: entry.status,
    offer,
    confirmedFindings: findings,
    existingFiles: existing,
    proposalSent: false,
    revenueRecorded: false,
    manualReviewRequired: true,
  });
  return { outputDir, offer, findings };
}

function followUpFor(entry: LifecycleEntry, now: Date): FollowUpItem | null {
  const days = businessDaysBetween(new Date(entry.lastActionAt), now);
  const finalReached = entry.notes.some((note) => /\[final-follow-up-complete\]/i.test(note));
  if (finalReached) return null;
  let cadence = FIRST_FOLLOW_UP_DAYS;
  let type = 'first-follow-up';
  let command = `npm run studio:mark -- --id ${entry.leadId} --type ${entry.leadType} --status replied`;
  if (entry.status === 'replied') {
    cadence = 0;
    type = 'reply-response';
    command = `npm run studio:mark -- --id ${entry.leadId} --type ${entry.leadType} --status call_scheduled`;
  } else if (entry.status === 'call_scheduled') {
    cadence = 0;
    type = 'call-preparation';
    command = `npm run studio:close-pack -- --id ${entry.leadId} --type ${entry.leadType}`;
  } else if (entry.status === 'proposal_sent') {
    cadence = entry.notes.some((note) => /\[proposal-follow-up-1\]/i.test(note))
      ? SECOND_PROPOSAL_FOLLOW_UP_DAYS
      : PROPOSAL_FOLLOW_UP_DAYS;
    type = cadence === PROPOSAL_FOLLOW_UP_DAYS ? 'proposal-follow-up-1' : 'proposal-follow-up-2';
    command = `npm run studio:mark -- --id ${entry.leadId} --type ${entry.leadType} --status won`;
  } else if (entry.notes.some((note) => /\[follow-up-2\]/i.test(note))) {
    cadence = FINAL_FOLLOW_UP_DAYS;
    type = 'final-follow-up';
  } else if (entry.notes.some((note) => /\[follow-up-1\]/i.test(note))) {
    cadence = SECOND_FOLLOW_UP_DAYS;
    type = 'second-follow-up';
  }
  const recommended = addBusinessDays(new Date(entry.lastActionAt), cadence);
  return {
    leadId: entry.leadId,
    leadType: entry.leadType,
    businessName: entry.businessName,
    currentStatus: entry.status,
    lastConfirmedAction: entry.previousStatus ? `${entry.previousStatus} → ${entry.status}` : entry.status,
    daysSinceLastAction: days,
    recommendedFollowUpType: type,
    reason: entry.status === 'replied' ? 'A confirmed reply awaits an operator response.'
      : entry.status === 'call_scheduled' ? 'A confirmed scheduled call requires preparation.'
        : entry.status === 'proposal_sent' ? 'A manually sent proposal awaits a decision.'
          : 'A manually contacted lead is due for a respectful follow-up.',
    draftTextPath: null,
    recommendedDate: dateKey(recommended),
    manualApprovalRequired: true,
    recommendedLifecycleCommand: command,
    due: recommended <= now,
    finalFollowUpReached: type === 'final-follow-up',
  };
}

function routeOffer(entry: LifecycleEntry, findings: CommercialFinding[]): { name: string; priceRange: string } {
  const recurringNeed = entry.notes.some((note) => /\b(ongoing|monthly|maintenance|regression|retainer|reporting)\b/i.test(note));
  const implementationConfirmed = entry.notes.some((note) => /\b(implementation confirmed|specific implementation|build scope confirmed)\b/i.test(note));
  if (entry.leadType === 'qa') {
    if (recurringNeed) return { name: 'QA Automation Retainer', priceRange: 'USD 1,500–3,000/month' };
    if (implementationConfirmed) return { name: 'Playwright Starter Pack', priceRange: 'USD 900–1,500' };
    return { name: 'QA Audit', priceRange: 'USD 199–500' };
  }
  if (recurringNeed) return { name: 'Monthly Website Care', priceRange: 'USD 100–300/month' };
  const existing = websiteOffer(entry.leadId);
  if (implementationConfirmed && existing && existing.name !== 'Website QA & Performance Audit') return existing;
  return { name: 'Website QA & Performance Audit', priceRange: 'USD 199–500' };
}

function confirmedFindings(entry: LifecycleEntry): CommercialFinding[] {
  if (entry.leadType === 'website') {
    const auditPath = path.join(process.cwd(), 'output', 'website-studio', 'demos', entry.leadId, 'audit.json');
    const audit = readJson<any>(auditPath, null);
    if (!audit || audit.reachable !== true || (audit.auditErrors?.length ?? 0) > 0) return [];
    return Object.values(audit.checks ?? {}).filter((check: any) => check.status === 'FAIL').map((check: any) => ({
      description: String(check.detail),
      source: path.relative(process.cwd(), auditPath),
      observedAt: audit.completedAt,
      severity: /broken|overflow|failed/i.test(check.detail) ? 'medium' : 'low',
      confidence: 'confirmed' as const,
      commerciallyUsable: true,
    }));
  }
  const evidencePath = entry.packPath && fs.existsSync(path.join(process.cwd(), entry.packPath)) ? entry.packPath : null;
  return evidencePath ? [{
    description: 'Existing QA pack requires manual evidence review.',
    source: evidencePath,
    observedAt: fs.statSync(path.join(process.cwd(), evidencePath)).mtime.toISOString(),
    severity: 'medium',
    confidence: 'confirmed',
    commerciallyUsable: true,
  }] : [];
}

function firstConfirmedFinding(leadId: string, type: LeadType): CommercialFinding | null {
  const entry: LifecycleEntry = {
    leadId, leadType: type, businessName: '', status: 'contacted', previousStatus: null,
    updatedAt: '', lastActionAt: '', nextAction: '', sourceRecordPath: null, packPath: null,
    approvedByOperator: false, contactedAt: null, repliedAt: null, proposalSentAt: null,
    wonAt: null, lostAt: null, notes: [],
  };
  return confirmedFindings(entry)[0] ?? null;
}

function existingFiles(entry: LifecycleEntry): { pack: string | null; proposal: string | null; sow: string | null; audit: string | null; salesPack: string | null } {
  if (entry.leadType === 'website') {
    return {
      pack: exists(`output/website-studio/leads/${entry.leadId}/lead-pack.md`),
      proposal: exists(`output/website-studio/sales/${entry.leadId}/proposal.md`),
      sow: exists(`output/website-studio/sales/${entry.leadId}/sow.md`),
      audit: exists(`output/website-studio/demos/${entry.leadId}/audit.json`),
      salesPack: exists(`output/website-studio/sales/${entry.leadId}/sales-pack.json`),
    };
  }
  return {
    pack: entry.packPath && fs.existsSync(path.join(process.cwd(), entry.packPath)) ? entry.packPath : null,
    proposal: exists(`sales-marketing-engine/operator/approval-queue/lead-${entry.leadId}-proposal.md`),
    sow: null,
    audit: exists('output/top-lead-audit/top-lead-evidence.md'),
    salesPack: null,
  };
}

function websiteOffer(leadId: string): { name: string; priceRange: string } | null {
  const sales = readJson<any>(path.join(process.cwd(), 'output', 'website-studio', 'sales', leadId, 'sales-pack.json'), null);
  return sales ? { name: sales.primaryOffer, priceRange: sales.priceRange } : null;
}

function determineBottleneck(entries: LifecycleEntry[]) {
  const count = (status: string) => entries.filter((entry) => entry.status === status).length;
  if (count('qualified') > 0 && count('pack_ready') === 0) return bottleneck('qualified_to_pack', `${count('qualified')} qualified lead(s), no packs ready.`, 'Generate the highest-value existing pack.', 'npm run studio:daily -- --skip-discovery');
  if (count('pack_ready') > 0 && count('approved_for_outreach') === 0) return bottleneck('pack_to_approval', `${count('pack_ready')} pack(s) ready, no outreach approvals.`, 'Review one evidence-backed draft and approve manually if appropriate.', 'npm run studio:daily -- --skip-discovery');
  if (count('approved_for_outreach') > 0) return bottleneck('approved_not_sent', `${count('approved_for_outreach')} approved outreach item(s) not confirmed sent.`, 'Send approved outreach manually, then record contacted.', null);
  if (count('contacted') > 0 && count('replied') === 0) return bottleneck('sent_to_reply', `${count('contacted')} contacted lead(s), no confirmed replies.`, 'Run the due follow-up review.', 'npm run studio:followups');
  if (count('replied') > 0 && count('call_scheduled') === 0) return bottleneck('reply_to_call', `${count('replied')} reply/replies, no calls scheduled.`, 'Prepare the close pack and propose a short call manually.', 'npm run studio:close-pack -- --id <lead-id>');
  if ((count('replied') + count('call_scheduled')) > 0 && count('proposal_ready') === 0) return bottleneck('advance_to_proposal', 'Advanced leads exist without a proposal ready.', 'Confirm scope and prepare the existing proposal.', 'npm run studio:close-pack -- --id <lead-id>');
  if (count('proposal_ready') > 0 && count('proposal_sent') === 0) return bottleneck('proposal_ready_not_sent', `${count('proposal_ready')} proposal(s) ready, none confirmed sent.`, 'Review one proposal and send it manually if approved.', 'npm run studio:close-pack -- --id <lead-id>');
  if (count('proposal_sent') > 0 && count('won') === 0 && count('lost') === 0) return bottleneck('proposal_to_decision', `${count('proposal_sent')} proposal(s) await a decision.`, 'Review proposal follow-ups.', 'npm run studio:followups');
  if (count('won') > 0 && !entries.some((entry) => entry.confirmedMrrUsd)) return bottleneck('won_without_recurring_offer', 'Won client(s) have no confirmed recurring revenue.', 'Confirm whether a recurring need and offer exist; record only explicit amounts.', null);
  return bottleneck('insufficient_activity', 'INSUFFICIENT DATA', 'Advance the highest-value existing lifecycle action.', 'npm run studio:daily -- --skip-discovery');
}

function weeklyActions(primary: ReturnType<typeof determineBottleneck>, entries: LifecycleEntry[]): string[] {
  return [
    `${primary.recommendedOperatorAction}${primary.exactExistingCommand ? ` Run: ${primary.exactExistingCommand}` : ''}`,
    ...entries.filter((entry) => ['replied', 'call_scheduled', 'proposal_ready', 'proposal_sent', 'contacted'].includes(entry.status))
      .slice(0, 4)
      .map((entry) => `${entry.businessName}: ${entry.nextAction}`),
  ];
}

function renderWeekly(report: ReturnType<typeof generateWeeklyReport>): string {
  return `# Studio Weekly Revenue Conversion

## Reporting period

${report.reportingPeriod.start} to ${report.reportingPeriod.end}

## Confirmed funnel events

${Object.entries(report.counts).map(([name, value]) => `- ${name}: ${value}`).join('\n')}

## Confirmed revenue

- Confirmed MRR: USD ${report.confirmedMrrUsd}
- Target minimum: USD 3,000
- Target upper range: USD 5,000
- Gap to minimum: USD ${report.gapToMinimumUsd}
- Gap to upper range: USD ${report.gapToUpperUsd}
- Confirmed one-time revenue: USD ${report.confirmedOneTimeRevenueUsd}

## Conversion rates

- Sent to reply: ${report.conversionRates.sentToReply}
- Reply to call: ${report.conversionRates.replyToCall}
- Proposal to win: ${report.conversionRates.proposalToWin}

## Conversion breakdowns

- By lead type: ${jsonInline(report.conversionByLeadType)}
- By source: ${jsonInline(report.conversionBySource)}
- By offer: ${jsonInline(report.conversionByOffer)}
- Median days between stages: ${report.medianStageDays}
- Stalled by stage: ${jsonInline(report.stalledByStage)}

## Primary bottleneck

- Stage: ${report.primaryBottleneck.stage}
- Evidence: ${report.primaryBottleneck.evidence}
- Operator action: ${report.primaryBottleneck.recommendedOperatorAction}
- Existing command: ${report.primaryBottleneck.exactExistingCommand ?? 'Manual action only'}

## Next seven days

${report.nextSevenDayActions.map((action) => `- ${action}`).join('\n') || '- INSUFFICIENT DATA'}

No outreach or proposal was sent. No revenue was inferred from proposals or won status.
`;
}

function safeRate(denominator: number, numerator: number): string {
  return denominator > 0 ? `${Math.round((numerator / denominator) * 100)}%` : 'INSUFFICIENT DATA';
}

function breakdown(events: MetricsEvent[], key: (event: MetricsEvent) => string): Record<string, Record<string, number>> {
  const output: Record<string, Record<string, number>> = {};
  for (const event of events) {
    const group = key(event);
    output[group] ??= {};
    output[group][event.event] = (output[group][event.event] ?? 0) + 1;
  }
  return output;
}

function countByStatus(entries: LifecycleEntry[]): Record<string, number> {
  const output: Record<string, number> = {};
  for (const entry of entries) output[entry.status] = (output[entry.status] ?? 0) + 1;
  return output;
}

function bottleneck(stage: string, evidence: string, recommendedOperatorAction: string, exactExistingCommand: string | null) {
  return { stage, evidence, recommendedOperatorAction, exactExistingCommand };
}

function contactHistory(entry: LifecycleEntry): string {
  return [
    entry.contactedAt ? `Contacted ${entry.contactedAt}` : null,
    entry.repliedAt ? `Replied ${entry.repliedAt}` : null,
    entry.proposalSentAt ? `Proposal sent ${entry.proposalSentAt}` : null,
  ].filter(Boolean).join('; ') || 'No confirmed external contact history.';
}

function offerReason(entry: LifecycleEntry, findings: CommercialFinding[]): string {
  if (entry.notes.some((note) => /\b(ongoing|monthly|maintenance|regression|retainer|reporting)\b/i.test(note))) {
    return 'An explicitly recorded recurring need supports the existing recurring offer.';
  }
  if (entry.notes.some((note) => /\b(implementation confirmed|specific implementation|build scope confirmed)\b/i.test(note))) {
    return 'A specific implementation scope was explicitly confirmed.';
  }
  return findings.length > 0
    ? 'Confirmed findings exist, but implementation and recurring needs still require discovery confirmation.'
    : 'Needs are not yet fully confirmed, so the smallest existing audit offer is appropriate.';
}

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let remaining = days;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const weekday = result.getDay();
    if (weekday !== 0 && weekday !== 6) remaining -= 1;
  }
  return result;
}

function businessDaysBetween(start: Date, end: Date): number {
  let count = 0;
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const finish = new Date(end);
  finish.setHours(0, 0, 0, 0);
  while (cursor < finish) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) count += 1;
  }
  return count;
}

function isFixture(entry: LifecycleEntry): boolean {
  return entry.leadId.startsWith('fixture_') || entry.leadId.startsWith('example_')
    || entry.leadId.startsWith('sample-') || /fixture|fictional|sample/i.test(entry.businessName);
}

function isEventFixture(event: MetricsEvent, entries: LifecycleEntry[]): boolean {
  const entry = entries.find((item) => item.leadId === event.leadId && item.leadType === event.leadType);
  return !entry || isFixture(entry);
}

function exists(relativePath: string): string | null {
  return fs.existsSync(path.join(process.cwd(), relativePath)) ? relativePath : null;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function jsonInline(value: unknown): string {
  return Object.keys(value as object).length > 0 ? JSON.stringify(value) : 'INSUFFICIENT DATA';
}

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function prune(historyDir: string, maximum: number): void {
  const files = fs.readdirSync(historyDir).sort();
  const stems = [...new Set(files.map((file) => file.replace(/\.(json|md)$/, '')))].sort();
  for (const stem of stems.slice(0, Math.max(0, stems.length - maximum))) {
    for (const extension of ['json', 'md']) {
      const filePath = path.join(historyDir, `${stem}.${extension}`);
      if (fs.existsSync(filePath)) fs.rmSync(filePath);
    }
  }
}
