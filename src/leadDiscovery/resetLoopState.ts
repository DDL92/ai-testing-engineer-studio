import { updateCostBudget } from './costBudgetManager';
import { resetLoopFailureCounters, updateLoopState } from './loopStateManager';
import { generateLoopHealth } from './runLoopHealth';

function main(): void {
  updateLoopState({
    successful: true,
    provider: 'offline',
    providerHealth: 'manual_reset',
    deliveryCount: 0,
    verificationCount: 0,
    reviewCount: 0,
    creditsEstimate: 0,
    loopDurationMs: 0,
    outcome: 'recovered',
  });
  resetLoopFailureCounters();
  updateCostBudget({
    estimatedQueriesSent: 0,
    estimatedCreditsUsed: 0,
    estimatedCreditsRemaining: 0,
    dailyBudget: 0,
    monthlyBudget: 0,
  });
  generateLoopHealth();
  console.log('Loop counters reset locally. Human approval is still required before external search.');
}

if (require.main === module) main();
