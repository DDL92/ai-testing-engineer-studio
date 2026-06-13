import fs = require('fs');
import path = require('path');
import { Lead, RecommendedOffer } from '../leads/types';
import {
  CurrencyRange,
  FinanceCandidate,
  FinanceData,
  FinanceForecastScenario,
  FinanceInput,
  FinanceOfferType,
  FinanceReport,
  FinanceRevenueActivity,
} from './types';

const financeDataPath = path.join(process.cwd(), 'data', 'finance', 'finance.json');
const leadsPath = path.join(process.cwd(), 'data', 'leads.json');
const outputRoot = path.join(process.cwd(), 'output', 'finance');

const approvedOfferRanges: Record<FinanceOfferType, { range: CurrencyRange; cadence: 'one-time' | 'monthly' }> = {
  'qa-audit': { range: { min: 199, max: 500 }, cadence: 'one-time' },
  'playwright-starter-pack': { range: { min: 900, max: 1500 }, cadence: 'one-time' },
  'qa-automation-retainer': { range: { min: 1500, max: 3000 }, cadence: 'monthly' },
};

const recommendedOfferMap: Partial<Record<RecommendedOffer, FinanceOfferType>> = {
  'qa-audit': 'qa-audit',
  'playwright-starter-pack': 'playwright-starter-pack',
  'qa-automation-retainer': 'qa-automation-retainer',
  'agency-partner-retainer': 'qa-automation-retainer',
};

const financeSafetyRules = [
  'This is local-only finance tracking.',
  'Booked revenue is counted only from data/finance/finance.json records with status booked or received.',
  'Lead candidates and forecast scenarios are not booked revenue.',
  'No payments, invoices, payment links, Stripe, PayPal, banks, APIs, scraping, browsing, CRM integrations, credentials, or external databases were used.',
  'Human approval is required before proposals, invoices, client communication, or external action.',
];

export function loadFinanceInput(): FinanceInput {
  const generatedAt = new Date().toISOString();

  return {
    generatedAt,
    month: generatedAt.slice(0, 7),
    financeData: readJson<FinanceData>(financeDataPath, buildDefaultFinanceData(generatedAt)),
    leads: readJson<Lead[]>(leadsPath, []),
  };
}

export function buildFinanceReport(input: FinanceInput): FinanceReport {
  const countedRevenueActivity = input.financeData.revenueActivity.filter(isCountedRevenue);
  const currentMonthActivity = countedRevenueActivity.filter((activity) => activity.bookedDate.startsWith(input.month));
  const currentMrr = countedRevenueActivity
    .filter((activity) => activity.offerType === 'qa-automation-retainer')
    .reduce((sum, activity) => sum + activity.monthlyAmount, 0);
  const auditRevenue = sumCurrentMonthRevenue(currentMonthActivity, 'qa-audit');
  const starterPackRevenue = sumCurrentMonthRevenue(currentMonthActivity, 'playwright-starter-pack');
  const retainerRevenue = sumCurrentMonthRevenue(currentMonthActivity, 'qa-automation-retainer');
  const projectedMonthlyRevenue = currentMrr + auditRevenue + starterPackRevenue;
  const monthlyOperatingCost = input.financeData.costProfile.monthlyOperatingCost;
  const netMonthlyProfit = projectedMonthlyRevenue - monthlyOperatingCost;
  const candidates = buildCandidates(input.leads);
  const retainerCandidates = candidates.filter((candidate) => candidate.offerType === 'qa-automation-retainer');
  const auditCandidates = candidates.filter((candidate) => candidate.offerType === 'qa-audit');
  const starterPackCandidates = candidates.filter((candidate) => candidate.offerType === 'playwright-starter-pack');

  return {
    generatedAt: input.generatedAt,
    month: input.month,
    targets: input.financeData.targets,
    costProfile: input.financeData.costProfile,
    revenueActivity: input.financeData.revenueActivity,
    countedRevenueActivity,
    currentMrr,
    targetMrrProgressPercent: calculateProgress(currentMrr, input.financeData.targets.targetMrr),
    nextTargetMrrProgressPercent: calculateProgress(currentMrr, input.financeData.targets.nextTargetMrr),
    longTermTargetMrrProgressPercent: calculateProgress(currentMrr, input.financeData.targets.longTermTargetMrr),
    auditRevenue,
    starterPackRevenue,
    retainerRevenue,
    projectedMonthlyRevenue,
    monthlyOperatingCost,
    netMonthlyProfit,
    savings: input.financeData.costProfile.currentSavings,
    savingsGap: Math.max(input.financeData.targets.surfTrainLiveTargetFund - input.financeData.costProfile.currentSavings, 0),
    retainerCandidates,
    auditCandidates,
    starterPackCandidates,
    bestRevenueOpportunity: pickBestRevenueOpportunity(candidates),
    forecastScenarios: buildForecastScenarios(currentMrr, input.financeData.costProfile, input.financeData.targets.surfTrainLiveTargetFund),
    warnings: buildWarnings(input.financeData.revenueActivity, countedRevenueActivity),
  };
}

