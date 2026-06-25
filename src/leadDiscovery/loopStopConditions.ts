import type { LoopState } from './loopStateTypes';

export const STOP_EMPTY_RUNS = 5;
export const STOP_PROVIDER_FAILURES = 5;
export const STOP_NO_DELIVERY = 10;
export const STOP_DURATION_MINUTES = 30;

export type StopReason =
  | 'too_many_empty_runs'
  | 'too_many_provider_failures'
  | 'too_many_no_delivery_runs'
  | 'max_duration_reached';

export function getStopReasons(state: LoopState): StopReason[] {
  const reasons: StopReason[] = [];
  if (state.consecutiveEmptyRuns >= STOP_EMPTY_RUNS) reasons.push('too_many_empty_runs');
  if (state.consecutiveProviderFailures >= STOP_PROVIDER_FAILURES) reasons.push('too_many_provider_failures');
  if (state.consecutiveNoDeliveryRuns >= STOP_NO_DELIVERY) reasons.push('too_many_no_delivery_runs');
  if (state.lastLoopDurationMs >= STOP_DURATION_MINUTES * 60 * 1000) reasons.push('max_duration_reached');
  return reasons;
}

export function shouldStopLoop(state: LoopState): boolean {
  return getStopReasons(state).length > 0;
}

export function recommendationsForStopReasons(reasons: StopReason[]): string[] {
  const recommendations = reasons.map((reason) => {
    if (reason === 'too_many_empty_runs') return 'Run fixture simulation and inspect query/intent filters before resuming.';
    if (reason === 'too_many_provider_failures') return 'Keep external search paused and verify provider health manually before resuming.';
    if (reason === 'too_many_no_delivery_runs') return 'Review buyer-role and delivery thresholds with golden dataset before resuming.';
    return 'Split the loop into smaller manual batches and require approval before resuming.';
  });
  return recommendations.length ? recommendations : ['Loop can continue with current local guardrails.'];
}
