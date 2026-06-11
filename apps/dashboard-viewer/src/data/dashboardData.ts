import { listFiles, readJsonIfExists, readLocalFile, readTextIfExists } from './fileLoader';
import { previewMarkdown, renderMarkdown } from '../rendering/markdown';

export interface RevenueSummaryData {
  projectedMonthlyRecurringRevenue?: number;
  projectedOneTimeRevenueThisMonth?: number;
  progressTo3000?: number;
  progressTo5000?: number;
  clientsNeededAt500?: number;
  clientsNeededAt1000?: number;
  clientsNeededAt1500?: number;
  wonClients?: Array<{ companyName: string; projectedMonthlyRevenue: number; projectedOneTimeRevenue: number }>;
  lostLeadsByReason?: Record<string, number>;
}

export interface DailySummaryData {
  topRecommendedActions?: string[];
  hotLeads?: number;
  warmLeads?: number;
  ignoredLeads?: number;
}

export interface ActionCockpitData {
  generatedAt?: string;
  summary?: {
    totalLeadsReviewed?: number;
    totalActions?: number;
    actionableActions?: number;
    blockedActions?: number;
    totalExpectedRevenueImpact?: number;
    highestPriorityAction?: string;
    mainBottleneck?: string;
    bestRevenueOpportunity?: string;
  };
  topActions?: ActionCockpitAction[];
  blockedLeads?: ActionCockpitAction[];
  actionsByType?: Record<string, ActionCockpitAction[]>;
  dailyOperatingSequence?: Array<{ order: number; title: string; command: string; reason: string }>;
}

export interface ActionCockpitAction {
  id: string;
  leadId: string;
  companyName: string;
  actionType: string;
  priority: string;
  score: number;
  category: string;
  expectedRevenueImpact: number;
  reason: string;
  suggestedCommand: string;
  optimizeCommand?: string;
  messageQueueStatus?: string;
  messageQueueCommand?: string;
  messageQueueReason?: string;
  relatedDraftPath?: string;
  relatedReviewPath?: string;
  relatedAuditPath?: string;
  blockedReason?: string;
}

export interface MessageReviewQueueData {
  generatedAt?: string;
  summary?: Record<string, number>;
  items?: MessageReviewItemData[];
}

export interface MessageReviewItemData {
  id: string;
  leadId?: string;
  sourceFile: string;
  fileName: string;
  messageType: string;
  channel: string;
  status: string;
  statusHistory: Array<{ status: string; note: string; changedAt: string; changedBy: string }>;
  reviewedAt: string;
  reviewedBy: string;
  sentAt: string;
  qualityWarnings: string[];
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface SourceQualityData {
  generatedAt?: string;
  summary?: {
    totalSources?: number;
    enabledSources?: number;
    disabledSources?: number;
    excellentSources?: number;
    goodSources?: number;
    experimentalSources?: number;
    lowPrioritySources?: number;
    bestSource?: string;
    worstSource?: string;
  };
  records?: SourceQualityRecordData[];
  recommendations?: string[];
}

export interface SourceQualityRecordData {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  url: string;
  category: string;
  keywords: string[];
  totalOpportunitiesFound: number;
  hotLeadsFound: number;
  warmLeadsFound: number;
  lowLeadsFound: number;
  ignoredLeadsFound: number;
  averageLeadScore: number;
  conversionCount: number;
  wonCount: number;
  lostCount: number;
  sourceQualityScore: number;
  sourceQualityCategory: string;
  recommendation: string;
  warnings: string[];
  notes: string;
}

export function getMarkdownSummary(relativePath: string): { raw: string; html: string; preview: string } {
  const raw = readTextIfExists('generated', relativePath);
  return {
    raw,
    html: raw ? renderMarkdown(raw) : '',
    preview: raw ? previewMarkdown(raw) : '',
  };
}

export function getRevenueData(): RevenueSummaryData {
  return readJsonIfExists<RevenueSummaryData>('leadData', 'revenue-summary.json', {});
}

export function getDailyData(): DailySummaryData {
  return readJsonIfExists<DailySummaryData>('leadData', 'daily-summary.json', {});
}

export function getActionCockpitData(): ActionCockpitData {
  return readJsonIfExists<ActionCockpitData>('leadData', 'action-cockpit.json', {});
}

export function getMessageReviewQueueData(): MessageReviewQueueData {
  return readJsonIfExists<MessageReviewQueueData>('leadData', 'message-review-queue.json', {});
}

export function getSourceQualityData(): SourceQualityData {
  return readJsonIfExists<SourceQualityData>('leadData', 'source-quality.json', {});
}

export function getLeadData<T>(fileName: string, fallback: T): T {
  return readJsonIfExists<T>('leadData', fileName, fallback);
}

export function getApprovalDrafts() {
  return listFiles('approvalQueue', ['.md']).map((file) => {
    const content = readLocalFile(file.area, file.relativePath)?.content ?? '';
    return { ...file, preview: previewMarkdown(content) };
  });
}

export function getOptimizedDrafts() {
  return getApprovalDrafts().filter((file) => file.name.startsWith('optimized-') || file.name.includes('-optimized-'));
}

export function getMessageOptimizerStatus(): { aiEnabled: boolean; provider: string; mode: string; warnings: string[] } {
  const copyEnabled = process.env.AI_COPY_ENABLED?.toLowerCase() === 'true';
  const provider = process.env.AI_PROVIDER === 'openai' ? 'openai' : 'deterministic';
  const hasApiKey = Boolean(process.env.OPENAI_API_KEY);
  const aiEnabled = copyEnabled && provider === 'openai' && hasApiKey;
  const warnings = [
    !copyEnabled ? 'AI_COPY_ENABLED is false or unset. Deterministic fallback mode is active.' : '',
    copyEnabled && provider === 'openai' && !hasApiKey ? 'OPENAI_API_KEY is missing. Deterministic fallback mode is active.' : '',
  ].filter(Boolean);

  return {
    aiEnabled,
    provider: aiEnabled ? 'openai' : 'deterministic',
    mode: aiEnabled ? 'AI-assisted copy optimization' : 'Deterministic fallback',
    warnings,
  };
}

export function getLeadReviewFiles() {
  return listFiles('generated', ['.md'])
    .filter((file) => /^lead-.*-review\.md$/.test(file.name))
    .map((file) => {
      const content = readLocalFile(file.area, file.relativePath)?.content ?? '';
      return { ...file, preview: previewMarkdown(content) };
    });
}

export function getReportFiles() {
  return [
    ...listFiles('latestReports', ['.md', '.json', '.png']),
    ...listFiles('leadReports', ['.md', '.json', '.png']),
  ];
}
