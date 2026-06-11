import fs = require('fs');
import path = require('path');
import { scoreLead } from '../leads/leadScorer';
import { getLeadById } from '../leads/leadStore';
import { buildOutreachPack, isQualifiedForOutreachPack, qualificationFailureReason } from './outreachPackRules';
import { LocalSourceStatus } from './types';

const outreachPackOutputRoot = path.join(process.cwd(), 'output', 'outreach-packs');

function main(): void {
  const id = parseLeadId(process.argv.slice(2));

  if (!id) {
    exitWithError('Missing required --id lead_id argument. Example: npm run outreach:pack -- --id pushpress');
  }

  const lead = getLeadById(id);
  if (!lead) {
    exitWithError(`Lead not found: ${id}. Check data/leads.json for the correct id.`);
  }

  const score = scoreLead(lead);
  if (!isQualifiedForOutreachPack(lead, score)) {
    exitWithError(qualificationFailureReason(lead, score));
  }

  const researchPack = sourceStatus('Research pack', path.join('output', 'research', `${lead.id}-research-pack.md`));
  const auditPack = sourceStatus('Audit pack', path.join('output', 'audit-packs', lead.id));
  const auditReport = sourceStatus('Audit report', auditReportPathForLead(lead.website));
  const outreachPack = buildOutreachPack({
    lead: { ...lead, score: score.score, recommendedOffer: score.recommendedOffer },
    score,
    researchPack,
    auditPack,
    auditReport,
  });
  const outputDir = path.join(outreachPackOutputRoot, lead.id);

  fs.mkdirSync(outputDir, { recursive: true });
  for (const document of outreachPack.documents) {
    fs.writeFileSync(path.join(outputDir, document.fileName), document.body, 'utf8');
  }

  console.log(`Outreach pack generated: ${path.relative(process.cwd(), outputDir)}`);
  for (const document of outreachPack.documents) {
    console.log(`- ${path.relative(process.cwd(), path.join(outputDir, document.fileName))}`);
  }

  console.log(`Lead: ${outreachPack.companyName}`);
  console.log(`Score: ${score.score}/10`);
  console.log(`Recommended offer: ${score.recommendedOffer}`);
  console.log(`Main outreach angle: ${outreachPack.angle.summary}`);
  console.log(`Audit pack detected: ${auditPack.exists ? auditPack.path : 'no'}`);
  console.log(`Audit report detected: ${auditReport.exists ? auditReport.path : 'no'}`);
  console.log('No scraping, APIs, browsing, LinkedIn automation, CRM integration, emails, or messages were used.');
  console.log('Human approval is required before sending any outreach manually.');
}

function parseLeadId(args: string[]): string | undefined {
  const idFlagIndex = args.indexOf('--id');
  if (idFlagIndex >= 0) return args[idFlagIndex + 1];

  const idValue = args.find((arg) => arg.startsWith('--id='));
  if (idValue) return idValue.slice('--id='.length);

  return undefined;
}

function sourceStatus(label: string, relativePath: string | undefined): LocalSourceStatus {
  if (!relativePath) {
    return {
      label,
      path: 'not available',
      exists: false,
    };
  }

  return {
    label,
    path: relativePath,
    exists: fs.existsSync(path.join(process.cwd(), relativePath)),
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
