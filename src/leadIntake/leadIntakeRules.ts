import { normalizeCompanyName, normalizeWebsite } from '../leads/leadId';
import { Lead } from '../leads/types';
import {
  CandidateApprovalStatus,
  CandidatePriority,
  CandidateQueueRow,
  LeadIntakeCandidate,
  LeadIntakeInput,
  LeadIntakeReport,
  LeadIntakeSummary,
} from './types';

const safetyBanner = [
  'MANUAL REVIEW REQUIRED',
  'NO AUTOMATIC LEAD CREATION',
  'NO OUTREACH AUTOMATION',
  'NO SCRAPING',
];

const highPriorityCategories = [
  'fitness saas',
  'gym management saas',
  'wellness saas',
  'wellness booking saas',
  'booking platform',
  'booking platforms',
  'property management saas',
  'scheduling saas',
  'healthtech saas',
  'e-commerce platform',
  'e-commerce platforms',
  'saas agency',
  'saas agencies',
];

export function parseCandidateQueue(markdown: string, existingLeads: Lead[]): LeadIntakeCandidate[] {
  const rows = parseCandidateRows(markdown);

  return rows
    .filter((row) => hasCandidateData(row))
    .map((row) => buildCandidate(row, existingLeads));
}

export function buildLeadIntakeReport(input: LeadIntakeInput): LeadIntakeReport {
  const approvedCandidates = input.candidates.filter((candidate) => candidate.status === 'approved');
  const rejectedCandidates = input.candidates.filter((candidate) => candidate.status === 'rejected');
  const pendingCandidates = input.candidates.filter((candidate) => candidate.status === 'pending');

  return {
    approvedCandidates,
    rejectedCandidates,
    pendingCandidates,
    summary: buildSummary(approvedCandidates, rejectedCandidates, pendingCandidates),
  };
}

export function renderApprovedCandidates(input: LeadIntakeInput, report: LeadIntakeReport): string {
  return [
    '# Approved Candidates',
    '',
    `Generated: ${input.generatedAt}`,
    '',
    renderSafetyBanner(),
    '',
    `Source queue: ${input.candidateQueuePath}`,
    '',
    'Only candidates marked approved and passing local duplicate/safety checks are shown here.',
    '',
    '## Approved Candidate List',
    renderApprovedTable(report.approvedCandidates),
    '',
    '## Suggested Next Action',
    report.summary.approvedCount > 0
      ? 'Review the command batch manually, then copy/paste individual `lead:add` commands only after Daniel confirms each candidate.'
      : 'No approved candidates are ready for intake. Add Daniel-approved rows to the candidate queue first.',
    '',
  ].join('\n');
}

export function renderLeadAddCommandBatch(input: LeadIntakeInput, report: LeadIntakeReport): string {
  return [
    '# Lead Add Command Batch',
    '',
    `Generated: ${input.generatedAt}`,
    '',
    renderSafetyBanner(),
    '',
    'COPY/PASTE READY COMMANDS ONLY. DO NOT EXECUTE AUTOMATICALLY.',
    '',
    'These commands are generated from approved queue rows only. They do not modify `data/leads.json` until Daniel manually runs them.',
    '',
    '## Commands',
    renderCommandBatch(report.approvedCandidates),
    '',
    '## Execution Rules',
    renderList([
      'Review every command before running it.',
      'Run one command at a time so duplicate detection and scoring stay readable.',
      'Do not run commands for candidates with uncertain websites, vague fit, private data, or missing Daniel approval.',
      'After manual execution, run `npm run lead:pack -- --id lead_id` or `npm run pipeline:opportunities` when appropriate.',
    ]),
    '',
  ].join('\n');
}

