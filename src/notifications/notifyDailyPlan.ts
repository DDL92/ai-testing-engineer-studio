import childProcess = require('child_process');
import fs = require('fs');
import path = require('path');
import { DailyRunHealth, renderHealth } from '../operator/dailyRevenueOperatorRules';
import { DailyRevenuePlan } from '../operator/types';

const planPath = path.join(process.cwd(), 'output', 'operator', 'daily-revenue-plan.json');
const statePath = path.join(process.cwd(), 'data', 'operator', 'daily-run-state.json');
const healthPath = path.join(process.cwd(), 'output', 'operator', 'operator-health.md');

export interface NotificationResult {
  succeeded: boolean;
  attemptedCommand: string;
  exitCode: number | null;
  sanitizedStderr: string;
  nonInteractiveSession: boolean;
}

export function notifyDailyPlan(
  plan: DailyRevenuePlan,
  execute: (command: string, args: string[]) => void = defaultExecute,
): NotificationResult {
  const body = plan.status === 'READY'
    ? `Daily plan ready: ${plan.selectedActions.length} actions, estimated ${plan.estimatedTotalMinutes} minutes.`
    : plan.status === 'PARTIAL'
      ? `Daily plan ready: ${plan.selectedActions.length} usable actions. Review blockers.`
      : 'Daily operator completed with no usable actions. Review blockers.';
  const command = '/usr/bin/osascript';
  const args = [
      '-l',
      'JavaScript',
      '-e',
      notificationScript(body),
    ];
  try {
    execute(command, args);
    return diagnostics(true, command, null, '');
  } catch (error) {
    const failure = error as NodeJS.ErrnoException & { status?: number; stderr?: Buffer | string };
    return diagnostics(
      false,
      command,
      typeof failure.status === 'number' ? failure.status : null,
      sanitizeStderr(failure.stderr ?? failure.message),
    );
  }
}

export function notifyFailure(
  execute: (command: string, args: string[]) => void = defaultExecute,
): NotificationResult {
  try {
    execute('/usr/bin/osascript', [
      '-l',
      'JavaScript',
      '-e',
      notificationScript('Daily operator failed. Check local logs.'),
    ]);
    return diagnostics(true, '/usr/bin/osascript', null, '');
  } catch (error) {
    const failure = error as NodeJS.ErrnoException & { status?: number; stderr?: Buffer | string };
    return diagnostics(
      false,
      '/usr/bin/osascript',
      typeof failure.status === 'number' ? failure.status : null,
      sanitizeStderr(failure.stderr ?? failure.message),
    );
  }
}

function main(): void {
  if (!fs.existsSync(planPath)) throw new Error('Daily revenue plan does not exist. Run npm run day:plan first.');
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8')) as DailyRevenuePlan;
  const result = notifyDailyPlan(plan);
  persistNotificationDiagnostics(plan, result);
  console.log(result.succeeded ? 'Local daily plan notification shown.' : 'Local notification failed; the generated plan was preserved.');
  if (!result.succeeded) {
    console.log(`Attempted command: ${result.attemptedCommand}`);
    console.log(`Exit code: ${result.exitCode ?? 'unknown'}`);
    console.log(`Sanitized stderr: ${result.sanitizedStderr || 'none'}`);
    console.log(`Non-interactive session: ${result.nonInteractiveSession ? 'yes' : 'no'}`);
  }
}

function notificationScript(body: string): string {
  return [
    'const app = Application.currentApplication();',
    'app.includeStandardAdditions = true;',
    `app.displayNotification(${JSON.stringify(body)}, {withTitle: ${JSON.stringify('AI Testing Engineer Studio')}});`,
  ].join(' ');
}

function defaultExecute(command: string, args: string[]): void {
  childProcess.execFileSync(command, args, { stdio: ['ignore', 'ignore', 'pipe'] });
}

function persistNotificationDiagnostics(plan: DailyRevenuePlan, result: NotificationResult): void {
  if (!fs.existsSync(statePath)) return;
  try {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8')) as DailyRunHealth & { plan: DailyRevenuePlan };
    state.notificationSucceeded = result.succeeded;
    state.notificationDiagnostics = result;
    if (!result.succeeded && !state.warnings.includes('Local notification failed; plan files remain available.')) {
      state.warnings.push('Local notification failed; plan files remain available.');
    }
    fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
    fs.writeFileSync(healthPath, renderHealth(plan, state), 'utf8');
  } catch {
    // The notification result is still printed; malformed prior state must not damage the plan.
  }
}

function diagnostics(
  succeeded: boolean,
  attemptedCommand: string,
  exitCode: number | null,
  sanitizedStderr: string,
): NotificationResult {
  return {
    succeeded,
    attemptedCommand,
    exitCode,
    sanitizedStderr,
    nonInteractiveSession: !process.stdout.isTTY || !process.env.TERM,
  };
}

function sanitizeStderr(value: Buffer | string | undefined): string {
  return String(value ?? '')
    .replace(/(?:api[_-]?key|token|password|secret)=\S+/gi, '[redacted]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

if (require.main === module) main();