export function writeMonthlyFinanceOutputs(report: FinanceReport): string[] {
  return writeOutputs([
    { fileName: 'monthly-finance.md', body: renderMonthlyFinance(report) },
    { fileName: 'mrr-tracker.md', body: renderMrrTracker(report) },
    { fileName: 'revenue-opportunities.md', body: renderRevenueOpportunities(report) },
  ]);
}

export function writeFinanceDashboardOutputs(report: FinanceReport): string[] {
  return writeOutputs([
    { fileName: 'finance-dashboard.md', body: renderFinanceDashboard(report) },
    { fileName: 'monthly-finance.md', body: renderMonthlyFinance(report) },
    { fileName: 'mrr-tracker.md', body: renderMrrTracker(report) },
    { fileName: 'revenue-opportunities.md', body: renderRevenueOpportunities(report) },
    { fileName: 'savings-plan.md', body: renderSavingsPlan(report) },
    { fileName: 'property-progress.md', body: renderPropertyProgress(report) },
  ]);
}

export function writeFinanceForecastOutputs(report: FinanceReport): string[] {
  return writeOutputs([
    { fileName: 'finance-forecast.md', body: renderFinanceForecast(report) },
    { fileName: 'savings-plan.md', body: renderSavingsPlan(report) },
    { fileName: 'property-progress.md', body: renderPropertyProgress(report) },
  ]);
}

export function renderMonthlyFinance(report: FinanceReport): string {
  return [
    '# Monthly Finance',
    '',
    `Generated: ${report.generatedAt}`,
    `Month: ${report.month}`,
    '',
    '## Revenue Snapshot',
    renderList([
      `Current MRR: ${formatCurrency(report.currentMrr)}`,
      `Target MRR: ${formatCurrency(report.targets.targetMrr)} (${formatPercent(report.targetMrrProgressPercent)})`,
      `Audit revenue this month: ${formatCurrency(report.auditRevenue)}`,
      `Starter Pack revenue this month: ${formatCurrency(report.starterPackRevenue)}`,
      `Retainer revenue this month: ${formatCurrency(report.retainerRevenue)}`,
      `Projected monthly revenue: ${formatCurrency(report.projectedMonthlyRevenue)}`,
      `Monthly operating cost: ${formatCurrency(report.monthlyOperatingCost)}`,
      `Net monthly profit before personal living costs: ${formatCurrency(report.netMonthlyProfit)}`,
      `Current savings: ${formatCurrency(report.savings)}`,
    ]),
    '',
    '## Revenue Activity Counted',
    renderActivityTable(report.countedRevenueActivity),
    '',
    '## Warnings',
    renderList(report.warnings),
    '',
    '## Safety Rules',
    renderList(financeSafetyRules),
    '',
  ].join('\n');
}

