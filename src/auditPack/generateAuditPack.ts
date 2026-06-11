import fs = require('fs');
import path = require('path');
import { scoreLead } from '../leads/leadScorer';
import { getLeadById } from '../leads/leadStore';
import { buildAuditPack, isQualifiedForAuditPack, qualificationFailureReason } from './auditPackRules';
import { LocalMarkdownSource } from './types';

const auditPackOutputRoot = path.join(process.cwd(), 'output', 'audit-packs');

function main(): void {
  const id = parseLeadId(process.argv.slice(2));

  if (!id) {
    exitWithError('Missing required --id lead_id argument. Example: npm run audit:pack -- --id pushpress');
  }

  const lead = getLeadById(id);
  if (!lead) {
    exitWithError(`Lead not found: ${id}. Check data/leads.json for the correct id.`);
  }

  const score = scoreLead(lead);
  if (!isQualifiedForAuditPack(lead, score)) {
    exitWithError(qualificationFailureReason(lead, score));
  }

  const researchPack = readLocalMarkdown('Research pack', path.join('output', 'research', `${lead.id}-research-pack.md`));
  const auditReport = readLocalMarkdown('Audit report', auditReportPathForLead(lead.website));
  const auditPack = buildAuditPack({ lead: { ...lead, score: score.score, recommendedOffer: score.recommendedOffer }, score, researchPack, auditReport });
  const outputDir = path.join(auditPackOutputRoot, lead.id);

  fs.mkdirSync(outputDir, { recursive: true });
  for (const document of auditPack.documents) {
    fs.writeFileSync(path.join(outputDir, document.fileName), document.body, 'utf8');
  }

  console.log(`Audit pack generated: ${path.relative(process.cwd(), outputDir)}`);
  console.log(`Lead: ${auditPack.companyName}`);
  console.log(`Score: ${score.score}/10`);
  console.log(`Recommended offer: ${score.recommendedOffer}`);
  console.log(`Research pack reused: ${researchPack.exists ? researchPack.path : 'missing'}`);
  console.log(`Audit output reused: ${auditReport.exists ? auditReport.path : 'missing'}`);
  console.log('No scraping, APIs, browsing, or outreach were performed.');
  console.log('Human approval is required before sending or using any generated document client-side.');
}

function parseLeadId(args: string[]): string | undefined {
  const idFlagIndex = args.indexOf('--id');
  if (idFlagIndex >= 0) return args[idFlagIndex + 1];

  const idValue = args.find((arg) => arg.startsWith('--id='));
  if (idValue) return idValue.slice('--id='.length);

  return undefined;
}

function readLocalMarkdown(label: string, relativePath: string | undefined): LocalMarkdownSource {
  if (!relativePath) {
    return {
      label,
      path: 'not available',
      exists: false,
    };
  }

  const absolutePath = path.join(process.cwd(), relativePath);
  const exists = fs.existsSync(absolutePath);

  return {
    label,
    path: relativePath,
    exists,
    content: exists ? fs.readFileSync(absolutePath, 'utf8') : undefined,
  };
}

function auditReportPathForLead(website: string): string | undefined {
  if (!website) return undefined;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(website);
  } catch {
    return undefined;
  }

  return path.join('output', 'audits', toSafeDomain(parsedUrl.hostname), 'audit-report.md');
}

function toSafeDomain(hostname: string): string {
  return hostname
    .replace(/^www\./, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function exitWithError(message: string): never {
  console.error(message);
  process.exit(1);
}

main();
