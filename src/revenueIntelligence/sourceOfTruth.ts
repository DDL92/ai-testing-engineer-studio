import { buildRevenueIntelligenceReport } from './revenueIntelligenceRules';

export interface RevenueSourceOfTruth {
  topLead: string;
  recommendedOffer: string;
  revenueDecision: string;
  executionPriority: 'HIGH' | 'MEDIUM' | 'LOW';
  executionPriorityDetail: string;
  nextAction: string;
  lastUpdated: string;
  warnings: string[];
}

export function getRevenueSourceOfTruth(): RevenueSourceOfTruth {
  const report = buildRevenueIntelligenceReport();
  const topLead = report.topLead;

  return {
    topLead: topLead?.companyName ?? 'No unified top lead',
    recommendedOffer: topLead?.recommendedOffer ?? 'No offer selected',
    revenueDecision: report.decision.status,
    executionPriority: priorityLabel(report.decision.status),
    executionPriorityDetail: report.executionPriority,
    nextAction: topLead?.nextRevenueAction ?? report.decision.manualAction,
    lastUpdated: report.generatedAt,
    warnings: [
      ...report.safetyRules,
      ...(!topLead ? ['Revenue Intelligence has no current top lead.'] : []),
    ],
  };
}

export function consistencyWarning(displayedLead: string, context: string, source = getRevenueSourceOfTruth()): string | null {
  if (!displayedLead || displayedLead === source.topLead) return null;
  return `${context} consistency warning: Revenue Intelligence top lead is ${source.topLead}, but this module tried to display ${displayedLead}. Showing ${source.topLead}.`;
}

export function unifiedLeadLine(label = 'Current Top Lead', source = getRevenueSourceOfTruth()): string {
  return `${label}: ${source.topLead}`;
}

function priorityLabel(decision: string): RevenueSourceOfTruth['executionPriority'] {
  if (decision === 'GO') return 'HIGH';
  if (decision === 'REVIEW') return 'MEDIUM';
  return 'LOW';
}
