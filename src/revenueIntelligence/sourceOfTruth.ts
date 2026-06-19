import { buildRevenueIntelligenceReport } from './revenueIntelligenceRules';

export interface RevenueSourceOfTruth {
  topLead: string;
  topRankedLead: string;
  actionableLead: string;
  commercialReadiness: string;
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
  const topRankedLead = report.topLead;
  const actionableLead = report.actionableLead;

  return {
    topLead: actionableLead?.companyName ?? 'No actionable lead',
    topRankedLead: topRankedLead?.companyName ?? 'No ranked lead',
    actionableLead: actionableLead?.companyName ?? 'No actionable lead',
    commercialReadiness: actionableLead ? `${actionableLead.commercialReadinessScore}/100` : 'Not Available',
    recommendedOffer: actionableLead?.recommendedOffer ?? 'No offer selected',
    revenueDecision: report.decision.status,
    executionPriority: priorityLabel(report.decision.status),
    executionPriorityDetail: report.executionPriority,
    nextAction: actionableLead
      ? `Review ${actionableLead.companyName} message pack and public evidence; decide manually whether to prepare a QA Audit offer.`
      : report.decision.manualAction,
    lastUpdated: report.generatedAt,
    warnings: [
      ...report.safetyRules,
      ...(!actionableLead ? ['Lead Rotation has no current actionable lead.'] : []),
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
