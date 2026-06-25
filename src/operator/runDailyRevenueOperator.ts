import childProcess = require('child_process');
import fs = require('fs');
import path = require('path');
import { buildContactAwareRotation, readContactAwareState } from '../contactAwareRotation/rotationRules';
import { ContactAwareRotationReport } from '../contactAwareRotation/types';
import { notifyDailyPlan, notifyFailure } from '../notifications/notifyDailyPlan';
import { loadOutreachRecords } from '../outreachTracking/outreachTrackingRules';
import { readWebsiteLeads } from '../websiteStudio/leadAdapter';
import { buildWebsiteRanking, writeWebsiteRanking } from '../websiteStudio/rankingWorkflow';
import {
  buildDailyRevenuePlan,
  DailyRunHealth,
  preparationRecurrence,
  writeDailyRevenuePlanOutputs,
  writeDailyRunState,
} from './dailyRevenueOperatorRules';

const qaCacheMs = 7 * 24 * 60 * 60 * 1000;
const websiteCacheMs = 24 * 60 * 60 * 1000;
const websiteRankingPath = path.join(process.cwd(), 'output', 'website-studio', 'lead-ranking.json');

export interface DailyOperatorDependencies {
  now?: Date;
  refresh?: boolean;
  runModule?: (relativeFile: string, args?: string[]) => void;
  notify?: typeof notifyDailyPlan;
  autoOpen?: boolean;
}