export function renderFinanceDashboard(report: FinanceReport): string {
  return [
    '# Finance Dashboard',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Current MRR',
    renderList([
      `Current MRR: ${formatCurrency(report.currentMrr)}`,
      `Target MRR progress: ${formatCurrency(report.currentMrr)} / ${formatCurrency(report.targets.targetMrr)} (${formatPercent(report.targetMrrProgressPercent)})`,
      `Next target progress: ${formatCurrency(report.currentMrr)} / ${formatCurrency(report.targets.nextTargetMrr)} (${formatPercent(report.nextTargetMrrProgressPercent)})`,
      `Long-term target progress: ${formatCurrency(report.currentMrr)} / ${formatCurrency(report.targets.longTermTargetMrr)} (${formatPercent(report.longTermTargetMrrProgressPercent)})`,
    ]),
    '',
    '## Best Revenue Opportunity',
    renderBestOpportunity(report.bestRevenueOpportunity),
    '',
    '## Retainer Candidates',
    renderCandidateTable(report.retainerCandidates.slice(0, 8)),
    '',
    '## Audit Candidates',
    renderCandidateTable(report.auditCandidates.slice(0, 8)),
    '',
    '## Monthly Forecast',
    renderForecastTable(report.forecastScenarios),
    '',
    '## Savings Forecast',
    renderSavingsSummary(report),
    '',
    '## Property Progress',
    renderPropertySummary(report),
    '',
    '## Safety Rules',
    renderList(financeSafetyRules),
    '',
  ].join('\n');
}

export function renderFinanceForecast(report: FinanceReport): string {
  return [
    '# Finance Forecast',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Forecast Rules',
    renderList([
      `Starting MRR: ${formatCurrency(report.currentMrr)} from counted local finance records only.`,
      'Scenarios use approved offer ranges only.',
      'Scenarios are planning math, not booked revenue.',
      'Conservative: 1 audit + 0 retainers.',
      'Base Case: 2 audits + 1 starter pack.',
      'Aggressive: 1 audit + 1 starter pack + 1 retainer.',
    ]),
    '',
    '## Scenarios',
    renderForecastTable(report.forecastScenarios),
    '',
    '## Savings Impact',
    renderSavingsSummary(report),
    '',
    '## Safety Rules',
    renderList(financeSafetyRules),
    '',
  ].join('\n');
}

export function renderMrrTracker(report: FinanceReport): string {
  return [
    '# MRR Tracker',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Metric | Value |',
    '| --- | ---: |',
    `| Current MRR | ${formatCurrency(report.currentMrr)} |`,
    `| Target MRR | ${formatCurrency(report.targets.targetMrr)} |`,
    `| Next Target MRR | ${formatCurrency(report.targets.nextTargetMrr)} |`,
    `| Long-Term Target MRR | ${formatCurrency(report.targets.longTermTargetMrr)} |`,
    `| Progress to Target | ${formatPercent(report.targetMrrProgressPercent)} |`,
    `| Progress to Next Target | ${formatPercent(report.nextTargetMrrProgressPercent)} |`,
    `| Progress to Long-Term Target | ${formatPercent(report.longTermTargetMrrProgressPercent)} |`,
    '',
    '## Active Counted Retainers',
    renderActivityTable(report.countedRevenueActivity.filter((activity) => activity.offerType === 'qa-automation-retainer')),
    '',
    '## Preferred Client Model',
    renderList([report.targets.preferredClientModel]),
    '',
  ].join('\n');
}

export function renderRevenueOpportunities(report: FinanceReport): string {
  return [
    '# Revenue Opportunities',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    'These are candidates from local lead data. They are not booked revenue.',
    '',
    '## Best Revenue Opportunity',
    renderBestOpportunity(report.bestRevenueOpportunity),
    '',
    '## Retainer Candidates',
    renderCandidateTable(report.retainerCandidates.slice(0, 12)),
    '',
    '## Starter Pack Candidates',
    renderCandidateTable(report.starterPackCandidates.slice(0, 12)),
    '',
    '## Audit Candidates',
    renderCandidateTable(report.auditCandidates.slice(0, 12)),
    '',
    '## Approved Offers Only',
    renderList([
      'QA Audit: $199-$500',
      'Playwright Starter Pack: $900-$1,500',
      'QA Automation Retainer: $1,500-$3,000/month',
    ]),
    '',
  ].join('\n');
}

