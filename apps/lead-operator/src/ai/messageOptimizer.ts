import fs = require('fs');
import path = require('path');
import { approvalQueueDir, generatedDir } from '../config/paths';
import { buildLeadReviewContext } from '../review/leadReviewWriter';
import { applyScoreToLead, opportunityToLead } from '../scoring/scorer';
import { readLeads, readOpportunities, readOutreachHistory } from '../storage/jsonStore';
import type { Lead, OutreachRecord } from '../types/lead';
import { checkMessageQuality, MessageQualityResult } from './messageQualityRules';
import { optimizeWithProvider, ProviderResult } from './aiProvider';
import { getAiCopyConfig, isAiCopyActive } from './aiConfig';
import { MessageType, parseMessageType } from './promptTemplates';

export interface OptimizedMessageResult {
  file: string;
  aiEnabled: boolean;
  provider: string;
  model: string;
  quality: MessageQualityResult;
  warnings: string[];
}

const allowedDraftRoots = [
  approvalQueueDir,
  generatedDir,
  path.join(process.cwd(), 'reports', 'leads'),
];

export async function optimizeMessageFile(input: { filePath?: string; type?: string }): Promise<OptimizedMessageResult> {
  const type = parseMessageType(input.type);
  const fullPath = resolveAllowedDraftPath(input.filePath);
  const draft = fs.readFileSync(fullPath, 'utf8');
  const provider = await optimizeWithProvider({ type, draft });
  return writeOptimizedDraft({
    originalFile: path.relative(process.cwd(), fullPath),
    outputName: `optimized-${path.basename(fullPath)}`,
    type,
    provider,
    quality: checkMessageQuality(provider.content, { hasAuditEvidence: fullPath.includes(`${path.sep}reports${path.sep}leads${path.sep}`) || fullPath.includes('audit') }),
  });
}

export async function optimizeLeadMessage(input: { leadId?: string; type?: string }): Promise<OptimizedMessageResult> {
  if (!input.leadId) throw new Error('Missing --id. Example: npm run lead:optimize -- --id sample-lead --type linkedin_dm');
  const type = parseMessageType(input.type);
  const leads = mergeLeads(readLeads(), readOpportunities().map(opportunityToLead)).map(applyScoreToLead);
  const lead = leads.find((item) => item.id === input.leadId);
  if (!lead) throw new Error(`Lead or opportunity not found: ${input.leadId}`);

  const outreachHistory = readOutreachHistory().filter((record) => record.leadId === lead.id);
  const context = buildLeadReviewContext(lead, readOutreachHistory());
  const leadReview = readOptional(path.join(generatedDir, `lead-${lead.id}-review.md`));
  const auditFindings = readOptional(path.join(process.cwd(), 'reports', 'leads', lead.id, 'client-report.md'));
  const draft = buildLeadDraftSeed(lead, type, outreachHistory, context.proposalDrafts);
  const provider = await optimizeWithProvider({
    type,
    draft,
    lead,
    auditFindings,
    proposalDrafts: context.proposalDrafts,
    leadReview,
    outreachHistory,
  });

  return writeOptimizedDraft({
    originalFile: context.proposalDrafts[0] ?? `generated context for ${lead.id}`,
    outputName: `lead-${lead.id}-optimized-${type}.md`,
    type,
    provider,
    quality: checkMessageQuality(provider.content, { hasAuditEvidence: Boolean(auditFindings) }),
  });
}

export function getOptimizerMode(): { aiEnabled: boolean; provider: string; warnings: string[] } {
  const aiConfig = getAiCopyConfig();
  return {
    aiEnabled: isAiCopyActive(aiConfig),
    provider: aiConfig.provider,
    warnings: aiConfig.warnings,
  };
}

