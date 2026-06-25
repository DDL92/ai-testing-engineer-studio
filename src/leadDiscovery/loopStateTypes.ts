export type LoopOutcome =
  | 'success'
  | 'empty'
  | 'no_delivery'
  | 'provider_failure'
  | 'failure'
  | 'paused'
  | 'recovered';

export interface LoopState {
  lastRunAt: string | null;
  lastSuccessfulRunAt: string | null;
  consecutiveFailures: number;
  consecutiveEmptyRuns: number;
  consecutiveNoDeliveryRuns: number;
  consecutiveProviderFailures: number;
  lastProvider: string;
  lastProviderHealth: string;
  lastDeliveryCount: number;
  lastVerificationCount: number;
  lastReviewCount: number;
  lastCreditsEstimate: number;
  lastLoopDurationMs: number;
  lastLoopOutcome: LoopOutcome;
  paused: boolean;
  pauseReasons: string[];
  recommendations: string[];
  humanApprovalRequired: boolean;
}

export interface LoopStateUpdate {
  runAt?: string;
  successful?: boolean;
  providerFailure?: boolean;
  provider?: string;
  providerHealth?: string;
  deliveryCount?: number;
  verificationCount?: number;
  reviewCount?: number;
  creditsEstimate?: number;
  loopDurationMs?: number;
  outcome?: LoopOutcome;
}

export const defaultLoopState: LoopState = {
  lastRunAt: null,
  lastSuccessfulRunAt: null,
  consecutiveFailures: 0,
  consecutiveEmptyRuns: 0,
  consecutiveNoDeliveryRuns: 0,
  consecutiveProviderFailures: 0,
  lastProvider: 'none',
  lastProviderHealth: 'unknown',
  lastDeliveryCount: 0,
  lastVerificationCount: 0,
  lastReviewCount: 0,
  lastCreditsEstimate: 0,
  lastLoopDurationMs: 0,
  lastLoopOutcome: 'paused',
  paused: false,
  pauseReasons: [],
  recommendations: [],
  humanApprovalRequired: false,
};