export function renderSavingsPlan(report: FinanceReport): string {
  return [
    '# Savings Plan',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderSavingsSummary(report),
    '',
    '## Living Cost Range',
    renderList([
      `Monthly personal living cost: ${formatRange(report.targets.monthlyPersonalLivingCost)}`,
      `Net after low living cost estimate: ${formatCurrency(report.netMonthlyProfit - report.targets.monthlyPersonalLivingCost.min)}`,
      `Net after high living cost estimate: ${formatCurrency(report.netMonthlyProfit - report.targets.monthlyPersonalLivingCost.max)}`,
    ]),
    '',
    '## Notes',
    renderList([
      'This plan is not financial advice.',
      'Review taxes, emergency fund, debt, and real cash balances manually.',
      'Do not treat forecast scenarios as available cash.',
    ]),
    '',
  ].join('\n');
}

export function renderPropertyProgress(report: FinanceReport): string {
  return [
    '# Property Progress',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderPropertySummary(report),
    '',
    '## Surf Train Live Target Fund',
    renderList([
      `Current savings: ${formatCurrency(report.savings)}`,
      `Target fund: ${formatCurrency(report.targets.surfTrainLiveTargetFund)}`,
      `Remaining gap: ${formatCurrency(report.savingsGap)}`,
      `Current monthly net before living costs: ${formatCurrency(report.netMonthlyProfit)}`,
    ]),
    '',
    '## Progress Notes',
    renderList([
      'Progress is based on local finance records only.',
      'Property, relocation, training, travel, and lifestyle decisions require manual review.',
      'This report does not provide lending, tax, legal, real estate, or investment advice.',
    ]),
    '',
  ].join('\n');
}

function buildDefaultFinanceData(generatedAt: string): FinanceData {
  return {
    schemaVersion: 1,
    updatedAt: generatedAt,
    targets: {
      targetMrr: 3000,
      nextTargetMrr: 5000,
      longTermTargetMrr: 10000,
      monthlyPersonalLivingCost: {
        min: 1000,
        max: 1500,
      },
      preferredClientModel: '3-5 clients at $1,500-$3,000/month',
      surfTrainLiveTargetFund: 100000,
    },
    costProfile: {
      monthlyOperatingCost: 0,
      currentSavings: 0,
    },
    revenueActivity: [],
  };
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function writeOutputs(outputs: { fileName: string; body: string }[]): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });

  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }

  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

function isCountedRevenue(activity: FinanceRevenueActivity): boolean {
  return activity.status === 'booked' || activity.status === 'received';
}

function sumCurrentMonthRevenue(activity: FinanceRevenueActivity[], offerType: FinanceOfferType): number {
  return activity
    .filter((item) => item.offerType === offerType)
    .reduce((sum, item) => sum + item.amount, 0);
}

function buildCandidates(leads: Lead[]): FinanceCandidate[] {
  const candidates: FinanceCandidate[] = [];

  for (const lead of leads) {
    if (lead.status === 'lost' || lead.status === 'paused') continue;
    if (!isCommercialLeadCandidate(lead)) continue;

    const offerType = recommendedOfferMap[lead.recommendedOffer];
    if (!offerType) continue;

    const offer = approvedOfferRanges[offerType];

    candidates.push({
      companyName: lead.companyName,
      offerType,
      score: lead.score,
      status: lead.status,
      nextAction: lead.nextAction,
      estimatedValue: offer.range,
      cadence: offer.cadence,
    });
  }

  return candidates.sort(sortCandidates);
}

