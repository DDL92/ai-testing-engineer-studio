import { First50ProgressSummary } from '../first50/first50Progress';
import { RecommendedOffer } from '../leads/types';

export type DailyPlanActionType =
  | 'review-lead'
  | 'prepare-audit'
  | 'prepare-message'
  | 'follow-up'
  | 'prepare-call'
  | 'prepare-proposal'
  | 'pause-lead';

export interface DailyPlanAction {
  priority: number;
  leadId: string;
  companyName: string;
  score: number;
  recommendedOffer: RecommendedOffer;
  actionType: DailyPlanActionType;
  reason: string;
  suggestedManualAction: string;
}

export interface DailyPlanSummary {
  date: string;
  totalLeads: number;
  activeLeads: number;
  excludedLeads: number;
  topActionCount: number;
  highestScore: number;
  first50Progress: First50ProgressSummary;
}

export interface DailyPlan {
  date: string;
  summary: DailyPlanSummary;
  actions: DailyPlanAction[];
  safetyRules: string[];
  suggestedNextCommands: string[];
}
