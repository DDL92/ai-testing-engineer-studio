import fs = require('fs');
import path = require('path');

export type Lead = Record<string, string>;

export const operatorRoot = path.join(process.cwd(), 'sales-marketing-engine', 'operator');

export function readText(relativePath: string): string {
  const fullPath = path.join(operatorRoot, relativePath);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
}

export function writeMarkdown(relativePath: string, content: string): void {
  const fullPath = path.join(operatorRoot, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${content.trim()}\n`, 'utf8');
}

export function listMarkdownFiles(relativeDir: string): string[] {
  const fullDir = path.join(operatorRoot, relativeDir);
  if (!fs.existsSync(fullDir)) return [];
  return fs.readdirSync(fullDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => path.join(relativeDir, file));
}

export function parseCsv(csv: string): Lead[] {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce<Lead>((row, header, index) => {
      row[header] = values[index] ?? '';
      return row;
    }, {});
  });
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function getLeads(): Lead[] {
  return parseCsv(readText('input/raw-leads.csv'));
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseMoney(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isDue(dateValue: string | undefined, today = todayIso()): boolean {
  return Boolean(dateValue && dateValue <= today);
}

export function safeText(value: string | undefined): string {
  return (value ?? '').trim() || 'Not specified';
}

export function groupBy(leads: Lead[], key: string): Record<string, Lead[]> {
  return leads.reduce<Record<string, Lead[]>>((groups, lead) => {
    const value = safeText(lead[key]);
    groups[value] = groups[value] ?? [];
    groups[value].push(lead);
    return groups;
  }, {});
}

export function scoreLead(lead: Lead): number {
  let score = 1;
  const role = safeText(lead.role).toLowerCase();
  const companyType = safeText(lead.company_type).toLowerCase();
  const pain = safeText(lead.pain_point).toLowerCase();
  const service = safeText(lead.service_fit);
  const estimatedValue = parseMoney(lead.estimated_value);
  const priority = safeText(lead.priority).toLowerCase();

  if (/(founder|cto|qa manager|engineering manager|head of qa)/i.test(role)) score += 2;
  if (/(saas|ai app|software agency|startup)/i.test(companyType)) score += 2;
  if (/(automation|regression|qa|release|testing|playwright|cypress|ai)/i.test(pain)) score += 2;
  if (/(Playwright QA Automation Audit|Playwright Starter Framework|AI Testing Audit|Monthly QA Automation Retainer)/.test(service)) score += 1;
  if (estimatedValue >= 500) score += 1;
  if (priority === 'high') score += 1;
  if (priority === 'medium') score += 0.5;

  return Math.min(10, Math.round(score));
}

export function recommendedAngle(lead: Lead): string {
  const service = safeText(lead.service_fit);
  if (service.includes('AI Testing')) return 'AI response quality, grounding, format compliance, and defensive safety checks.';
  if (service.includes('Starter Framework')) return 'CI-ready Playwright + TypeScript framework around critical flows.';
  if (service.includes('Retainer')) return 'Ongoing regression coverage, flaky test review, and bug-to-test conversion.';
  return 'Low-risk Playwright audit to identify automation gaps and first smoke tests.';
}

export function nextActionForLead(lead: Lead, score = scoreLead(lead)): string {
  const status = safeText(lead.status);
  if (status === 'New' && score >= 7) return 'Send personalized first message today.';
  if (status === 'Qualified') return 'Send service-specific outreach and ask permission to share outline.';
  if (status === 'Contacted') return 'Prepare Day 2 follow-up if due.';
  if (status === 'Replied' || status === 'Interested') return 'Ask scope questions and prepare proposal.';
  if (status === 'Proposal Sent') return 'Send proposal follow-up.';
  return 'Keep in CRM and review next follow-up date.';
}

export function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US')}`;
}

