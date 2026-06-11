import path = require('path');

export type DashboardArea = 'generated' | 'approvalQueue' | 'leadData' | 'latestReports' | 'leadReports';

export interface AllowedArea {
  id: DashboardArea;
  label: string;
  root: string;
}

export const dashboardPort = Number(process.env.DASHBOARD_PORT ?? 4173);

export const allowedAreas: AllowedArea[] = [
  {
    id: 'generated',
    label: 'Generated summaries',
    root: path.join(process.cwd(), 'sales-marketing-engine', 'operator', 'generated'),
  },
  {
    id: 'approvalQueue',
    label: 'Approval queue',
    root: path.join(process.cwd(), 'sales-marketing-engine', 'operator', 'approval-queue'),
  },
  {
    id: 'leadData',
    label: 'Lead data',
    root: path.join(process.cwd(), 'data', 'leads'),
  },
  {
    id: 'latestReports',
    label: 'Latest audit reports',
    root: path.join(process.cwd(), 'reports', 'latest'),
  },
  {
    id: 'leadReports',
    label: 'Lead audit reports',
    root: path.join(process.cwd(), 'reports', 'leads'),
  },
];

export function getAllowedArea(areaId: string | undefined): AllowedArea | undefined {
  return allowedAreas.find((area) => area.id === areaId);
}