function isCommercialLeadCandidate(lead: Lead): boolean {
  const searchableText = [
    lead.id,
    lead.companyName,
    lead.website,
    lead.source,
    lead.fitNotes,
  ].join(' ').toLowerCase();

  return !['demo', 'sample', 'sandbox', 'test', 'example'].some((term) => searchableText.includes(term));
}

function sortCandidates(a: FinanceCandidate, b: FinanceCandidate): number {
  const revenueDelta = b.estimatedValue.max - a.estimatedValue.max;
  if (revenueDelta !== 0) return revenueDelta;

  return b.score - a.score;
}

function pickBestRevenueOpportunity(candidates: FinanceCandidate[]): FinanceCandidate | undefined {
  return candidates[0];
}

function buildForecastScenarios(currentMrr: number, costProfile: { monthlyOperatingCost: number; currentSavings: number }, targetFund: number): FinanceForecastScenario[] {
  const scenarios: FinanceForecastScenario[] = [
    {
      scenario: 'Conservative',
      assumptions: ['1 QA Audit', '0 retainers'],
      oneTimeRevenue: approvedOfferRanges['qa-audit'].range,
      addedMrr: { min: 0, max: 0 },
      projectedMonthlyRevenue: addRange({ min: currentMrr, max: currentMrr }, approvedOfferRanges['qa-audit'].range),
      projectedNetProfitAfterOperatingCost: subtractFromRange(addRange({ min: currentMrr, max: currentMrr }, approvedOfferRanges['qa-audit'].range), costProfile.monthlyOperatingCost),
      projectedSavingsAfterOneMonth: addRange({ min: costProfile.currentSavings, max: costProfile.currentSavings }, subtractFromRange(addRange({ min: currentMrr, max: currentMrr }, approvedOfferRanges['qa-audit'].range), costProfile.monthlyOperatingCost)),
      note: 'Planning scenario only. No audit revenue is booked until recorded locally.',
    },
    {
      scenario: 'Base Case',
      assumptions: ['2 QA Audits', '1 Playwright Starter Pack', '0 retainers'],
      oneTimeRevenue: addRange(multiplyRange(approvedOfferRanges['qa-audit'].range, 2), approvedOfferRanges['playwright-starter-pack'].range),
      addedMrr: { min: 0, max: 0 },
      projectedMonthlyRevenue: addRange({ min: currentMrr, max: currentMrr }, addRange(multiplyRange(approvedOfferRanges['qa-audit'].range, 2), approvedOfferRanges['playwright-starter-pack'].range)),
      projectedNetProfitAfterOperatingCost: subtractFromRange(addRange({ min: currentMrr, max: currentMrr }, addRange(multiplyRange(approvedOfferRanges['qa-audit'].range, 2), approvedOfferRanges['playwright-starter-pack'].range)), costProfile.monthlyOperatingCost),
      projectedSavingsAfterOneMonth: addRange({ min: costProfile.currentSavings, max: costProfile.currentSavings }, subtractFromRange(addRange({ min: currentMrr, max: currentMrr }, addRange(multiplyRange(approvedOfferRanges['qa-audit'].range, 2), approvedOfferRanges['playwright-starter-pack'].range)), costProfile.monthlyOperatingCost)),
      note: 'Planning scenario only. Starter Pack revenue is not booked until recorded locally.',
    },
    {
      scenario: 'Aggressive',
      assumptions: ['1 QA Audit', '1 Playwright Starter Pack', '1 QA Automation Retainer'],
      oneTimeRevenue: addRange(approvedOfferRanges['qa-audit'].range, approvedOfferRanges['playwright-starter-pack'].range),
      addedMrr: approvedOfferRanges['qa-automation-retainer'].range,
      projectedMonthlyRevenue: addRange(
        addRange({ min: currentMrr, max: currentMrr }, approvedOfferRanges['qa-automation-retainer'].range),
        addRange(approvedOfferRanges['qa-audit'].range, approvedOfferRanges['playwright-starter-pack'].range),
      ),
      projectedNetProfitAfterOperatingCost: subtractFromRange(addRange(
        addRange({ min: currentMrr, max: currentMrr }, approvedOfferRanges['qa-automation-retainer'].range),
        addRange(approvedOfferRanges['qa-audit'].range, approvedOfferRanges['playwright-starter-pack'].range),
      ), costProfile.monthlyOperatingCost),
      projectedSavingsAfterOneMonth: addRange({ min: costProfile.currentSavings, max: costProfile.currentSavings }, subtractFromRange(addRange(
        addRange({ min: currentMrr, max: currentMrr }, approvedOfferRanges['qa-automation-retainer'].range),
        addRange(approvedOfferRanges['qa-audit'].range, approvedOfferRanges['playwright-starter-pack'].range),
      ), costProfile.monthlyOperatingCost)),
      note: 'Planning scenario only. Retainer MRR is not booked until recorded locally.',
    },
  ];

  return scenarios.map((scenario) => ({
    ...scenario,
    note: `${scenario.note} Target fund gap after scenario remains ${formatRange(clampRange(subtractRange({ min: targetFund, max: targetFund }, scenario.projectedSavingsAfterOneMonth)))}.`,
  }));
}