export async function runDailyRevenueOperator(
  dependencies: DailyOperatorDependencies = {},
): Promise<{ plan: ReturnType<typeof buildDailyRevenuePlan>; health: DailyRunHealth }> {
  const started = dependencies.now ?? new Date();
  const refresh = dependencies.refresh ?? false;
  const modulesExecuted: string[] = [];
  const modulesReusedFromCache: string[] = [];
  const cachesBypassed: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const runModule = dependencies.runModule ?? runLocalModule;
  const previousState = readDailyRunState();
  const previousRecurrence = previousState?.preparationRecurrence ?? {};
  const recurringPreparation = Object.values(previousRecurrence).some((count) => count >= 2);

  const cachedQaRotation = readContactAwareState();
  let qaRotation = cachedQaRotation;
  if (refresh) {
    runRefreshModule(runModule, 'QA daily lead discovery', 'src/dailyLeadDiscovery/runDailyDiscovery.ts', [], modulesExecuted, warnings);
    runRefreshModule(runModule, 'QA lead rotation', 'src/leadRotation/rotateLeadCandidates.ts', [], modulesExecuted, warnings);
    cachesBypassed.push('QA lead discovery', 'QA contact discovery');
  }
  if (refresh || !qaRotation || !isFresh(qaRotation.generatedAt, started, qaCacheMs)) {
    try {
      const refreshed = await buildContactAwareRotation({ maxLeads: 10, refresh });
      qaRotation = preferCachedRotation(refreshed, cachedQaRotation);
      if (refreshed.status === 'SEARCH_UNAVAILABLE' && qaRotation !== refreshed) {
        warnings.push('QA contact search was unavailable; the previous cached rotation was reused.');
      }
      modulesExecuted.push('contact-aware QA rotation');
    } catch (error) {
      warnings.push(`QA contact refresh failed; cached state reused when available: ${message(error)}`);
    }
  } else {
    modulesReusedFromCache.push('contact-aware QA rotation');
  }
  qaRotation = normalizeRotation(qaRotation);

  const websiteLeads = readWebsiteLeads();
  let websiteRanking = buildWebsiteRanking(websiteLeads);
  if (refresh) {
    try {
      runModule('src/websiteStudio/daily.ts', ['--refresh']);
      modulesExecuted.push('Website Studio daily refresh');
      cachesBypassed.push('Website Studio lead discovery');
      websiteRanking = buildWebsiteRanking(readWebsiteLeads());
    } catch (error) {
      warnings.push(`Website discovery failed; cached leads reused: ${message(error)}`);
    }
  } else if (isFileFresh(websiteRankingPath, started, websiteCacheMs)) {
    modulesReusedFromCache.push('Website Studio ranking');
  } else {
    warnings.push('Website Studio ranking is older than 24 hours; cached leads were reused. Pass --refresh for public discovery.');
    writeWebsiteRanking(websiteRanking);
    modulesReusedFromCache.push('Website Studio stored leads');
  }

  let plan = buildDailyRevenuePlan({
    now: started,
    outreachRecords: loadOutreachRecords(),
    qaRotation,
    websiteLeads: readWebsiteLeads(),
    websiteRanking,
    recurrenceCounts: previousRecurrence,
  });

  const shouldAutoRefresh = !refresh && shouldTriggerAutomaticRefresh(plan, recurringPreparation);
  if (shouldAutoRefresh) {
    warnings.push('Low commercial readiness or recurring preparation work triggered one bounded discovery refresh.');
    runRefreshModule(runModule, 'QA daily lead discovery', 'src/dailyLeadDiscovery/runDailyDiscovery.ts', [], modulesExecuted, warnings);
    runRefreshModule(runModule, 'QA lead rotation', 'src/leadRotation/rotateLeadCandidates.ts', [], modulesExecuted, warnings);
    cachesBypassed.push('QA lead discovery', 'QA contact discovery', 'Website Studio lead discovery');
    try {
      qaRotation = preferCachedRotation(
        await buildContactAwareRotation({ maxLeads: 10, refresh: true }),
        qaRotation,
      );
      modulesExecuted.push('contact-aware QA rotation auto-refresh');
    } catch (error) {
      warnings.push(`Automatic QA contact refresh failed: ${message(error)}`);
    }
    try {
      runModule('src/websiteStudio/daily.ts', ['--refresh']);
      modulesExecuted.push('Website Studio automatic refresh');
    } catch (error) {
      warnings.push(`Automatic Website discovery failed: ${message(error)}`);
    }
    const refreshedWebsiteLeads = readWebsiteLeads();
    plan = buildDailyRevenuePlan({
      now: started,
      outreachRecords: loadOutreachRecords(),
      qaRotation: normalizeRotation(qaRotation),
      websiteLeads: refreshedWebsiteLeads,
      websiteRanking: buildWebsiteRanking(refreshedWebsiteLeads),
      recurrenceCounts: previousRecurrence,
    });
  }
  writeDailyRevenuePlanOutputs(plan);
  modulesExecuted.push('daily action selection');

  for (const [label, file] of [
    ['outcome dashboard', 'src/outcomeTracking/generateOutcomeDashboard.ts'],
    ['outreach follow-up plan', 'src/outreachExecution/generateFollowUpPlan.ts'],
    ['outreach status', 'src/outreachTracking/generateOutreachStatus.ts'],
    ['dashboard generation', 'src/dashboard/generateDashboard.ts'],
  ] as const) {
    try {
      runModule(file);
      modulesExecuted.push(label);
    } catch (error) {
      warnings.push(`${label} failed: ${message(error)}`);
    }
  }

  const notify = dependencies.notify ?? notifyDailyPlan;
  const notificationResult = notify(plan);
  if (!notificationResult.succeeded) warnings.push('Local notification failed; plan files remain available.');
  if ((dependencies.autoOpen ?? process.env.STUDIO_AUTO_OPEN_DAILY_PLAN === 'true')) {
    try {
      childProcess.execFileSync('/usr/bin/open', [path.join(process.cwd(), 'output', 'operator', 'daily-revenue-plan.md')], { stdio: 'ignore' });
      modulesExecuted.push('daily plan auto-open');
    } catch (error) {
      warnings.push(`Auto-open failed: ${message(error)}`);
    }
  }

  const completed = new Date();
  const health: DailyRunHealth = {
    startedAt: started.toISOString(),
    completedAt: completed.toISOString(),
    durationMs: Math.max(0, completed.getTime() - started.getTime()),
    modulesExecuted,
    modulesReusedFromCache,
    cachesBypassed: [...new Set(cachesBypassed)],
    searchProviderStatus: qaRotation.status === 'SEARCH_UNAVAILABLE' ? 'unavailable; cached/local data used' : 'available or not required',
    warnings,
    errors,
    notificationSucceeded: notificationResult.succeeded,
    notificationDiagnostics: notificationResult,
    preparationRecurrence: {},
    nextScheduledRun: nextMorning(started, 7, 30),
  };
  writeDailyRunState(plan, {
    ...health,
    preparationRecurrence: updatePreparationRecurrence(previousRecurrence, plan),
  });
  return { plan, health };
}

