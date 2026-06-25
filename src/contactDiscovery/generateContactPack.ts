import fs = require('fs');
import path = require('path');
import { buildRevenueIntelligenceReport } from '../revenueIntelligence/revenueIntelligenceRules';
import { readContactDiscoveryReport } from './contactRules';
import { ContactCandidate, ContactDiscoveryReport } from './types';

const outputRoot = path.join(process.cwd(), 'output', 'contacts');

export function writeContactPack(
  report: ContactDiscoveryReport,
  options: { writeSharedReadiness?: boolean } = {},
): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });
  const paths = [
    path.join(outputRoot, `${slug(report.companyName)}-contact-pack.md`),
    path.join(outputRoot, `${slug(report.companyName)}-contact-discovery-diagnostics.md`),
  ];
  fs.writeFileSync(paths[0], renderContactPack(report), 'utf8');
  fs.writeFileSync(paths[1], renderContactDiagnostics(report), 'utf8');
  if (options.writeSharedReadiness !== false) {
    const readinessPath = path.join(outputRoot, 'contact-readiness.md');
    fs.writeFileSync(readinessPath, renderContactReadiness(report), 'utf8');
    paths.splice(1, 0, readinessPath);
  }
  return paths;
}

export function renderContactPack(report: ContactDiscoveryReport): string {
  return [
    '# Contact Discovery Pack',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Company: ${report.companyName}`,
    `Status: ${report.status}`,
    `Recommended offer: ${report.recommendedOffer}`,
    '',
    '## Search Execution Summary',
    '',
    `- Provider: Tavily`,
    `- Queries configured: ${report.searchQueries.length}`,
    `- Queries successful: ${report.searchDiagnostics.filter((item) => item.status === 'SUCCESS').length}`,
    `- Queries failed: ${report.searchDiagnostics.filter((item) => item.status === 'FAILED').length}`,
    `- Results returned: ${report.totalSearchResults}`,
    '',
    '## Queries Executed',
    '',
    renderList(report.searchDiagnostics.map((item) => `${item.status}: ${item.query} (${item.resultCount} results)`)),
    '',
    '## Primary Contact',
    '',
    report.primaryContact ? renderContact(report.primaryContact, 'Selected as the highest-ranked verified role-relevant contact.') : '- No verified primary contact met the selection thresholds.',
    '',
    '## Backup Contacts',
    '',
    report.backupContacts.length > 0
      ? report.backupContacts.map((contact) => renderContact(contact, 'Eligible verified backup contact.')).join('\n\n')
      : '- None.',
    '',
    '## Manual Verification Candidates',
    '',
    report.manualVerificationCandidates.length > 0
      ? report.manualVerificationCandidates.map(renderManualCandidate).join('\n\n')
      : '- None.',
    '',
    '## Rejected Candidates',
    '',
    report.rejectedCandidates.length > 0
      ? report.rejectedCandidates.map((contact) => `- ${contact.fullName} — ${contact.title}: ${contact.rejectionReasons.join('; ') || 'Not selected after ranking.'}`).join('\n')
      : '- None.',
    '',
    '## Limitations',
    '',
    renderList(report.limitations),
    '',
    '## Recommended Manual Action',
    '',
    recommendedAction(report),
    '',
    '## Safety Rules',
    '',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderContactDiagnostics(report: ContactDiscoveryReport): string {
  return [
    '# Contact Discovery Diagnostics',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `- Company: ${report.companyName}`,
    `- Provider: Tavily`,
    `- Status: ${report.status}`,
    `- API key configured: ${report.searchDiagnostics.some((item) => item.errorCategory === 'missing_configuration') ? 'No' : 'Yes'}`,
    `- Total results: ${report.totalSearchResults}`,
    '',
    ...report.searchDiagnostics.flatMap((diagnostic, index) => [
      `## Query ${index + 1}`,
      '',
      `- Query: ${diagnostic.query}`,
      `- Execution status: ${diagnostic.status}`,
      `- Result count: ${diagnostic.resultCount}`,
      `- Error category: ${diagnostic.errorCategory ?? 'None'}`,
      '- URLs considered:',
      diagnostic.urlsConsidered.length > 0
        ? diagnostic.urlsConsidered.map((url) => `  - ${url}`).join('\n')
        : '  - None.',
      '- URLs rejected:',
      diagnostic.rejectedUrls.length > 0
        ? diagnostic.rejectedUrls.map((item) => `  - ${item.url} — ${item.reason}`).join('\n')
        : '  - None.',
      '',
    ]),
    '## Provider and Configuration Limitations',
    '',
    renderList(report.limitations),
    '',
    'No credentials, full provider payloads, or external messages are stored.',
    '',
  ].join('\n');
}

