import fs = require('fs');
import path = require('path');
import { defaultLoopState, LoopState, LoopStateUpdate } from './loopStateTypes';

export const loopStatePath = path.join(process.cwd(), 'runtime', 'lead-discovery', 'loop-state.json');

export function loadLoopState(): LoopState {
  if (!fs.existsSync(loopStatePath)) return { ...defaultLoopState };
  try {
    return { ...defaultLoopState, ...(JSON.parse(fs.readFileSync(loopStatePath, 'utf8')) as Partial<LoopState>) };
  } catch {
    return { ...defaultLoopState };
  }
}

export function saveLoopState(state: LoopState): LoopState {
  fs.mkdirSync(path.dirname(loopStatePath), { recursive: true });
  fs.writeFileSync(loopStatePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  return state;
}

export function updateLoopState(update: LoopStateUpdate, existing = loadLoopState()): LoopState {
  const runAt = update.runAt ?? new Date().toISOString();
  const deliveryCount = update.deliveryCount ?? existing.lastDeliveryCount;
  const outcome = update.outcome ?? outcomeFor(update, deliveryCount);
  const state: LoopState = {
    ...existing,
    lastRunAt: runAt,
    lastSuccessfulRunAt: update.successful ? runAt : existing.lastSuccessfulRunAt,
    lastProvider: update.provider ?? existing.lastProvider,
    lastProviderHealth: update.providerHealth ?? existing.lastProviderHealth,
    lastDeliveryCount: deliveryCount,
    lastVerificationCount: update.verificationCount ?? existing.lastVerificationCount,
    lastReviewCount: update.reviewCount ?? existing.lastReviewCount,
    lastCreditsEstimate: update.creditsEstimate ?? existing.lastCreditsEstimate,
    lastLoopDurationMs: update.loopDurationMs ?? existing.lastLoopDurationMs,
    lastLoopOutcome: outcome,
  };
  return saveLoopState(updateCounters(state, update, deliveryCount));
}

export function resetLoopFailureCounters(existing = loadLoopState()): LoopState {
  return saveLoopState({
    ...existing,
    consecutiveFailures: 0,
    consecutiveEmptyRuns: 0,
    consecutiveNoDeliveryRuns: 0,
    consecutiveProviderFailures: 0,
    paused: false,
    pauseReasons: [],
    recommendations: [],
    humanApprovalRequired: false,
    lastLoopOutcome: existing.lastLoopOutcome === 'paused' ? 'recovered' : existing.lastLoopOutcome,
  });
}

export function incrementFailureCounters(existing = loadLoopState(), failureType: 'failure' | 'empty' | 'no_delivery' | 'provider_failure'): LoopState {
  return saveLoopState(updateCounters({ ...existing }, { successful: false, providerFailure: failureType === 'provider_failure', outcome: failureType }, failureType === 'no_delivery' ? 0 : existing.lastDeliveryCount));
}

function updateCounters(state: LoopState, update: LoopStateUpdate, deliveryCount: number): LoopState {
  const successful = Boolean(update.successful);
  return {
    ...state,
    consecutiveFailures: successful ? 0 : state.consecutiveFailures + (update.outcome === 'failure' ? 1 : 0),
    consecutiveEmptyRuns: successful || update.outcome !== 'empty' ? (successful ? 0 : state.consecutiveEmptyRuns) : state.consecutiveEmptyRuns + 1,
    consecutiveNoDeliveryRuns: successful || deliveryCount > 0 ? 0 : state.consecutiveNoDeliveryRuns + 1,
    consecutiveProviderFailures: successful || !update.providerFailure ? (successful ? 0 : state.consecutiveProviderFailures) : state.consecutiveProviderFailures + 1,
  };
}

function outcomeFor(update: LoopStateUpdate, deliveryCount: number) {
  if (update.successful) return 'success';
  if (update.providerFailure) return 'provider_failure';
  if (deliveryCount === 0) return 'no_delivery';
  return 'failure';
}

function main(): void {
  const state = loadLoopState();
  saveLoopState(state);
  console.log(`Loop state available: ${path.relative(process.cwd(), loopStatePath)}`);
}

if (require.main === module) main();