function buildWarnings(activity: FinanceRevenueActivity[], countedActivity: FinanceRevenueActivity[]): string[] {
  const warnings = [
    countedActivity.length === 0
      ? 'No booked or received finance records found. Current revenue is $0 until data/finance/finance.json is updated.'
      : `${countedActivity.length} local finance records counted as booked or received.`,
    `${activity.length - countedActivity.length} finance records are planned, proposed, cancelled, or otherwise not counted as revenue.`,
  ];

  return warnings;
}

function renderActivityTable(activity: FinanceRevenueActivity[]): string {
  if (activity.length === 0) return '- No counted revenue activity found.';

  return [
    '| Client | Offer | Status | Date | Amount | Monthly Amount | Notes |',
    '| --- | --- | --- | --- | ---: | ---: | --- |',
    ...activity.map((item) => (
      `| ${escapeTable(item.clientName)} | ${formatOffer(item.offerType)} | ${item.status} | ${item.bookedDate} | ${formatCurrency(item.amount)} | ${formatCurrency(item.monthlyAmount)} | ${escapeTable(item.notes)} |`
    )),
  ].join('\n');
}

function renderCandidateTable(candidates: FinanceCandidate[]): string {
  if (candidates.length === 0) return '- No local candidates found.';

  return [
    '| Company | Offer | Score | Status | Estimate | Next Action |',
    '| --- | --- | ---: | --- | ---: | --- |',
    ...candidates.map((candidate) => (
      `| ${escapeTable(candidate.companyName)} | ${formatOffer(candidate.offerType)} | ${candidate.score} | ${candidate.status} | ${formatRange(candidate.estimatedValue)}${candidate.cadence === 'monthly' ? '/month' : ''} | ${escapeTable(candidate.nextAction)} |`
    )),
  ].join('\n');
}

function renderBestOpportunity(candidate?: FinanceCandidate): string {
  if (!candidate) return '- No local revenue opportunity found.';

  return renderList([
    `${candidate.companyName}: ${formatOffer(candidate.offerType)}`,
    `Estimated value: ${formatRange(candidate.estimatedValue)}${candidate.cadence === 'monthly' ? '/month' : ''}`,
    `Score: ${candidate.score}`,
    `Next action: ${candidate.nextAction}`,
    'Status: candidate only, not booked revenue.',
  ]);
}

