import { DailyPlanAction } from '../dayPlan/types';
import { RevenueSummary } from '../metrics/types';

export interface DailyGeneratedFile {
  label: string;
  path: string;
}

export interface DailyBriefing {
  date: string;
  revenueFocus: string[];
  topActions: DailyPlanAction[];
  revenueSummary: RevenueSummary;
  generatedFiles: DailyGeneratedFile[];
  suggestedManualActions: string[];
  suggestedCommands: string[];
  safetyRules: string[];
}
