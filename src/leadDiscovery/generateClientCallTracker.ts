import fs = require('fs');
import path = require('path');

export type ClientCallStatus =
  | 'not_contacted'
  | 'meeting_scheduled'
  | 'meeting_completed'
  | 'pilot_proposed'
  | 'waiting_response'
  | 'closed_won'
  | 'closed_lost';

interface ClientCallRecord {
  clientName: string;
  contactPerson: string;
  meetingDate: string;
  interestLevel: 'unknown' | 'low' | 'medium' | 'high';
  budgetFit: 'unknown' | 'low' | 'medium' | 'high';
  leadTarget: string;
  pilotPrice: string;
  decisionStatus: ClientCallStatus;
  nextAction: string;
  followUpDate: string;
  closeProbability: number;
}

interface CloseChecklistItem {
  item: string;
  status: 'ready' | 'pending';
  notes: string;
}

interface FollowUpAction {
  clientName: string;
  action: string;
  dueDate: string;
  owner: string;
  status: 'pending' | 'done';
  safetyNote: string;
}

interface ClientCallTracker {
  generatedAt: string;
  records: ClientCallRecord[];
  closeChecklist: CloseChecklistItem[];
  followUpActions: FollowUpAction[];
  safetyRules: string[];
}

interface CommercialPipelineSummary {
  activeOpportunities: number;
  pilotProposed: number;
  waitingResponse: number;
  closeProbability: number;
  nextFollowUp: string;
  nextCommercialAction: string;
}

const outputDir = path.join(process.cwd(), 'output', 'commercial');
const trackerMarkdownPath = path.join(outputDir, 'client-call-tracker.md');
const trackerJsonPath = path.join(outputDir, 'client-call-tracker.json');
const closeChecklistPath = path.join(outputDir, 'flora-close-checklist.md');
const followUpActionsPath = path.join(outputDir, 'flora-follow-up-actions.md');

const safetyRules = [
  'Local commercial tracking only.',
  'No Tavily, providers, network calls, browser automation, login, scraping, contact extraction, outreach, emails, DMs, calls, or forms are used.',
  'Follow-up actions are manual reminders only and are not sent automatically.',
  'Deal status is a planning estimate, not a revenue guarantee.',
];

export function generateClientCallTracker(now = new Date()): ClientCallTracker {
  const tracker = buildClientCallTracker(now);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(trackerMarkdownPath, renderTracker(tracker), 'utf8');
  fs.writeFileSync(trackerJsonPath, `${JSON.stringify(tracker, null, 2)}\n`, 'utf8');
  fs.writeFileSync(closeChecklistPath, renderCloseChecklist(tracker.closeChecklist), 'utf8');
  fs.writeFileSync(followUpActionsPath, renderFollowUpActions(tracker.followUpActions), 'utf8');

  return tracker;
}

export function getCommercialPipelineSummary(): CommercialPipelineSummary {
  const tracker = readTracker();
  const records = tracker?.records ?? [];
  const activeRecords = records.filter((record) => !['closed_won', 'closed_lost'].includes(record.decisionStatus));
  const nextRecord = activeRecords
    .filter((record) => record.followUpDate !== 'TBD')
    .sort((a, b) => a.followUpDate.localeCompare(b.followUpDate))[0] ?? activeRecords[0];

  return {
    activeOpportunities: activeRecords.length,
    pilotProposed: records.filter((record) => record.decisionStatus === 'pilot_proposed').length,
    waitingResponse: records.filter((record) => record.decisionStatus === 'waiting_response').length,
    closeProbability: average(activeRecords.map((record) => record.closeProbability)),
    nextFollowUp: nextRecord?.followUpDate ?? 'TBD',
    nextCommercialAction: nextRecord?.nextAction ?? 'Generate call tracker and schedule manual commercial review.',
  };
}

