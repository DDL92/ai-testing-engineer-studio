import fs = require('fs');
import path = require('path');
import { readWebsiteLeads } from '../websiteStudio/leadAdapter';
import type { DemoValidation, LeadPack, SiteAudit, VisualBrief } from '../websiteStudio/demoTypes';
import { renderOutreachDrafts } from '../websiteStudio/messageGenerator';
import { renderProposal, renderSow } from '../websiteStudio/proposalGenerator';
import {
  buildSalesPackJson,
  renderApprovalChecklist,
  renderFollowUpPlan,
} from '../websiteStudio/salesPack';
import type {
  RecommendedChannel,
  RecommendedCta,
  SalesPackContext,
} from '../websiteStudio/salesTypes';

const args = process.argv.slice(2);
const fixtureLeadId = 'example_surf_camp_001';

void main().catch((error) => fail(errorMessage(error)));

async function main(): Promise<void> {
  validateFlags(args);
  const id = readFlag(args, '--id');
  if (!id) fail('Missing required --id <lead-id>.');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(id)) fail(`Unsafe lead ID: ${id}`);

  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const record = readWebsiteLeads().find((candidate) => candidate.lead.id === id);
  if (!record) fail(`Website lead not found: ${id}`);
  if (!record.lead.companyName.trim()) fail(`Lead ${id} has no usable business identity.`);
  if (record.analysis.decision === 'LOW_PRIORITY') fail(`LOW_PRIORITY lead ${id} cannot receive a sales pack.`);
  if (record.lead.status === ('archived' as typeof record.lead.status)) fail(`Archived lead ${id} cannot receive a sales pack.`);
  if (record.analysis.decision === 'REVIEW' && !force) {
    fail(`Lead ${id} is REVIEW. Use --force only after manually reviewing the limitations.`);
  }
  if (!['PRIORITY', 'QUALIFIED', 'REVIEW'].includes(record.analysis.decision)) {
    fail(`Lead ${id} is not eligible for a sales pack.`);
  }

  const fictional = isFictionalFixture(record.lead.id, record.lead.fitNotes);
  if (fictional && record.lead.id !== fixtureLeadId) {
    fail(`Fictional production lead ${id} is not eligible. Only the approved validation fixture may be used.`);
  }

  const leadPackPath = path.join(process.cwd(), 'output', 'website-studio', 'leads', id, 'lead-pack.json');
  const demoDir = path.join(process.cwd(), 'output', 'website-studio', 'demos', id);
  const outputDir = path.join(process.cwd(), 'output', 'website-studio', 'sales', id);
  const leadPack = readJson<LeadPack>(leadPackPath, 'lead pack');
  const audit = readJson<SiteAudit>(path.join(demoDir, 'audit.json'), 'demo audit');
  const validation = readJson<DemoValidation>(path.join(demoDir, 'demo-validation.json'), 'demo validation');
  const visualBrief = readJson<VisualBrief>(path.join(demoDir, 'visual-brief.json'), 'visual brief');
  const comparisonPath = path.join(demoDir, 'commercial-comparison.md');
  if (!fs.existsSync(comparisonPath)) fail(`Missing demo commercial comparison: ${path.relative(process.cwd(), comparisonPath)}`);
  for (const screenshot of ['desktop.png', 'mobile.png']) {
    const screenshotPath = path.join(demoDir, 'screenshots', screenshot);
    if (!fs.existsSync(screenshotPath)) fail(`Missing demo screenshot: ${path.relative(process.cwd(), screenshotPath)}`);
  }
  if (leadPack.leadId !== id || audit.leadId !== id || validation.leadId !== id || visualBrief.leadId !== id) {
    fail(`One or more prerequisite packs do not match lead ID: ${id}`);
  }
  if (!leadPack.manualReviewRequired || !validation.manualReviewRequired || !audit.manualReviewRequired) {
    fail('Manual review must remain required across all prerequisite packs.');
  }
  if (!leadPack.recommendedPrimaryOffer?.trim()) fail('Missing primary offer in lead pack.');
  if (!validPriceRange(leadPack.priceRange)) fail(`Invalid price range in lead pack: ${leadPack.priceRange}`);

  const validationFailures = Object.entries(validation.checks)
    .filter(([, check]) => check.status === 'FAIL')
    .map(([name]) => name);
  const fatalFailures = validationFailures.filter((name) => (
    ['indexHtmlExists', 'pageLoads', 'desktopScreenshot', 'mobileScreenshot'].includes(name)
  ));
  if (fatalFailures.length > 0) fail(`Demo validation has fatal failures: ${fatalFailures.join(', ')}`);
  if (validation.overallStatus !== 'PASS' && !force) {
    fail(`Demo validation status is ${validation.overallStatus}. Use --force only for non-fatal warnings.`);
  }

  const recommendedChannel = selectChannel(record.publicContact, audit);
  const recommendedCTA: RecommendedCta = 'permission to send the conceptual demo';
  const limitations = [
    ...(fictional ? ['This is the approved fictional validation fixture and must never be contacted.'] : []),
    ...validationFailures.map((failure) => `Demo validation limitation: ${failure}.`),
    ...(audit.reachable ? [] : ['Current website findings were not fully verifiable.']),
  ];
  const context: SalesPackContext = {
    record,
    leadPack,
    audit,
    validation,
    visualBrief,
    commercialComparison: fs.readFileSync(comparisonPath, 'utf8'),
    recommendedChannel,
    recommendedCTA,
    fictional,
    limitations,
  };

  if (dryRun) {
    console.log('Website sales pack dry run complete. No files were written.');
    console.log(`Lead: ${record.lead.companyName} (${id})${fictional ? ' — FICTIONAL VALIDATION FIXTURE' : ''}`);
    console.log(`Eligibility: ${record.analysis.decision}`);
    console.log(`Offer: ${leadPack.recommendedPrimaryOffer} (${leadPack.priceRange})`);
    console.log(`Output directory: ${path.relative(process.cwd(), outputDir)}`);
    console.log(`Recommended channel: ${recommendedChannel}`);
    console.log(`Recommended CTA: ${recommendedCTA}`);
    console.log(`Evidence: ${leadPack.verifiedOpportunitySignals.join('; ') || 'No verified opportunity signal recorded.'}`);
    console.log(`Unresolved gaps: ${[...leadPack.evidenceGaps, ...limitations].join('; ') || 'None recorded.'}`);
    console.log('Manual review required. Nothing was sent or scheduled.');
    return;
  }

  if (fs.existsSync(outputDir) && !force) {
    fail(`Sales output already exists: ${path.relative(process.cwd(), outputDir)}. Use --force to replace only this sales directory.`);
  }

  const outputExisted = fs.existsSync(outputDir);
  try {
    if (force && outputExisted) fs.rmSync(outputDir, { recursive: true, force: true });
    fs.mkdirSync(outputDir, { recursive: true });
    writeJson(path.join(outputDir, 'sales-pack.json'), buildSalesPackJson(context));
    fs.writeFileSync(path.join(outputDir, 'outreach-drafts.md'), renderOutreachDrafts(context), 'utf8');
    fs.writeFileSync(path.join(outputDir, 'proposal.md'), renderProposal(context), 'utf8');
    fs.writeFileSync(path.join(outputDir, 'sow.md'), renderSow(context), 'utf8');
    fs.writeFileSync(path.join(outputDir, 'follow-up-plan.md'), renderFollowUpPlan(context), 'utf8');
    fs.writeFileSync(path.join(outputDir, 'approval-checklist.md'), renderApprovalChecklist(context), 'utf8');

    const generated = fs.readdirSync(outputDir).sort();
    if (generated.length !== 6) fail(`Expected exactly six sales-pack files; found ${generated.length}.`);
    console.log(`Website sales pack generated: ${path.relative(process.cwd(), outputDir)}`);
    console.log(`Lead: ${record.lead.companyName}${fictional ? ' — FICTIONAL VALIDATION FIXTURE' : ''}`);
    console.log(`Offer: ${leadPack.recommendedPrimaryOffer} (${leadPack.priceRange})`);
    console.log(`Recommended channel: ${recommendedChannel}`);
    console.log(`Recommended CTA: ${recommendedCTA}`);
    console.log('Files: sales-pack.json, outreach-drafts.md, proposal.md, sow.md, follow-up-plan.md, approval-checklist.md');
    console.log('Status: DRAFT — NOT APPROVED — NOT SENT. Manual review required.');
  } catch (error) {
    if (!outputExisted && fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
    fail(errorMessage(error));
  }
}