export function renderRejectedCandidates(input: LeadIntakeInput, report: LeadIntakeReport): string {
  return [
    '# Rejected Candidates',
    '',
    `Generated: ${input.generatedAt}`,
    '',
    renderSafetyBanner(),
    '',
    `Source queue: ${input.candidateQueuePath}`,
    '',
    '## Rejected Candidate List',
    renderRejectedTable(report.rejectedCandidates),
    '',
    '## Rejection Reasons',
    renderList([
      'duplicate',
      'low fit',
      'outside ICP',
      'paused',
      'missing required company, website, category, or reason',
      'not approved by Daniel',
    ]),
    '',
  ].join('\n');
}

export function renderIntakeSummary(input: LeadIntakeInput, report: LeadIntakeReport): string {
  const summary = report.summary;

  return [
    '# Lead Intake Summary',
    '',
    `Generated: ${input.generatedAt}`,
    '',
    renderSafetyBanner(),
    '',
    `Source queue: ${input.candidateQueuePath}`,
    '',
    '## Counts',
    `- Approved count: ${summary.approvedCount}`,
    `- Rejected count: ${summary.rejectedCount}`,
    `- Pending count: ${summary.pendingCount}`,
    `- High priority count: ${summary.highPriorityCount}`,
    '',
    '## Category Breakdown',
    renderCategoryBreakdown(summary),
    '',
    '## Recommended Next Action',
    summary.recommendedNextAction,
    '',
    '## Safety Rules',
    renderList([
      'This intake system prepares local review artifacts only.',
      'It does not execute `lead:add` commands.',
      'It does not modify `data/leads.json`.',
      'It does not scrape, browse, call APIs, enrich contacts, use CRMs, automate outreach, use credentials, or access external systems.',
      'Daniel must approve before any candidate enters the pipeline.',
    ]),
    '',
  ].join('\n');
}

export function renderIntakeConsoleSummary(report: LeadIntakeReport): string[] {
  return [
    `Approved candidates: ${report.summary.approvedCount}`,
    `Rejected candidates: ${report.summary.rejectedCount}`,
    `Pending candidates: ${report.summary.pendingCount}`,
    `High priority approved candidates: ${report.summary.highPriorityCount}`,
    `Recommended next action: ${report.summary.recommendedNextAction}`,
  ];
}

function parseCandidateRows(markdown: string): CandidateQueueRow[] {
  const lines = markdown.split('\n');
  const headerIndex = lines.findIndex((line) => line.includes('| Candidate Company |') && line.includes('| Approve? Yes/No |'));
  if (headerIndex === -1) return [];

  const rows: CandidateQueueRow[] = [];

  for (let index = headerIndex + 2; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line.startsWith('|')) break;
    if (line.replace(/[|\-\s:]/g, '') === '') continue;

    const cells = splitMarkdownRow(line);
    if (cells.length < 7) continue;

    rows.push({
      company: stripInlineCode(cells[0]),
      website: stripInlineCode(cells[1]),
      category: stripInlineCode(cells[2]),
      source: stripInlineCode(cells[3]),
      whyItMightFit: stripInlineCode(cells[4]),
      riskUnknown: stripInlineCode(cells[5]),
      approvalText: stripInlineCode(cells[6]),
    });
  }

  return rows;
}

function splitMarkdownRow(line: string): string[] {
  return line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim().replace(/\\\|/g, '|'));
}