function renderForecastTable(scenarios: FinanceForecastScenario[]): string {
  return [
    '| Scenario | Assumptions | One-Time Revenue | Added MRR | Projected Monthly Revenue | Net After Operating Cost | Projected Savings After One Month |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: |',
    ...scenarios.map((scenario) => (
      `| ${scenario.scenario} | ${escapeTable(scenario.assumptions.join(', '))} | ${formatRange(scenario.oneTimeRevenue)} | ${formatRange(scenario.addedMrr)}/month | ${formatRange(scenario.projectedMonthlyRevenue)} | ${formatRange(scenario.projectedNetProfitAfterOperatingCost)} | ${formatRange(scenario.projectedSavingsAfterOneMonth)} |`
    )),
  ].join('\n');
}

function renderSavingsSummary(report: FinanceReport): string {
  const monthlyNetAfterLivingCosts = {
    min: report.netMonthlyProfit - report.targets.monthlyPersonalLivingCost.max,
    max: report.netMonthlyProfit - report.targets.monthlyPersonalLivingCost.min,
  };

  return renderList([
    `Current savings: ${formatCurrency(report.savings)}`,
    `Surf Train Live target fund: ${formatCurrency(report.targets.surfTrainLiveTargetFund)}`,
    `Savings gap: ${formatCurrency(report.savingsGap)}`,
    `Net monthly profit before personal living costs: ${formatCurrency(report.netMonthlyProfit)}`,
    `Estimated net after personal living costs: ${formatRange(monthlyNetAfterLivingCosts)}`,
    `At current pre-living-cost net profit, estimated months to target: ${estimateMonthsToTarget(report.savingsGap, report.netMonthlyProfit)}`,
  ]);
}

function renderPropertySummary(report: FinanceReport): string {
  return renderList([
    `Current MRR: ${formatCurrency(report.currentMrr)}`,
    `Target MRR: ${formatCurrency(report.targets.targetMrr)}`,
    `Next target MRR: ${formatCurrency(report.targets.nextTargetMrr)}`,
    `Long-term target MRR: ${formatCurrency(report.targets.longTermTargetMrr)}`,
    `Preferred client model: ${report.targets.preferredClientModel}`,
    `Surf Train Live target fund progress: ${formatCurrency(report.savings)} / ${formatCurrency(report.targets.surfTrainLiveTargetFund)}`,
  ]);
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';

  return items.map((item) => `- ${item}`).join('\n');
}

function calculateProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min((current / target) * 100, 100);
}

function addRange(a: CurrencyRange, b: CurrencyRange): CurrencyRange {
  return {
    min: a.min + b.min,
    max: a.max + b.max,
  };
}

function subtractFromRange(range: CurrencyRange, value: number): CurrencyRange {
  return {
    min: range.min - value,
    max: range.max - value,
  };
}

function subtractRange(a: CurrencyRange, b: CurrencyRange): CurrencyRange {
  return {
    min: a.min - b.max,
    max: a.max - b.min,
  };
}

function clampRange(range: CurrencyRange): CurrencyRange {
  return {
    min: Math.max(range.min, 0),
    max: Math.max(range.max, 0),
  };
}

function multiplyRange(range: CurrencyRange, multiplier: number): CurrencyRange {
  return {
    min: range.min * multiplier,
    max: range.max * multiplier,
  };
}

function estimateMonthsToTarget(gap: number, monthlyNet: number): string {
  if (gap <= 0) return 'funded';
  if (monthlyNet <= 0) return 'not reachable at current local net profit';

  return `${Math.ceil(gap / monthlyNet)} months`;
}

function formatOffer(offerType: FinanceOfferType): string {
  const labels: Record<FinanceOfferType, string> = {
    'qa-audit': 'QA Audit',
    'playwright-starter-pack': 'Playwright Starter Pack',
    'qa-automation-retainer': 'QA Automation Retainer',
  };

  return labels[offerType];
}

function formatCurrency(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}$${Math.abs(value).toLocaleString('en-US')}`;
}

function formatRange(range: CurrencyRange): string {
  if (range.min === range.max) return formatCurrency(range.min);
  if (range.min < 0 || range.max < 0) return `${formatCurrency(range.min)} to ${formatCurrency(range.max)}`;
  return `${formatCurrency(range.min)}-${formatCurrency(range.max)}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
