export type ComplaintCategory =
  | 'booking'
  | 'scheduling'
  | 'calendar'
  | 'payments'
  | 'checkout'
  | 'signup'
  | 'onboarding'
  | 'authentication'
  | 'mobile'
  | 'notifications'
  | 'reporting'
  | 'performance'
  | 'integrations'
  | 'ux'
  | 'customer-support'
  | 'release-regression'
  | 'other';

export type QARiskCategory =
  | 'regression-risk'
  | 'payment-risk'
  | 'booking-risk'
  | 'onboarding-risk'
  | 'mobile-risk'
  | 'integration-risk'
  | 'release-risk'
  | 'data-integrity-risk'
  | 'customer-experience-risk';

export type Frequency = 'high' | 'medium' | 'low' | 'unknown';
export type Confidence = 'high' | 'medium' | 'low';

export interface PainComplaint {
  summary: string;
  category: ComplaintCategory;
  frequency: Frequency;
  businessImpact: string;
  confidence: Confidence;
  source: string;
  status: 'Supported by local data' | 'Not enough evidence yet';
  researchRequired: boolean;
}

export interface PainRisk {
  risk: string;
  category: QARiskCategory;
  why: string;
}

export interface AutomationOpportunity {
  title: string;
  coverage: string[];
}

export interface AuditAngle {
  focus: string;
  review: string[];
}

export interface OutreachAngle {
  department: 'Engineering' | 'Product' | 'Operations' | 'Customer Success';
  conversation: string;
}

export interface PainResearchRecord {
  companyId: string;
  companyName: string;
  complaints: PainComplaint[];
  patterns: string[];
  qaRisks: PainRisk[];
  automationOpportunities: AutomationOpportunity[];
  auditAngles: AuditAngle[];
  outreachAngles: OutreachAngle[];
}

export interface PainResearchSummary {
  totalCompanies: number;
  totalComplaints: number;
  totalRisks: number;
  totalAutomationOpportunities: number;
  categoryCounts: Record<string, number>;
  riskCounts: Record<string, number>;
  records: PainResearchRecord[];
}
