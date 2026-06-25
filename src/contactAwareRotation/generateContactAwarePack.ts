import fs = require('fs');
import path = require('path');
import { readContactAwareState } from './rotationRules';
import { ContactAwareLeadEvaluation, ContactAwareRotationReport } from './types';

const outputRoot = path.join(process.cwd(), 'output', 'contact-aware-rotation');

export function writeContactAwarePack(report: ContactAwareRotationReport): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });
  const outputs = [
    path.join(outputRoot, 'rotation-decision.md'),
    path.join(outputRoot, 'contact-ready-lead-pack.md'),
  ];
  fs.writeFileSync(outputs[0], renderRotationDecision(report), 'utf8');
  fs.writeFileSync(outputs[1], renderContactReadyPack(report), 'utf8');
  return outputs;
}

export function renderRotationDecision(report: ContactAwareRotationReport): string {
  return [
    '# Contact-Aware Lead Rotation',
    '',
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    '',
    '## Selected Lead',
    '',
    report.selectedLead ? renderLead(report.selectedLead, 'Selected.') : '- None.',
    '',
    '## Contact-Ready Leads',
    '',
    ...(report.readyLeads ?? (report.selectedLead ? [report.selectedLead] : [])).map((lead) => renderLead(lead, 'Verified contact-ready candidate.')),
    '',
    '## Evaluated Leads',
    '',
    ...report.evaluatedLeads.map((lead) => [
      `### ${lead.rank}. ${lead.companyName}`,
      '',
      `- Contact Status: ${lead.contactStatus}`,
      `- Evidence Status: ${lead.evidenceStatus}`,
      `- Reason: ${lead.reason}`,
      `- Action: ${lead.contactStatus === 'READY' ? 'Selected.' : lead.contactStatus === 'NOT_EVALUATED' ? 'Not evaluated.' : 'Revisit later.'}`,
      '',
    ].join('\n')),
    '## Next Manual Action',
    '',
    report.nextManualAction,
    '',
    '## Safety Rules',
    '',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderContactReadyPack(report: ContactAwareRotationReport): string {
  return [
    '# Contact-Ready Lead Pack',
    '',
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    '',
    report.selectedLead
      ? renderLead(report.selectedLead, 'First ranked lead with usable evidence and a verified technical decision-maker.')
      : 'No contact-ready lead is available. Do not personalize outreach.',
    '',
    '## Next Manual Action',
    '',
    report.nextManualAction,
    '',
    '## Safety Rules',
    '',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

function renderLead(lead: ContactAwareLeadEvaluation, why: string): string {
  return [
    `- Company: ${lead.companyName}`,
    `- Rank: ${lead.rank}`,
    `- Recommended Offer: ${lead.recommendedOffer}`,
    `- Contact: ${lead.primaryContactName ?? 'None'}`,
    `- Title: ${lead.primaryContactTitle ?? 'Not available'}`,
    `- Confidence: ${lead.primaryContactConfidence ?? 'Not available'}`,
    `- Source: ${lead.primaryContactSource ?? 'Not available'}`,
    `- Contact Status: ${lead.contactStatus}`,
    `- Why Selected: ${why}`,
  ].join('\n');
}

function renderList(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

if (require.main === module) {
  const report = readContactAwareState();
  if (!report) {
    console.error('No contact-aware rotation state exists. Run lead:rotate:contact-aware first.');
    process.exitCode = 1;
  } else {
    const outputs = writeContactAwarePack(report);
    console.log(`Contact-aware packs generated: ${outputs.map((file) => path.relative(process.cwd(), file)).join(', ')}`);
    console.log(`Status: ${report.status}`);
    console.log('Manual review only. Nothing was sent.');
  }
}
