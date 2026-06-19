import { ClientPackage, ClientRecord } from '../clientConversion/types';

export type DeliveryAssetStatus = 'READY FOR REVIEW' | 'PARTIAL' | 'NOT READY';
export type CoverageAssetStatus = 'Observed' | 'Planned' | 'Automated' | 'Pending';
export type RiskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface DeliveryRisk {
  area: string;
  riskLevel: RiskPriority;
  observedSignals: string[];
  recommendedReviewPriority: RiskPriority;
}

export interface DeliveryCoverage {
  criticalFlow: string;
  coverageStatus: CoverageAssetStatus;
  recommendedAutomation: string;
  priority: RiskPriority;
}

export interface DeliveryTimelinePhase {
  phase: string;
  title: string;
  activities: string[];
}

export interface OnboardingChecklistSection {
  heading: string;
  boundary: 'public-only' | 'client-access-required';
  items: string[];
}

export interface DeliveryAssetsReport {
  generatedAt: string;
  client: ClientRecord;
  package: ClientPackage;
  status: DeliveryAssetStatus;
  evidenceStatus: string;
  evidenceSummary: string[];
  criticalFlows: string[];
  potentialAreasToReview: string[];
  recommendedNextSteps: string[];
  risks: DeliveryRisk[];
  coverage: DeliveryCoverage[];
  timeline: DeliveryTimelinePhase[];
  implementationBlueprint: Array<{ area: string; recommendation: string }>;
  onboarding: OnboardingChecklistSection[];
  maintenanceRecommendations: string[];
  expansionRecommendations: string[];
  bundleContents: string[];
  blockers: string[];
  safetyRules: string[];
}

export interface DeliveryAssetsDashboard {
  deliveryAssetsStatus: string;
  executiveReportStatus: string;
  coverageMatrixStatus: string;
  timelineStatus: string;
  onboardingStatus: string;
  bundleStatus: string;
}
