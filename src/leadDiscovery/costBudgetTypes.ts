export type CostHealth = 'healthy' | 'warning' | 'critical' | 'paused';

export interface CostBudget {
  generatedAt: string;
  estimatedQueriesSent: number;
  estimatedCreditsUsed: number;
  estimatedCreditsRemaining: number;
  dailyBudget: number;
  monthlyBudget: number;
  costHealth: CostHealth;
  reduceQueryBatches: boolean;
  disableDynamicQueries: boolean;
  disableExternalSearch: boolean;
}

export interface CostBudgetUpdate {
  estimatedQueriesSent?: number;
  estimatedCreditsUsed?: number;
  estimatedCreditsRemaining?: number;
  dailyBudget?: number;
  monthlyBudget?: number;
}

export const defaultCostBudget: CostBudget = {
  generatedAt: new Date(0).toISOString(),
  estimatedQueriesSent: 0,
  estimatedCreditsUsed: 0,
  estimatedCreditsRemaining: 0,
  dailyBudget: 0,
  monthlyBudget: 0,
  costHealth: 'paused',
  reduceQueryBatches: true,
  disableDynamicQueries: true,
  disableExternalSearch: true,
};
