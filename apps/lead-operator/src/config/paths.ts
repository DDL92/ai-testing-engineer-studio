import path = require('path');

export const dataRoot = path.join(process.cwd(), 'data', 'leads');
export const leadsPath = path.join(dataRoot, 'leads.json');
export const opportunitiesPath = path.join(dataRoot, 'opportunities.json');
export const dailySummaryPath = path.join(dataRoot, 'daily-summary.json');
export const sourcesPath = path.join(dataRoot, 'sources.json');
export const outreachHistoryPath = path.join(dataRoot, 'outreach-history.json');
export const conversionsPath = path.join(dataRoot, 'conversions.json');
export const clientsPath = path.join(dataRoot, 'clients.json');
export const closedLeadsPath = path.join(dataRoot, 'closed-leads.json');
export const revenueSummaryPath = path.join(dataRoot, 'revenue-summary.json');
export const weeklyExecutiveDashboardPath = path.join(dataRoot, 'weekly-executive-dashboard.json');
export const actionCockpitPath = path.join(dataRoot, 'action-cockpit.json');
export const messageReviewQueuePath = path.join(dataRoot, 'message-review-queue.json');
export const sourceQualityPath = path.join(dataRoot, 'source-quality.json');
export const approvalQueueDir = path.join(process.cwd(), 'sales-marketing-engine', 'operator', 'approval-queue');
export const generatedDir = path.join(process.cwd(), 'sales-marketing-engine', 'operator', 'generated');