function stripInlineCode(value: string): string {
  return value.replace(/`/g, '').trim();
}

function hasCandidateData(row: CandidateQueueRow): boolean {
  const values = [
    row.company,
    row.website,
    row.category,
    row.source,
    row.whyItMightFit,
    row.riskUnknown,
    row.approvalText,
  ];

  if (values.every((value) => value === '')) return false;
  if (row.company === '' && row.website === '' && row.category === '' && row.whyItMightFit === '') return false;
  if (row.company.toLowerCase() === 'company name' || row.website === 'https://example.com') return false;

  return true;
}

function buildCandidate(row: CandidateQueueRow, existingLeads: Lead[]): LeadIntakeCandidate {
  const duplicate = findDuplicate(row, existingLeads);
  const requiredMissing = requiredMissingReason(row);
  const status = inferStatus(row, duplicate, requiredMissing);
  const rejectionReason = status === 'rejected'
    ? duplicate || requiredMissing || explicitRejectionReason(row) || 'not approved by Daniel'
    : undefined;

  return {
    ...row,
    status,
    priority: inferPriority(row),
    suggestedNextAction: suggestedNextAction(status, row),
    rejectionReason,
  };
}

function inferStatus(row: CandidateQueueRow, duplicateReason: string | undefined, requiredMissing: string | undefined): CandidateApprovalStatus {
  if (duplicateReason || requiredMissing) return 'rejected';
  const explicitRejection = explicitRejectionReason(row);
  if (explicitRejection) return 'rejected';
  if (isApproved(row.approvalText)) return 'approved';
  if (isRejected(row.approvalText)) return 'rejected';
  return 'pending';
}

function findDuplicate(row: CandidateQueueRow, leads: Lead[]): string | undefined {
  const normalizedCompany = normalizeCompanyName(row.company);
  const normalizedWebsite = normalizeWebsite(row.website);
  const duplicate = leads.find((lead) => (
    Boolean(normalizedCompany) && normalizeCompanyName(lead.companyName) === normalizedCompany
  ) || (
    Boolean(normalizedWebsite) && normalizeWebsite(lead.website) === normalizedWebsite
  ));

  return duplicate ? `duplicate: existing lead ${duplicate.companyName}` : undefined;
}

function requiredMissingReason(row: CandidateQueueRow): string | undefined {
  const missing: string[] = [];
  if (!row.company) missing.push('company');
  if (!row.website) missing.push('website');
  if (!row.category) missing.push('category');
  if (!row.whyItMightFit) missing.push('reason approved');
  return missing.length > 0 ? `missing required ${missing.join(', ')}` : undefined;
}

function explicitRejectionReason(row: CandidateQueueRow): string | undefined {
  const text = `${row.approvalText} ${row.riskUnknown}`.toLowerCase();

  if (text.includes('duplicate')) return 'duplicate';
  if (text.includes('low fit')) return 'low fit';
  if (text.includes('outside icp') || text.includes('outside ICP'.toLowerCase())) return 'outside ICP';
  if (text.includes('paused')) return 'paused';
  if (isRejected(row.approvalText)) return row.riskUnknown || 'not approved by Daniel';

  return undefined;
}

function isApproved(value: string): boolean {
  return ['yes', 'y', 'approved', 'approve'].includes(value.trim().toLowerCase());
}

function isRejected(value: string): boolean {
  return ['no', 'n', 'rejected', 'reject'].includes(value.trim().toLowerCase());
}

function inferPriority(row: CandidateQueueRow): CandidatePriority {
  const category = row.category.trim().toLowerCase();
  const fitText = `${row.whyItMightFit} ${row.category}`.toLowerCase();
  const riskText = row.riskUnknown.toLowerCase();

  if (riskText.includes('low fit') || riskText.includes('outside icp') || riskText.includes('paused')) return 'Low';
  if (highPriorityCategories.some((highPriorityCategory) => category.includes(highPriorityCategory))) return 'High';
  if (['booking', 'scheduling', 'onboarding', 'dashboard', 'portal', 'mobile', 'integration', 'regression', 'payment'].some((keyword) => fitText.includes(keyword))) return 'High';
  if (row.whyItMightFit || row.category) return 'Medium';
  return 'Low';
}

function suggestedNextAction(status: CandidateApprovalStatus, row: CandidateQueueRow): string {
  if (status === 'approved') return `Review and manually run the generated lead:add command for ${row.company}.`;
  if (status === 'rejected') return `Keep ${row.company || 'this candidate'} out of data/leads.json unless Daniel requalifies it.`;
  return `Finish manual review for ${row.company || 'this candidate'} before generating a lead:add command.`;
}

function buildSummary(
  approvedCandidates: LeadIntakeCandidate[],
  rejectedCandidates: LeadIntakeCandidate[],
  pendingCandidates: LeadIntakeCandidate[],
): LeadIntakeSummary {
  const categoryBreakdown = approvedCandidates.reduce<Record<string, number>>((breakdown, candidate) => {
    const category = candidate.category || 'Uncategorized';
    breakdown[category] = (breakdown[category] ?? 0) + 1;
    return breakdown;
  }, {});

  return {
    approvedCount: approvedCandidates.length,
    rejectedCount: rejectedCandidates.length,
    pendingCount: pendingCandidates.length,
    highPriorityCount: approvedCandidates.filter((candidate) => candidate.priority === 'High').length,
    categoryBreakdown,
    recommendedNextAction: recommendedNextActionForSummary(approvedCandidates, rejectedCandidates, pendingCandidates),
  };
}

function recommendedNextActionForSummary(
  approvedCandidates: LeadIntakeCandidate[],
  rejectedCandidates: LeadIntakeCandidate[],
  pendingCandidates: LeadIntakeCandidate[],
): string {
  if (approvedCandidates.length > 0) return 'Review `output/lead-intake/lead-add-command-batch.md` and manually execute only the approved commands Daniel confirms.';
  if (pendingCandidates.length > 0) return 'Finish Daniel approval for pending candidates before generating lead:add commands.';
  if (rejectedCandidates.length > 0) return 'Review rejected reasons, then return to manual discovery for better-fit candidates.';
  return 'No candidate rows found. Add manually reviewed and Daniel-approved candidates to `output/lead-discovery-automation/candidate-queue.md`.';
}

function renderSafetyBanner(): string {
  return safetyBanner.map((line) => `**${line}**`).join('\n');
}

function renderApprovedTable(candidates: LeadIntakeCandidate[]): string {
  if (candidates.length === 0) return 'No approved candidates found.';

  return [
    '| Company | Category | Reason approved | Priority | Suggested next action |',
    '| --- | --- | --- | --- | --- |',
    ...candidates.map((candidate) => `| ${escapeTable(candidate.company)} | ${escapeTable(candidate.category)} | ${escapeTable(candidate.whyItMightFit)} | ${candidate.priority} | ${escapeTable(candidate.suggestedNextAction)} |`),
  ].join('\n');
}

function renderRejectedTable(candidates: LeadIntakeCandidate[]): string {
  if (candidates.length === 0) return 'No rejected candidates found.';

  return [
    '| Company | Category | Rejection reason | Risk / Unknown | Suggested next action |',
    '| --- | --- | --- | --- | --- |',
    ...candidates.map((candidate) => `| ${escapeTable(candidate.company || 'Unknown')} | ${escapeTable(candidate.category || 'Unknown')} | ${escapeTable(candidate.rejectionReason || 'not approved by Daniel')} | ${escapeTable(candidate.riskUnknown || 'Not recorded')} | ${escapeTable(candidate.suggestedNextAction)} |`),
  ].join('\n');
}

function renderCommandBatch(candidates: LeadIntakeCandidate[]): string {
  if (candidates.length === 0) return 'No approved candidates ready for command generation.';

  return candidates.map((candidate) => [
    '```sh',
    'npm run lead:add -- \\',
    `  --company "${escapeShellDoubleQuoted(candidate.company)}" \\`,
    `  --website "${escapeShellDoubleQuoted(candidate.website)}" \\`,
    `  --industry "${escapeShellDoubleQuoted(candidate.category)}" \\`,
    `  --source "${escapeShellDoubleQuoted(candidate.source || 'Manual research')}" \\`,
    `  --notes "${escapeShellDoubleQuoted(candidate.whyItMightFit)}"`,
    '```',
  ].join('\n')).join('\n\n');
}

function renderCategoryBreakdown(summary: LeadIntakeSummary): string {
  const entries = Object.entries(summary.categoryBreakdown).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return '- No approved categories yet.';
  return entries.map(([category, count]) => `- ${category}: ${count}`).join('\n');
}

function renderList(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|');
}

function escapeShellDoubleQuoted(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`');
}
