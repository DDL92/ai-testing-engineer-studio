import { ClientPackage, ClientRecord } from '../clientConversion/types';

export type AutomationPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type AutomationDeliveryStatus = 'READY FOR REVIEW' | 'NEEDS CLIENT INPUT' | 'NOT READY';

export interface CriticalFlowRecommendation {
  name: string;
  type: 'public-page' | 'candidate-flow' | 'client-access-required';
  priority: AutomationPriority;
  rationale: string;
  recommendedAutomation: string;
}

export interface AutomationTestCase {
  id: string;
  feature: string;
  risk: string;
  priority: AutomationPriority;
  recommendedAutomation: string;
  accessBoundary: 'public-only' | 'client-access-required';
}

export interface FrameworkRecommendation {
  path: string;
  purpose: string;
  status: 'recommended-only';
}

export interface PlaywrightSpecRecommendation {
  path: string;
  flow: string;
  priority: AutomationPriority;
  scope: string;
}

export interface FixtureRecommendation {
  path: string;
  purpose: string;
  accessBoundary: 'public-only' | 'client-access-required';
}

export interface AutomationDeliveryReport {
  generatedAt: string;
  client: ClientRecord;
  package: ClientPackage;
  status: AutomationDeliveryStatus;
  automationPlan: string[];
  evidenceSummary: string[];
  riskCategories: string[];
  criticalFlows: CriticalFlowRecommendation[];
  testCases: AutomationTestCase[];
  frameworkStructure: FrameworkRecommendation[];
  specs: PlaywrightSpecRecommendation[];
  fixtures: FixtureRecommendation[];
  ciRecommendations: string[];
  reportingRecommendations: string[];
  clientHandoff: string[];
  retentionPath: {
    qaAudit: string[];
    starterPack: string[];
    retainer: string[];
    month1: string[];
    month2: string[];
    month3: string[];
  };
  blockers: string[];
  safetyRules: string[];
}

export interface AutomationDeliveryDashboard {
  automationStatus: string;
  criticalFlowCount: number;
  deliveryAssets: number;
  frameworkStatus: string;
  clientHandoffStatus: string;
  deliveryStatus: string;
}