async function main(): Promise<void> {
  const refresh = process.argv.slice(2).includes('--refresh');
  try {
    const result = await runDailyRevenueOperator({ refresh });
    console.log(`Daily revenue operator complete: ${result.plan.status}; ${result.plan.selectedActions.length} action(s); ${result.plan.estimatedTotalMinutes} minute(s).`);
    console.log(`QA: ${result.plan.qaActions.length}; Website: ${result.plan.websiteActions.length}; Follow-ups: ${result.plan.followUpActions.length}.`);
    console.log('No external outreach or follow-up was sent.');
  } catch (error) {
    notifyFailure();
    console.error(message(error));
    process.exitCode = 1;
  }
}

function runLocalModule(relativeFile: string, args: string[] = []): void {
  childProcess.execFileSync(process.execPath, ['--import', 'tsx', path.join(process.cwd(), relativeFile), ...args], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });
}

function runRefreshModule(
  runModule: (relativeFile: string, args?: string[]) => void,
  label: string,
  file: string,
  args: string[],
  modulesExecuted: string[],
  warnings: string[],
): void {
  try {
    runModule(file, args);
    modulesExecuted.push(label);
  } catch (error) {
    warnings.push(`${label} failed: ${message(error)}`);
  }
}

interface StoredDailyRunState {
  preparationRecurrence?: Record<string, number>;
}

function readDailyRunState(): StoredDailyRunState | null {
  const filePath = path.join(process.cwd(), 'data', 'operator', 'daily-run-state.json');
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as StoredDailyRunState;
  } catch {
    return null;
  }
}

function updatePreparationRecurrence(
  previous: Record<string, number>,
  plan: ReturnType<typeof buildDailyRevenuePlan>,
): Record<string, number> {
  const current = preparationRecurrence(plan);
  return Object.fromEntries(Object.keys(current).map((company) => [company, (previous[company] ?? 0) + 1]));
}

function normalizeRotation(report: ContactAwareRotationReport | null): ContactAwareRotationReport {
  if (!report) {
    return {
      generatedAt: new Date(0).toISOString(),
      status: 'NO_CONTACT_READY_LEAD',
      readyLeads: [],
      evaluatedLeads: [],
      skippedLeads: [],
      nextManualAction: 'No QA contact rotation state is available.',
      safetyRules: [],
    };
  }
  return {
    ...report,
    readyLeads: report.readyLeads ?? report.evaluatedLeads.filter((lead) => lead.contactStatus === 'READY').slice(0, 3),
  };
}

export function preferCachedRotation(
  refreshed: ContactAwareRotationReport,
  cached: ContactAwareRotationReport | null,
): ContactAwareRotationReport {
  if (refreshed.status !== 'SEARCH_UNAVAILABLE' || !cached) return refreshed;
  return normalizeRotation(cached);
}

export function shouldTriggerAutomaticRefresh(
  plan: ReturnType<typeof buildDailyRevenuePlan>,
  recurringPreparation: boolean,
): boolean {
  return plan.actionCounts.commerciallyReady < 3
    || plan.actionCounts.preparationActions > plan.actionCounts.commerciallyReady
    || recurringPreparation;
}

function isFresh(value: string, now: Date, maxAgeMs: number): boolean {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && now.getTime() - timestamp <= maxAgeMs;
}

function isFileFresh(filePath: string, now: Date, maxAgeMs: number): boolean {
  if (!fs.existsSync(filePath)) return false;
  return now.getTime() - fs.statSync(filePath).mtimeMs <= maxAgeMs;
}

function nextMorning(now: Date, hour: number, minute: number): string {
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.toISOString();
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

if (require.main === module) void main();
