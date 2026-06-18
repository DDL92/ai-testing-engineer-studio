import { ClientPackage, ClientRecord } from '../clientConversion/types';

export type DeliveryReadinessStatus = 'READY FOR PREPARATION' | 'NEEDS REVIEW' | 'NOT READY';

export interface PackageRoute {
  package: ClientPackage;
  title: string;
  scopeSections: Array<{
    heading: string;
    items: string[];
  }>;
  recommendedOutputs: string[];
}

export interface DeliveryPhase {
  phase: string;
  title: string;
  activities: string[];
}

export interface DeliveryChecklist {
  publicOnly: string[];
  clientAccessRequired: string[];
  requiredInputs: string[];
  requiredReviewSteps: string[];
  requiredApprovalSteps: string[];
}

export interface DeliveryRouterReport {
  generatedAt: string;
  client: ClientRecord;
  route: PackageRoute;
  phases: DeliveryPhase[];
  checklist: DeliveryChecklist;
  readiness: DeliveryReadinessStatus;
  blockers: string[];
  nextDeliveryAction: string;
  safetyRules: string[];
}

export interface DeliveryRouterDashboard {
  deliveryReadiness: string;
  deliveryStatus: string;
  nextDeliveryAction: string;
}
