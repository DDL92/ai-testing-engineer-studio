export type LighthouseCategoryId = 'performance' | 'accessibility' | 'best-practices' | 'seo';

export type LighthouseOpportunityType =
  | 'Potential Performance Opportunity'
  | 'Potential Accessibility Opportunity'
  | 'Potential SEO Opportunity'
  | 'Potential Best Practice Opportunity';

export type LighthouseConfidence = 'Low' | 'Medium' | 'High';

export interface LighthouseTarget {
  companyId: string;
  companyName: string;
  priority?: number;
}

export interface LighthouseScores {
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
}

export interface LighthouseOpportunity {
  type: LighthouseOpportunityType;
  category: LighthouseCategoryId;
  description: string;
  evidence: string;
  confidence: LighthouseConfidence;
}

export interface LighthouseEvidenceReport {
  companyId: string;
  companyName: string;
  requestedUrl: string;
  finalUrl: string;
  generatedAt: string;
  lighthouseVersion: string;
  fetchTime: string;
  formFactor: string;
  scores: LighthouseScores;
  opportunities: LighthouseOpportunity[];
  rawLhrPath: string;
  htmlReportPath: string;
  markdownReportPath: string;
  safetyNotes: string[];
}

export interface LighthouseEvidenceSummary {
  generatedAt: string;
  reports: LighthouseEvidenceReport[];
}
