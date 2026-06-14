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

export type DynamicEvidenceStatus = 'PASS' | 'WARNING' | 'FAIL';
export type DynamicEvidenceSignalLevel = 'INFO' | 'WARNING' | 'ERROR';
export type DynamicEvidenceReadinessStatus = 'READY' | 'PARTIAL' | 'NOT READY';

export interface DynamicEvidenceTarget {
  companyId: string;
  companyName: string;
  website: string;
  source: 'Revenue Intelligence';
  generatedAt: string;
}

export interface PageEvidenceReport {
  generatedAt: string;
  target: DynamicEvidenceTarget;
  requestedUrl: string;
  finalUrl: string;
  statusCode: number | null;
  title: string;
  evidenceStatus: DynamicEvidenceStatus;
  notes: string[];
}

export interface FlowEvidenceItem {
  flowName: string;
  url: string;
  statusCode: number | null;
  title: string;
  status: DynamicEvidenceStatus;
  notes: string[];
}

export interface FlowEvidenceReport {
  generatedAt: string;
  target: DynamicEvidenceTarget;
  flows: FlowEvidenceItem[];
  evidenceStatus: DynamicEvidenceStatus;
  notes: string[];
}

export interface EvidenceSignal {
  level: DynamicEvidenceSignalLevel;
  source: string;
  message: string;
  url: string;
}

export interface ConsoleEvidenceReport {
  generatedAt: string;
  target: DynamicEvidenceTarget;
  signals: EvidenceSignal[];
  evidenceStatus: DynamicEvidenceStatus;
  notes: string[];
}

export interface NetworkEvidenceSignal {
  level: DynamicEvidenceSignalLevel;
  method: string;
  url: string;
  statusCode: number | null;
  message: string;
}

export interface NetworkEvidenceReport {
  generatedAt: string;
  target: DynamicEvidenceTarget;
  signals: NetworkEvidenceSignal[];
  evidenceStatus: DynamicEvidenceStatus;
  notes: string[];
}

export interface ScreenshotEvidenceItem {
  viewport: 'desktop' | 'tablet' | 'mobile';
  width: number;
  height: number;
  path: string;
  exists: boolean;
  status: DynamicEvidenceStatus;
  notes: string[];
}

export interface ScreenshotEvidenceReport {
  generatedAt: string;
  target: DynamicEvidenceTarget;
  screenshots: ScreenshotEvidenceItem[];
  evidenceStatus: DynamicEvidenceStatus;
  notes: string[];
}

export interface DynamicLighthouseScores {
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
}

export interface DynamicLighthouseEvidenceReport {
  generatedAt: string;
  target: DynamicEvidenceTarget;
  requestedUrl: string;
  finalUrl: string;
  scores: DynamicLighthouseScores;
  rawReportPath: string | null;
  htmlReportPath: string | null;
  evidenceStatus: DynamicEvidenceStatus;
  failureReason: string | null;
  notes: string[];
}

export interface DynamicEvidenceSummary {
  generatedAt: string;
  target: DynamicEvidenceTarget;
  page: PageEvidenceReport | null;
  flows: FlowEvidenceReport | null;
  console: ConsoleEvidenceReport | null;
  network: NetworkEvidenceReport | null;
  screenshots: ScreenshotEvidenceReport | null;
  lighthouse: DynamicLighthouseEvidenceReport | null;
}

export interface DynamicEvidenceReadinessDecision {
  generatedAt: string;
  target: DynamicEvidenceTarget;
  status: DynamicEvidenceReadinessStatus;
  commercialReadiness: 'Commercially Ready' | 'Needs Manual Review' | 'Not Commercially Ready';
  goNoGo: 'GO' | 'PARTIAL' | 'NO GO';
  evidenceStatus: string;
  pageStatus: string;
  flowStatus: string;
  screenshotStatus: string;
  lighthouseStatus: string;
  blockers: string[];
  safetyNotes: string[];
}
