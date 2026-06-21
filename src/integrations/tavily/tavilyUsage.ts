import crypto = require('crypto');
import fs = require('fs');
import path = require('path');
import type { TavilyUsageResponse } from './tavilyClient';

export interface TavilyLedgerEntry {
  timestamp: string;
  project: 'qa_studio' | 'website_studio';
  operation: 'search';
  estimatedCredits: number;
  actualCredits: number | null;
  queryHash: string;
  resultCount: number;
  requestId?: string;
}

export interface WebsiteBudgetInput {
  requestedQueries: number;
  planUsage: number | null;
  planLimit: number | null;
  websiteCreditsUsedToday: number;
  websiteCreditsUsedThisMonth: number;
  websiteDailyLimit: number;
  websiteMonthlyLimit: number;
  sharedThresholdPercent: number;
}

export interface WebsiteBudgetDecision {
  allowedQueries: number;
  decision: 'allowed' | 'blocked';
  reasons: string[];
  accountUsagePercent: number | null;
  creditsBeforeSharedThreshold: number;
  dailyRemaining: number;
  monthlyRemaining: number;
}

const LEDGER_PATH = path.join(process.cwd(), 'data', 'tavily', 'usage-ledger.json');

export function evaluateWebsiteTavilyBudget(input: WebsiteBudgetInput): WebsiteBudgetDecision {
  const reasons: string[] = [];
  const dailyRemaining = Math.max(0, input.websiteDailyLimit - input.websiteCreditsUsedToday);
  const monthlyRemaining = Math.max(0, input.websiteMonthlyLimit - input.websiteCreditsUsedThisMonth);
  let creditsBeforeSharedThreshold = 0;
  let accountUsagePercent: number | null = null;

  if (input.planUsage === null || input.planLimit === null || input.planLimit <= 0) {
    reasons.push('Live Tavily plan usage or plan limit is unavailable.');
  } else {
    accountUsagePercent = (input.planUsage / input.planLimit) * 100;
    const sharedCeiling = Math.floor(input.planLimit * (input.sharedThresholdPercent / 100));
    creditsBeforeSharedThreshold = Math.max(0, sharedCeiling - input.planUsage);
    if (input.planUsage >= input.planLimit) reasons.push('No remaining Tavily plan credits.');
    if (input.planUsage >= sharedCeiling) reasons.push(`Shared ${input.sharedThresholdPercent}% account threshold reached.`);
  }
  if (dailyRemaining <= 0) reasons.push('Website Studio daily Tavily limit reached.');
  if (monthlyRemaining <= 0) reasons.push('Website Studio monthly Tavily limit reached.');
  if (input.requestedQueries <= 0) reasons.push('No eligible Tavily queries requested.');

  const allowedQueries = reasons.length > 0
    ? 0
    : Math.max(0, Math.floor(Math.min(
      Math.floor(input.requestedQueries),
      dailyRemaining,
      monthlyRemaining,
      creditsBeforeSharedThreshold,
    )));
  if (allowedQueries <= 0 && reasons.length === 0) reasons.push('No credits are available within all active limits.');

  return {
    allowedQueries,
    decision: allowedQueries > 0 ? 'allowed' : 'blocked',
    reasons,
    accountUsagePercent,
    creditsBeforeSharedThreshold,
    dailyRemaining,
    monthlyRemaining,
  };
}

export function readTavilyLedger(): TavilyLedgerEntry[] {
  if (!fs.existsSync(LEDGER_PATH)) return [];
  const parsed = JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8')) as unknown;
  if (!Array.isArray(parsed)) throw new Error('Tavily usage ledger must be a JSON array.');
  return parsed as TavilyLedgerEntry[];
}

export function websiteUsageFromLedger(entries: TavilyLedgerEntry[], now = new Date()): {
  today: number;
  month: number;
} {
  const todayKey = localDateKey(now);
  const monthKey = todayKey.slice(0, 7);
  let today = 0;
  let month = 0;
  for (const entry of entries) {
    if (entry.project !== 'website_studio' || entry.operation !== 'search') continue;
    const entryDate = new Date(entry.timestamp);
    if (Number.isNaN(entryDate.getTime())) continue;
    const credits = entry.actualCredits ?? entry.estimatedCredits;
    const dateKey = localDateKey(entryDate);
    if (dateKey.slice(0, 7) === monthKey) month += credits;
    if (dateKey === todayKey) today += credits;
  }
  return { today, month };
}

export function appendTavilyLedgerEntry(entry: TavilyLedgerEntry): void {
  const entries = readTavilyLedger();
  if (entry.requestId && entries.some((existing) => existing.requestId === entry.requestId)) return;
  entries.push(entry);
  fs.mkdirSync(path.dirname(LEDGER_PATH), { recursive: true });
  writeJsonAtomic(LEDGER_PATH, entries);
}

export function queryHash(query: string): string {
  return crypto.createHash('sha256').update(normalizeQuery(query)).digest('hex');
}

export function usageDiscrepancyWarnings(
  usage: TavilyUsageResponse,
  entries: TavilyLedgerEntry[],
): string[] {
  const monthKey = localDateKey(new Date()).slice(0, 7);
  const estimatedTotal = entries.filter((entry) => {
    const timestamp = new Date(entry.timestamp);
    return !Number.isNaN(timestamp.getTime()) && localDateKey(timestamp).startsWith(monthKey);
  }).reduce(
    (total, entry) => total + (entry.actualCredits ?? entry.estimatedCredits),
    0,
  );
  if (
    usage.accountSearchUsage === null
    || entries.length === 0
    || usage.accountSearchUsage >= estimatedTotal
  ) return [];
  return ['Live Tavily search usage is lower than the local ledger total; live account usage remains authoritative.'];
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

function writeJsonAtomic(filePath: string, value: unknown): void {
  const temporary = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temporary, filePath);
}
