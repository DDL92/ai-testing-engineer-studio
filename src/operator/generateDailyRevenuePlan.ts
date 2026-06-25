import fs = require('fs');
import path = require('path');
import { readContactAwareState } from '../contactAwareRotation/rotationRules';
import { readContactDiscoveryReport } from '../contactDiscovery/contactRules';
import { loadOutreachRecords } from '../outreachTracking/outreachTrackingRules';
import {
  buildDailyRevenuePlan,
  loadWebsitePlanData,
  writeDailyRevenuePlanOutputs,
} from './dailyRevenueOperatorRules';
import { ContactAwareRotationReport } from '../contactAwareRotation/types';

export function generateDailyRevenuePlan(now = new Date()): ReturnType<typeof buildDailyRevenuePlan> {
  const website = loadWebsitePlanData();
  return buildDailyRevenuePlan({
    now,
    outreachRecords: loadOutreachRecords(),
    qaRotation: normalizeRotation(readContactAwareState()),
    websiteLeads: website.leads,
    websiteRanking: website.ranking,
    recurrenceCounts: readRecurrenceCounts(),
  });
}

function main(): void {
  const plan = generateDailyRevenuePlan();
  const outputs = writeDailyRevenuePlanOutputs(plan);
  console.log(`Daily revenue plan generated: ${outputs.map((file) => path.relative(process.cwd(), file)).join(', ')}`);
  console.log(`Status: ${plan.status}; actions: ${plan.selectedActions.length}; estimated minutes: ${plan.estimatedTotalMinutes}`);
  console.log('No outreach, follow-up, email, form, meeting, invoice, or payment was sent.');
}

function normalizeRotation(report: ContactAwareRotationReport | null): ContactAwareRotationReport {
  if (report) {
    const evaluatedLeads = report.evaluatedLeads.map((lead) => {
      const contact = readContactDiscoveryReport(lead.companyName);
      if (contact?.commercialFit !== 'LOW') return lead;
      return {
        ...lead,
        contactStatus: 'LOW_COMMERCIAL_FIT' as const,
        reason: 'Low commercial fit for current small-business QA Audit outreach; skip unless a strong explicit trigger appears.',
      };
    });
    return {
      ...report,
      evaluatedLeads,
      skippedLeads: evaluatedLeads.filter((lead) => lead.contactStatus !== 'READY'),
      readyLeads: (report.readyLeads ?? evaluatedLeads.filter((lead) => lead.contactStatus === 'READY').slice(0, 3))
        .filter((lead) => readContactDiscoveryReport(lead.companyName)?.commercialFit !== 'LOW'),
    };
  }
  return {
    generatedAt: new Date(0).toISOString(),
    status: 'NO_CONTACT_READY_LEAD',
    readyLeads: [],
    evaluatedLeads: [],
    skippedLeads: [],
    nextManualAction: 'Run contact-aware rotation when public contact search is available.',
    safetyRules: [],
  };
}

function readRecurrenceCounts(): Record<string, number> {
  const statePath = path.join(process.cwd(), 'data', 'operator', 'daily-run-state.json');
  if (!fs.existsSync(statePath)) return {};
  try {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8')) as {
      preparationRecurrence?: Record<string, number>;
    };
    return state.preparationRecurrence ?? {};
  } catch {
    return {};
  }
}

if (require.main === module) main();
