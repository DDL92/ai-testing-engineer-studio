import fs = require('fs');
import path = require('path');
import { runAudit } from '../../../qa-audit-runner/src/audit/runAudit';
import { writeAuditReports } from '../../../qa-audit-runner/src/reporting/reportGenerator';
import { buildAuditBasedProposalMarkdown } from '../proposals/auditProposalTemplate';
import { opportunityToLead } from '../scoring/scorer';
import { updateLeadStatus } from '../status/statusUpdater';
import { readLeads, readOpportunities, writeLeads, writeOpportunities } from '../storage/jsonStore';
import { Lead } from '../types/lead';
import { approvalQueueDir } from '../config/paths';

export async function runLeadAudit(leadId: string | undefined): Promise<string> {
  if (!leadId) throw new Error('Missing --id. Example: npm run lead:audit -- --id sample-lead');

  const leads = readLeads();
  const opportunities = readOpportunities();
  const lead = leads.find((item) => item.id === leadId) ?? opportunities.find((item) => item.id === leadId && item.website);

  if (!lead) throw new Error(`Lead or opportunity not found: ${leadId}`);

  const normalizedLead: Lead = 'contactName' in lead ? lead : opportunityToLead(lead);
  if (!normalizedLead.website) throw new Error(`Lead ${leadId} does not have a website to audit.`);

  const outputDir = path.join(process.cwd(), 'reports', 'leads', normalizedLead.id);
  const audit = await runAudit(normalizedLead.website, { outputDir });
  writeAuditReports(audit, outputDir);

  const updatedLead = updateLeadStatus(normalizedLead, 'audit_completed', `Audit completed. Report: ${path.relative(process.cwd(), outputDir)}/client-report.md`);
  const mergedLeads = mergeLead(leads, updatedLead);
  writeLeads(mergedLeads);

  const updatedOpportunities = opportunities.map((opportunity) => opportunity.id === leadId
    ? { ...opportunity, status: 'audit_completed' as const, updatedAt: updatedLead.updatedAt, notes: [opportunity.notes, 'Audit completed.'].filter(Boolean).join('\n') }
    : opportunity);
  writeOpportunities(updatedOpportunities);

  fs.mkdirSync(approvalQueueDir, { recursive: true });
  const proposalPath = path.join(approvalQueueDir, `lead-${updatedLead.id}-audit-based-proposal.md`);
  fs.writeFileSync(proposalPath, `${buildAuditBasedProposalMarkdown(updatedLead, audit).trim()}\n`, 'utf8');

  return path.relative(process.cwd(), proposalPath);
}

function mergeLead(leads: Lead[], updatedLead: Lead): Lead[] {
  const exists = leads.some((lead) => lead.id === updatedLead.id);
  const next = exists
    ? leads.map((lead) => lead.id === updatedLead.id ? updatedLead : lead)
    : [...leads, updatedLead];
  return next.sort((a, b) => b.score - a.score || a.companyName.localeCompare(b.companyName));
}
