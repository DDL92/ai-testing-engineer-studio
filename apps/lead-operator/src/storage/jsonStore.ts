import fs = require('fs');
import path = require('path');
import { actionCockpitPath, clientsPath, closedLeadsPath, conversionsPath, dailySummaryPath, leadsPath, messageReviewQueuePath, opportunitiesPath, outreachHistoryPath, revenueSummaryPath, sourceQualityPath, sourcesPath, weeklyExecutiveDashboardPath } from '../config/paths';
import { ClientRecord, ClosedLeadRecord, ConversionRecord, DailySummary, Lead, LeadSource, Opportunity, OutreachRecord } from '../types/lead';

export function ensureLeadDataFiles(): void {
  fs.mkdirSync(path.dirname(leadsPath), { recursive: true });
  ensureJsonFile(leadsPath, []);
  ensureJsonFile(opportunitiesPath, []);
  ensureJsonFile(outreachHistoryPath, []);
  ensureJsonFile(conversionsPath, []);
  ensureJsonFile(clientsPath, []);
  ensureJsonFile(closedLeadsPath, []);
  ensureJsonFile(revenueSummaryPath, {});
  ensureJsonFile(weeklyExecutiveDashboardPath, {});
  ensureJsonFile(actionCockpitPath, {});
  ensureJsonFile(messageReviewQueuePath, {});
  ensureJsonFile(sourceQualityPath, {});
  ensureJsonFile(dailySummaryPath, emptySummary());
  ensureJsonFile(sourcesPath, defaultSources());
}

export function readLeads(): Lead[] {
  ensureLeadDataFiles();
  return readJson<Lead[]>(leadsPath, []);
}

export function writeLeads(leads: Lead[]): void {
  writeJson(leadsPath, leads);
}

export function readOpportunities(): Opportunity[] {
  ensureLeadDataFiles();
  return readJson<Opportunity[]>(opportunitiesPath, []);
}

export function writeOpportunities(opportunities: Opportunity[]): void {
  writeJson(opportunitiesPath, opportunities);
}

export function readSources(): LeadSource[] {
  ensureLeadDataFiles();
  return readJson<LeadSource[]>(sourcesPath, []);
}

export function writeDailySummary(summary: DailySummary): void {
  writeJson(dailySummaryPath, summary);
}

export function readOutreachHistory(): OutreachRecord[] {
  ensureLeadDataFiles();
  return readJson<OutreachRecord[]>(outreachHistoryPath, []);
}

export function writeOutreachHistory(records: OutreachRecord[]): void {
  writeJson(outreachHistoryPath, records);
}

export function readConversions(): ConversionRecord[] {
  ensureLeadDataFiles();
  return readJson<ConversionRecord[]>(conversionsPath, []);
}

export function writeConversions(records: ConversionRecord[]): void {
  writeJson(conversionsPath, records);
}

export function readClients(): ClientRecord[] {
  ensureLeadDataFiles();
  return readJson<ClientRecord[]>(clientsPath, []);
}

export function writeClients(records: ClientRecord[]): void {
  writeJson(clientsPath, records);
}

export function readClosedLeads(): ClosedLeadRecord[] {
  ensureLeadDataFiles();
  return readJson<ClosedLeadRecord[]>(closedLeadsPath, []);
}

export function writeClosedLeads(records: ClosedLeadRecord[]): void {
  writeJson(closedLeadsPath, records);
}

export function writeRevenueSummary(summary: unknown): void {
  writeJson(revenueSummaryPath, summary);
}

export function writeWeeklyExecutiveDashboard(summary: unknown): void {
  writeJson(weeklyExecutiveDashboardPath, summary);
}

export function readActionCockpit<T>(fallback: T): T {
  ensureLeadDataFiles();
  return readJson<T>(actionCockpitPath, fallback);
}

export function writeActionCockpit(summary: unknown): void {
  writeJson(actionCockpitPath, summary);
}

export function readMessageReviewQueue<T>(fallback: T): T {
  ensureLeadDataFiles();
  return readJson<T>(messageReviewQueuePath, fallback);
}

export function writeMessageReviewQueue(summary: unknown): void {
  writeJson(messageReviewQueuePath, summary);
}

export function readSourceQualityReport<T>(fallback: T): T {
  ensureLeadDataFiles();
  return readJson<T>(sourceQualityPath, fallback);
}

export function writeSourceQualityReport(summary: unknown): void {
  writeJson(sourceQualityPath, summary);
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function ensureJsonFile(filePath: string, value: unknown): void {
  if (!fs.existsSync(filePath)) writeJson(filePath, value);
}

function emptySummary(): DailySummary {
  return {
    generatedAt: new Date().toISOString(),
    sourcesChecked: 0,
    opportunitiesFound: 0,
    hotLeads: 0,
    warmLeads: 0,
    ignoredLeads: 0,
    hotLeadsNeedingApproval: [],
    warmLeadsWorthReviewing: [],
    auditCompletedNoProposal: [],
    contactedNeedingFollowUp: [],
    missingWebsiteOrContactInfo: [],
    topRecommendedActions: [],
    suggestedMessagesReadyForApproval: [],
    warnings: ['Run npm run lead:auto to check configured public sources.'],
    nextSteps: ['Configure public sources in data/leads/sources.json.'],
  };
}

function defaultSources(): LeadSource[] {
  return [
    {
      id: 'manual-seed',
      name: 'Manual Seed List',
      type: 'manual_json',
      path: 'data/leads/manual-seed.example.json',
      enabled: false,
      notes: 'Enable after adding a local seed file. No outreach is sent automatically.',
    },
    {
      id: 'remoteok-qa-rss',
      name: 'Remote OK QA Jobs RSS',
      type: 'rss',
      url: 'https://remoteok.com/remote-qa-jobs.rss',
      enabled: true,
      notes: 'Public RSS feed for remote QA roles. Disable if results are noisy.',
    },
    {
      id: 'weworkremotely-programming-rss',
      name: 'We Work Remotely Programming RSS',
      type: 'rss',
      url: 'https://weworkremotely.com/categories/remote-programming-jobs.rss',
      enabled: true,
      notes: 'Public RSS feed. The scorer filters for QA, automation, SaaS, CI/CD, and web app signals.',
    },
  ];
}