function selectChannel(
  contact: { email: string | null; instagramUrl: string | null; facebookUrl: string | null },
  audit: SiteAudit,
): RecommendedChannel {
  if (contact.email) return 'email';
  if (audit.reachable && audit.checks.visibleContactLink?.status === 'PASS') return 'website contact method';
  if (contact.instagramUrl || contact.facebookUrl) return 'supplied public social profile';
  return 'manual contact research required';
}

function readJson<T>(filePath: string, label: string): T {
  if (!fs.existsSync(filePath)) fail(`Missing ${label}: ${path.relative(process.cwd(), filePath)}`);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    fail(`Invalid ${label}: ${path.relative(process.cwd(), filePath)}`);
  }
}

function validPriceRange(value: string): boolean {
  return /^USD\s+\d[\d,]*(?:\.\d+)?\s*[–-]\s*\d[\d,]*(?:\.\d+)?$/i.test(value.trim());
}

function isFictionalFixture(id: string, notes: string): boolean {
  return id.startsWith('example_') || /\bfictional\b/i.test(notes);
}

function validateFlags(commandArgs: string[]): void {
  const allowed = new Set(['--id', '--dry-run', '--force']);
  for (let index = 0; index < commandArgs.length; index += 1) {
    const argument = commandArgs[index];
    if (!argument.startsWith('--')) continue;
    const flag = argument.includes('=') ? argument.split('=')[0] : argument;
    if (!allowed.has(flag)) fail(`Unsupported flag: ${flag}`);
    if (flag === '--id' && !argument.includes('=')) index += 1;
  }
}

function readFlag(commandArgs: string[], flag: string): string | undefined {
  const index = commandArgs.indexOf(flag);
  if (index >= 0) return commandArgs[index + 1];
  return commandArgs.find((argument) => argument.startsWith(`${flag}=`))?.slice(flag.length + 1);
}

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown website sales-pack failure.';
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}