function buildClientCallTracker(now: Date): ClientCallTracker {
  const followUpDate = isoDate(addDays(now, 2));
  const records: ClientCallRecord[] = [
    {
      clientName: 'Flora and Fauna Foods',
      contactPerson: 'TBD',
      meetingDate: 'TBD',
      interestLevel: 'unknown',
      budgetFit: 'unknown',
      leadTarget: '10-15 reviewed catering/event opportunities',
      pilotPrice: '$250-$500',
      decisionStatus: 'not_contacted',
      nextAction: 'Manually schedule or complete Flora discovery call; do not automate outreach.',
      followUpDate,
      closeProbability: 20,
    },
  ];

  return {
    generatedAt: now.toISOString(),
    records,
    closeChecklist: [
      { item: 'Meeting prep pack reviewed', status: 'ready', notes: 'Pitch, agenda, objections, closing questions, and follow-up drafts are generated.' },
      { item: 'Offer pack ready', status: 'ready', notes: 'Pricing, deliverables, lead definitions, exclusions, and terms are generated.' },
      { item: 'Pilot delivery boundaries explained', status: 'ready', notes: 'Manual-review only; no automated contact.' },
      { item: 'Flora success criteria captured', status: 'pending', notes: 'Confirm during the client call.' },
      { item: 'Decision maker identified', status: 'pending', notes: 'Record after human conversation.' },
      { item: 'Pilot price accepted', status: 'pending', notes: 'Confirm whether $250-$500 fits the pilot budget.' },
      { item: 'Next manual follow-up date set', status: 'ready', notes: `Default follow-up reminder: ${followUpDate}.` },
    ],
    followUpActions: [
      {
        clientName: 'Flora and Fauna Foods',
        action: 'Review meeting prep and decide whether to manually request a Flora pilot conversation.',
        dueDate: followUpDate,
        owner: 'Daniel',
        status: 'pending',
        safetyNote: 'Manual action only. No outreach automation.',
      },
      {
        clientName: 'Flora and Fauna Foods',
        action: 'After any call, update contact person, meeting date, interest level, budget fit, decision status, and next action.',
        dueDate: 'After meeting',
        owner: 'Daniel',
        status: 'pending',
        safetyNote: 'Record only real conversation outcomes.',
      },
      {
        clientName: 'Flora and Fauna Foods',
        action: 'If pilot is verbally accepted, prepare final pilot scope and payment terms for manual review.',
        dueDate: 'After verbal interest',
        owner: 'Daniel',
        status: 'pending',
        safetyNote: 'Preparation only; no invoice or contract is sent automatically.',
      },
    ],
    safetyRules,
  };
}

function renderTracker(tracker: ClientCallTracker): string {
  return `# Client Call Tracker

Generated: ${tracker.generatedAt}

## Pipeline

| Client | Contact person | Meeting date | Interest | Budget fit | Lead target | Pilot price | Decision status | Next action | Follow-up date | Close probability |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---: |
${tracker.records.map((record) => `| ${record.clientName} | ${record.contactPerson} | ${record.meetingDate} | ${record.interestLevel} | ${record.budgetFit} | ${record.leadTarget} | ${record.pilotPrice} | ${record.decisionStatus} | ${record.nextAction} | ${record.followUpDate} | ${record.closeProbability}% |`).join('\n')}

## Commercial Pipeline Summary

${renderPipelineSummary(getSummaryFromRecords(tracker.records))}

## Safety Rules

${tracker.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

function renderCloseChecklist(items: CloseChecklistItem[]): string {
  return `# Flora Pilot Close Checklist

| Item | Status | Notes |
| --- | --- | --- |
${items.map((item) => `| ${item.item} | ${item.status} | ${item.notes} |`).join('\n')}

Manual-review only. No outreach, emails, DMs, calls, forms, providers, Tavily, scraping, or contact extraction are performed.
`;
}

function renderFollowUpActions(actions: FollowUpAction[]): string {
  return `# Flora Follow-Up Actions

| Client | Action | Due date | Owner | Status | Safety note |
| --- | --- | --- | --- | --- | --- |
${actions.map((action) => `| ${action.clientName} | ${action.action} | ${action.dueDate} | ${action.owner} | ${action.status} | ${action.safetyNote} |`).join('\n')}
`;
}

function renderPipelineSummary(summary: CommercialPipelineSummary): string {
  return `- Active opportunities: ${summary.activeOpportunities}
- Pilot proposed: ${summary.pilotProposed}
- Waiting response: ${summary.waitingResponse}
- Close probability: ${summary.closeProbability.toFixed(0)}%
- Next follow-up: ${summary.nextFollowUp}
- Next commercial action: ${summary.nextCommercialAction}`;
}

function getSummaryFromRecords(records: ClientCallRecord[]): CommercialPipelineSummary {
  const activeRecords = records.filter((record) => !['closed_won', 'closed_lost'].includes(record.decisionStatus));
  const nextRecord = activeRecords
    .filter((record) => record.followUpDate !== 'TBD')
    .sort((a, b) => a.followUpDate.localeCompare(b.followUpDate))[0] ?? activeRecords[0];
  return {
    activeOpportunities: activeRecords.length,
    pilotProposed: records.filter((record) => record.decisionStatus === 'pilot_proposed').length,
    waitingResponse: records.filter((record) => record.decisionStatus === 'waiting_response').length,
    closeProbability: average(activeRecords.map((record) => record.closeProbability)),
    nextFollowUp: nextRecord?.followUpDate ?? 'TBD',
    nextCommercialAction: nextRecord?.nextAction ?? 'No active commercial action.',
  };
}

function readTracker(): ClientCallTracker | null {
  if (!fs.existsSync(trackerJsonPath)) return null;
  return JSON.parse(fs.readFileSync(trackerJsonPath, 'utf8')) as ClientCallTracker;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

if (require.main === module) {
  generateClientCallTracker();
  console.log(`Generated client call tracker: ${path.relative(process.cwd(), trackerMarkdownPath)}, ${path.relative(process.cwd(), trackerJsonPath)}, ${path.relative(process.cwd(), closeChecklistPath)}, ${path.relative(process.cwd(), followUpActionsPath)}`);
}