function resolveAllowedDraftPath(filePath: string | undefined): string {
  if (!filePath) throw new Error('Missing --file. Example: npm run message:optimize -- --file sales-marketing-engine/operator/approval-queue/lead-sample-lead-proposal.md --type linkedin_dm');
  const resolved = path.resolve(process.cwd(), filePath);
  if (!allowedDraftRoots.some((root) => isInside(resolved, root))) {
    throw new Error(`Refusing to optimize files outside allowed draft/report directories: ${filePath}`);
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) throw new Error(`Draft file not found: ${filePath}`);
  if (path.extname(resolved).toLowerCase() !== '.md') throw new Error('Only Markdown draft files are supported.');
  return resolved;
}

function isInside(filePath: string, root: string): boolean {
  const normalizedRoot = path.resolve(root);
  return filePath === normalizedRoot || filePath.startsWith(`${normalizedRoot}${path.sep}`);
}

function writeOptimizedDraft(input: {
  originalFile: string;
  outputName: string;
  type: MessageType;
  provider: ProviderResult;
  quality: MessageQualityResult;
}): OptimizedMessageResult {
  fs.mkdirSync(approvalQueueDir, { recursive: true });
  const filePath = path.join(approvalQueueDir, input.outputName);
  const content = `# Optimized Message Draft

- Original file: ${input.originalFile}
- Message type: ${input.type}
- AI enabled: ${input.provider.aiEnabled}
- Provider: ${input.provider.provider}
- Model: ${input.provider.model}
- Generated at: ${new Date().toISOString()}
- Review required before sending: true

## Safety Warnings

${input.provider.warnings.length ? input.provider.warnings.map((warning) => `- ${warning}`).join('\n') : '- None.'}

## Quality Check

- Passed: ${input.quality.passed}

### Warnings

${input.quality.warnings.length ? input.quality.warnings.map((warning) => `- ${warning}`).join('\n') : '- None.'}

### Suggested Fixes

${input.quality.suggestedFixes.length ? input.quality.suggestedFixes.map((fix) => `- ${fix}`).join('\n') : '- None.'}

## Optimized Message

${input.provider.content.trim()}
`;
  fs.writeFileSync(filePath, `${content.trim()}\n`, 'utf8');
  return {
    file: path.relative(process.cwd(), filePath),
    aiEnabled: input.provider.aiEnabled,
    provider: input.provider.provider,
    model: input.provider.model,
    quality: input.quality,
    warnings: input.provider.warnings,
  };
}

function buildLeadDraftSeed(lead: Lead, type: MessageType, outreachHistory: OutreachRecord[], proposalDrafts: string[]): string {
  const lastOutreach = outreachHistory[outreachHistory.length - 1];
  return [
    `Message type: ${type}`,
    `Company: ${lead.companyName}`,
    `Website: ${lead.website || 'missing'}`,
    `Score: ${lead.score}/100 (${lead.scoreBreakdown.category})`,
    `QA fit reason: ${lead.qaFitReason || 'not documented'}`,
    `Detected pain point: ${lead.detectedPainPoint || 'not documented'}`,
    `Suggested offer: ${lead.suggestedOffer || 'not set'}`,
    lastOutreach ? `Last outreach: ${lastOutreach.sentAt}, ${lastOutreach.channel}, next follow-up ${lastOutreach.nextFollowUpAt}` : 'No outreach recorded.',
    proposalDrafts.length ? `Related draft: ${proposalDrafts[0]}` : 'No related proposal draft found.',
  ].join('\n');
}

function readOptional(filePath: string): string {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function mergeLeads(existing: Lead[], incoming: Lead[]): Lead[] {
  const byId = new Map<string, Lead>();
  for (const lead of existing) byId.set(lead.id, lead);
  for (const lead of incoming) byId.set(lead.id, { ...lead, ...byId.get(lead.id), scoreBreakdown: lead.scoreBreakdown });
  return Array.from(byId.values()).sort((a, b) => b.score - a.score || a.companyName.localeCompare(b.companyName));
}
