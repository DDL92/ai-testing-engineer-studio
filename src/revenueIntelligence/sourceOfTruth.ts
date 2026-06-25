import { buildRevenueIntelligenceReport } from './revenueIntelligenceRules';
import { selectedContactReadyLead } from '../contactAwareRotation/rotationRules';
import { buildLeadRotationDecision } from '../leadRotation/rotationRules';

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

export interface OperationalLeadContext {
  commercialTopRankedLead: string;
  previousActionableLead: string;
  operationalLead: string;
  operationalCompanyId: string;
  operationalWebsite: string;
  operationalRecommendedOffer: string;
  contactReady: boolean;
}

export function getOperationalLeadContext(): OperationalLeadContext {
  const report = buildRevenueIntelligenceReport();
  const rotation = buildLeadRotationDecision();
  const contactReady = selectedContactReadyLead();
  const operational = contactReady
    ? rotation.candidates.find((candidate) => candidate.companyId === contactReady.companyId) ?? null
    : rotation.actionableLead ?? report.actionableLead;
  return {
    commercialTopRankedLead: report.topLead?.companyName ?? 'No ranked lead',
    previousActionableLead: report.actionableLead?.companyName ?? 'No actionable lead',
    operationalLead: operational?.companyName ?? report.topLead?.companyName ?? 'No unified top lead',
    operationalCompanyId: operational?.companyId ?? report.topLead?.companyId ?? '',
    operationalWebsite: operational?.website ?? report.topLead?.website ?? '',
    operationalRecommendedOffer: operational?.recommendedOffer ?? report.topLead?.recommendedOffer ?? 'No offer selected',
    contactReady: Boolean(contactReady && operational),
  };
}

export function getRevenueSourceOfTruth(): RevenueSourceOfTruth {
  const report = buildRevenueIntelligenceReport();
  const topRankedLead = report.topLead;
  const context = getOperationalLeadContext();
  const actionableLead = buildLeadRotationDecision().candidates.find((candidate) => candidate.companyId === context.operationalCompanyId) ?? report.actionableLead;

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
      ...(context.contactReady ? [`Contact-aware rotation selected ${context.operationalLead} with a verified contact.`] : []),
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
