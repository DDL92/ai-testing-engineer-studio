import { ClientReadinessCandidate } from '../clientReadiness/types';
import { ReleaseCandidateReport } from '../releaseCandidate/types';
import { RevenueCommandCenterReport, RevenuePriorityOpportunity } from '../revenueCommandCenter/types';

export type FirstRevenueReadiness = 'READY' | 'PARTIAL' | 'NOT READY';

export interface FirstClientPathItem {
  company: string;
  leadId?: string;
  readiness: FirstRevenueReadiness;
  missingStep: string;
  nextCommand: string;
  outreachReadiness: string;
  auditReadiness: string;
  proposalReadiness: string;
  revenuePath: string;
  priority: number;
  expectedOutput: string;
  revenuePurpose: string;
  candidate?: ClientReadinessCandidate;
  opportunity?: RevenuePriorityOpportunity;
}

export interface ReleaseCleanupItem {
  warning: string;
  cleanupRule: string;
  sourceOfTruth: string;
  recommendedAction: string;
}

export interface FirstRevenueValidationReport {
  generatedAt: string;
  release: ReleaseCandidateReport;
  revenue: RevenueCommandCenterReport;
  firstClientPath: FirstClientPathItem[];
  bestFirstClientTarget?: FirstClientPathItem;
  releaseCleanupItems: ReleaseCleanupItem[];
}
