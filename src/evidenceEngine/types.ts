import { ChannelRecord } from '../channelResearch/types';
import { CompanyContactRecord } from '../leadResearch/types';
import { OpportunityReport } from '../opportunityEngine/types';
import { PainResearchRecord } from '../painIntelligence/types';
import { SiteIntelligenceRecord } from '../siteIntelligence/types';
import { LighthouseEvidenceReport } from '../lighthouseEvidence/types';

export type EvidenceCategory =
  | 'contact-evidence'
  | 'channel-evidence'
  | 'site-observation'
  | 'pain-intelligence'
  | 'qa-opportunity'
  | 'ux-opportunity'
  | 'automation-opportunity'
  | 'lighthouse-evidence'
  | 'audit-opportunity'
  | 'commercial-opportunity'
  | 'research-gap';

export type EvidenceConfidence = 'Low' | 'Medium' | 'High';

export type EvidenceSupports =
  | 'QA Audit'
  | 'Playwright Starter Pack'
  | 'QA Automation Retainer'
  | 'Discovery Call'
  | 'Proposal Support'
  | 'Research Needed';

export type EvidenceGap =
  | 'Missing Contact'
  | 'Missing Product Contact'
  | 'Missing Engineering Contact'
  | 'Missing Channel'
  | 'Missing Site Evidence'
  | 'Missing Lighthouse Evidence'
  | 'Missing Opportunity Evidence'
  | 'Missing Audit Evidence';

export type FutureEvidenceType =
  | 'playwright-evidence'
  | 'lighthouse-evidence'
  | 'screenshot'
  | 'accessibility-scan'
  | 'performance-snapshot'
  | 'manual-qa-observation';

export interface EvidenceTarget {
  companyId: string;
  companyName: string;
  status: 'active' | 'paused';
  source: string;
  notes: string;
}

export interface EvidenceItem {
  category: EvidenceCategory;
  description: string;
  source: string;
  confidence: EvidenceConfidence;
  supports: EvidenceSupports[];
}

export interface FutureEvidenceSlot {
  type: FutureEvidenceType;
  status: 'Implemented' | 'Not Implemented';
  notes: string;
}

export interface EvidenceCoverage {
  contactCoverage: number;
  channelCoverage: number;
  painCoverage: number;
  siteCoverage: number;
  lighthouseCoverage: number;
  opportunityCoverage: number;
  auditCoverage: number;
}

export interface EvidenceInputBundle {
  target: EvidenceTarget;
  contacts?: CompanyContactRecord;
  channels: ChannelRecord[];
  pain?: PainResearchRecord;
  site?: SiteIntelligenceRecord;
  lighthouse?: LighthouseEvidenceReport;
  opportunity?: OpportunityReport;
  outputFiles: EvidenceOutputFile[];
}

export interface EvidenceOutputFile {
  label: string;
  path: string;
  available: boolean;
}

export interface EvidenceReport {
  companyId: string;
  companyName: string;
  opportunityScore: number;
  readinessScore: number;
  confidence: EvidenceConfidence;
  gapCount: number;
  gaps: EvidenceGap[];
  recommendedNextAction: string;
  coverage: EvidenceCoverage;
  evidenceItems: EvidenceItem[];
  outputFiles: EvidenceOutputFile[];
  futureEvidenceSlots: FutureEvidenceSlot[];
  safetyNotes: string[];
}

export interface EvidencePortfolio {
  generatedAt: string;
  reports: EvidenceReport[];
  priorities: EvidenceReport[];
  highestReadiness?: EvidenceReport;
  lowestReadiness?: EvidenceReport;
  bestFirstClient?: EvidenceReport;
  mostCompleteAudit?: EvidenceReport;
  largestEvidenceGap?: EvidenceReport;
  researchNeeded: EvidenceReport[];
}
