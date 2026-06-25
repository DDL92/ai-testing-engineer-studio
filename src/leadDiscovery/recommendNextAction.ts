export type OperatorStatus = 'healthy' | 'warning' | 'critical' | 'paused';

export interface NextActionInput {
  loopPaused: boolean;
  pauseReasons: string[];
  costHealth: OperatorStatus;
  creditsRemaining: number;
  regressionFailed: number;
  reviewFalsePositiveCount: number;
  simulationPrecision: number;
  simulationRecall: number;
  uncommittedChanges?: boolean;
}

export interface NextActionRecommendation {
  nextAction: string;
  nextCommand: string;
  reason: string;
  estimatedTimeMinutes: number;
}

export function recommendNextAction(input: NextActionInput): NextActionRecommendation {
  if (input.loopPaused && input.pauseReasons.includes('cost_budget_paused')) {
    return {
      nextAction: 'Wait for Tavily credits reset.',
      nextCommand: 'npm run leads:loop-health',
      reason: 'External search is paused by cost budget guardrails, so only local health checks are safe.',
      estimatedTimeMinutes: 5,
    };
  }
  if (input.regressionFailed > 0) {
    return {
      nextAction: 'Review regression failures before changing queries.',
      nextCommand: 'npm run leads:regression',
      reason: 'Regression is the quality gate for buyer role, delivery, verification, and commercial-value logic.',
      estimatedTimeMinutes: 10,
    };
  }
  if (input.simulationPrecision < 0.95 || input.simulationRecall < 0.95) {
    return {
      nextAction: 'Review fixture simulation failures.',
      nextCommand: 'npm run leads:simulate',
      reason: 'Simulation precision or recall dropped below the local quality target.',
      estimatedTimeMinutes: 10,
    };
  }
  if (input.reviewFalsePositiveCount > 0) {
    return {
      nextAction: 'Review false-positive learning report.',
      nextCommand: 'npm run leads:review-simulate',
      reason: 'False positives should be converted into local learning before any future search spend.',
      estimatedTimeMinutes: 10,
    };
  }
  if (input.uncommittedChanges) {
    return {
      nextAction: 'Commit changes.',
      nextCommand: 'git status --short',
      reason: 'The local system is healthy enough to preserve the current implementation state.',
      estimatedTimeMinutes: 5,
    };
  }
  return {
    nextAction: 'Run review simulation.',
    nextCommand: 'npm run leads:review-simulate',
    reason: 'This keeps human decision learning fresh without consuming provider credits.',
    estimatedTimeMinutes: 10,
  };
}