export function renderContactReadiness(report: ContactDiscoveryReport): string {
  return [
    '# Contact Readiness',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `- Company: ${report.companyName}`,
    `- Status: ${report.status}`,
    `- Primary contact: ${report.primaryContact?.fullName ?? 'None'}`,
    `- Eligible backups: ${report.backupContacts.length}`,
    `- Candidates reviewed: ${report.candidates.length}`,
    `- Search results returned: ${report.totalSearchResults}`,
    '',
    'Human approval is required before external action. Nothing was sent.',
    '',
  ].join('\n');
}

function renderManualCandidate(contact: ContactCandidate): string {
  return [
    `- Name: ${contact.fullName}`,
    `- Possible title: ${contact.title}`,
    `- Source URL: ${contact.sourceUrl}`,
    `- Source type: ${contact.sourceType}`,
    `- Confidence: ${contact.confidenceScore}`,
    `- Employment Evidence: ${contact.employmentStatus ?? 'unknown'}`,
    `- Manual Verification Priority: ${manualPriority(contact)}`,
    `- Why manual verification is required: ${contact.rejectionReasons.join('; ') || 'Current employment requires manual confirmation.'}`,
  ].join('\n');
}

function renderContact(contact: ContactCandidate, reason: string): string {
  return [
    `- Name: ${contact.fullName}`,
    `- Title: ${contact.title}`,
    `- Role Score: ${contact.roleScore}`,
    `- Confidence Score: ${contact.confidenceScore}`,
    `- Employment Verified: ${contact.currentEmploymentVerified ? 'Yes' : 'No'}`,
    `- Employment Evidence: ${contact.employmentStatus ?? 'unknown'}`,
    `- Recommended Channel: ${contact.recommendedChannel}`,
    `- Public Profile: ${contact.publicProfileUrl ?? 'Not available'}`,
    `- Source: ${contact.sourceUrl}`,
    `- Why Selected: ${reason}`,
  ].join('\n');
}

function renderList(items: string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join('\n') : '- None.';
}

function recommendedAction(report: ContactDiscoveryReport): string {
  if (report.status === 'READY') return 'Review the primary contact and manually confirm the role before sending any message.';
  if (report.status === 'NEEDS_MANUAL_REVIEW') return 'Manually verify one of the listed candidates against a current public company or professional source before personalizing a message.';
  if (report.status === 'SEARCH_UNAVAILABLE') return 'Restore public-search configuration or provider access, then rerun contact discovery.';
  return 'Review the diagnostics and try a small manual public search for a quality or engineering decision-maker.';
}

function manualPriority(contact: ContactCandidate): string {
  if (/\bproduct owner\b/i.test(contact.title)) return 'Preferred current product candidate';
  if (/\b(ceo|chief executive officer)\b/i.test(contact.title)) return 'Executive backup';
  return 'Role-relevant candidate';
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function readCompanyArg(): string {
  const args = process.argv.slice(2);
  const index = args.indexOf('--company');
  if (index >= 0 && args[index + 1]) return args[index + 1];
  const revenue = buildRevenueIntelligenceReport();
  return revenue.actionableLead?.companyName || revenue.topLead?.companyName || 'No unified top lead';
}

if (require.main === module) {
  const companyName = readCompanyArg();
  const report = readContactDiscoveryReport(companyName);
  if (!report) {
    console.error(`No contact discovery data exists for ${companyName}. Run contact:discover first.`);
    process.exitCode = 1;
  } else {
    const paths = writeContactPack(report);
    console.log(`Contact pack generated: ${paths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
    console.log(`Status: ${report.status}`);
    console.log('Manual review only. Nothing was sent.');
  }
}
