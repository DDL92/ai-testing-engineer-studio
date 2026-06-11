import { runLeadAudit } from '../audit/leadAuditRunner';
import { getArg } from './args';
import {
  addLead,
  closeLead,
  convertLead,
  enrichLead,
  generateDailyOnly,
  generateActionCockpit,
  generateFollowUps,
  generateFollowUpsDue,
  generatePipeline,
  generateProposalDrafts,
  generateRevenueSummary,
  generateSourceQualityReport,
  generateWeeklyDashboard,
  markMessageSent,
  markProposalSent,
  optimizeLeadMessage,
  optimizeMessageFile,
  reviewMessage,
  reviewLeadById,
  runAuto,
  runFindOnly,
  scanMessageQueue,
  scoreLeads,
  updateLeadById,
} from '../leadService';

async function main(): Promise<void> {
  const command = process.argv[2] ?? 'daily';

  if (command === 'add') {
    addLead();
    console.log('Lead data files initialized.');
    return;
  }

  if (command === 'score') {
    const leads = scoreLeads();
    console.log(`Scored ${leads.length} lead(s).`);
    return;
  }

  if (command === 'proposal') {
    const files = generateProposalDrafts(getArg('--id'));
    console.log(`Generated ${files.length} proposal draft(s).`);
    return;
  }

  if (command === 'followup') {
    const files = generateFollowUps();
    console.log(`Generated ${files.length} follow-up/proposal draft(s).`);
    return;
  }

  if (command === 'daily') {
    generateDailyOnly();
    console.log('Daily lead summary generated.');
    return;
  }

  if (command === 'find') {
    await runFindOnly();
    console.log('Lead finder completed.');
    return;
  }

  if (command === 'auto') {
    await runAuto();
    console.log('Lead auto run completed.');
    return;
  }

  if (command === 'update') {
    const lead = updateLeadById({ id: getArg('--id'), status: getArg('--status'), note: getArg('--note') });
    console.log(`Updated ${lead.id} to ${lead.status}. Next follow-up: ${lead.nextFollowUpAt || 'not scheduled'}`);
    return;
  }

  if (command === 'audit') {
    const proposalPath = await runLeadAudit(getArg('--id'));
    console.log(`Lead audit completed. Audit-based proposal: ${proposalPath}`);
    return;
  }

  if (command === 'enrich') {
    const lead = enrichLead({
      id: getArg('--id'),
      contactName: getArg('--contact-name'),
      contactRole: getArg('--role'),
      contactEmail: getArg('--email'),
      linkedinUrl: getArg('--linkedin'),
      companyName: getArg('--company-name'),
      website: getArg('--website'),
      note: getArg('--note'),
    });
    console.log(`Enriched ${lead.id}: ${lead.companyName}. Contact: ${lead.contactName || 'not set'} ${lead.contactEmail || lead.linkedinUrl || ''}`.trim());
    return;
  }

  if (command === 'sent') {
    const { lead, record } = markProposalSent({ id: getArg('--id'), channel: getArg('--channel'), note: getArg('--note') });
    console.log(`Recorded ${record.channel} outreach for ${lead.id}. Next follow-up: ${lead.nextFollowUpAt}`);
    return;
  }

  if (command === 'followups:due') {
    const result = generateFollowUpsDue();
    console.log(`Follow-ups due: ${result.dueCount}. Drafts generated: ${result.files.length}.`);
    result.files.forEach((file) => console.log(`- ${file}`));
    return;
  }

  if (command === 'pipeline') {
    const { file, summary } = generatePipeline();
    console.log(`Pipeline summary generated: ${file}`);
    console.log(`Active follow-ups due: ${summary.needingFollowUp.length}`);
    console.log(`Ready for audit: ${summary.readyForAudit.length}`);
    return;
  }

  if (command === 'review') {
    const { file, context } = reviewLeadById(getArg('--id'));
    console.log(`Lead review generated: ${file}`);
    console.log(`Lead: ${context.lead.companyName} (${context.lead.id})`);
    console.log(`Status: ${context.lead.status}`);
    console.log(`Score: ${context.lead.score}/100 (${context.lead.scoreBreakdown.category})`);
    console.log(`Recommended next action: ${context.recommendation.action}`);
    console.log(`Reason: ${context.recommendation.reason}`);
    console.log(`Suggested command: ${context.recommendation.command}`);
    if (context.missingFields.length > 0) console.log(`Missing fields: ${context.missingFields.join(', ')}`);
    if (context.redFlags.length > 0) console.log(`Red flags: ${context.redFlags.join('; ')}`);
    return;
  }

  if (command === 'convert') {
    const conversion = convertLead({ id: getArg('--id'), offerType: getArg('--offer'), amount: getArg('--amount'), note: getArg('--note') });
    console.log(`Converted ${conversion.leadId}: ${conversion.offerType}, $${conversion.amount}, ${conversion.billingType}.`);
    console.log(`Projected MRR: $${conversion.projectedMonthlyRevenue}. One-time: $${conversion.projectedOneTimeRevenue}.`);
    return;
  }

  if (command === 'close') {
    const record = closeLead({ id: getArg('--id'), result: getArg('--result'), reason: getArg('--reason'), note: getArg('--note') });
    console.log(`Closed ${record.leadId}: ${record.result}, reason=${record.reason}.`);
    return;
  }

  if (command === 'revenue:summary') {
    const summary = generateRevenueSummary();
    console.log('Revenue summary generated: sales-marketing-engine/operator/generated/revenue-summary.md');
    console.log(`Projected MRR: $${summary.projectedMonthlyRecurringRevenue}`);
    console.log(`Progress to $3,000/month: ${summary.progressTo3000}%`);
    return;
  }

  if (command === 'business:weekly') {
    const days = Number(getArg('--days') ?? '7');
    const dashboard = generateWeeklyDashboard(days);
    console.log('Weekly executive dashboard generated: sales-marketing-engine/operator/generated/weekly-executive-dashboard.md');
    console.log(`Reporting period: ${dashboard.reportingPeriod.startDate} to ${dashboard.reportingPeriod.endDate} (${dashboard.reportingPeriod.days} days)`);
    console.log(`Projected MRR: $${dashboard.revenueProgress.currentProjectedMrr}`);
    console.log(`Next actions: ${dashboard.nextHighestValueActions.length}`);
    return;
  }

  if (command === 'actions:cockpit') {
    const cockpit = generateActionCockpit();
    console.log('Action cockpit generated: sales-marketing-engine/operator/generated/action-cockpit.md');
    console.log(`Top actions: ${cockpit.topActions.length}`);
    console.log(`Blocked leads: ${cockpit.blockedLeads.length}`);
    console.log(`Highest priority: ${cockpit.summary.highestPriorityAction}`);
    return;
  }

  if (command === 'message:optimize') {
    const result = await optimizeMessageFile({ filePath: getArg('--file'), type: getArg('--type') });
    console.log(`Optimized draft generated: ${result.file}`);
    console.log(`AI enabled: ${result.aiEnabled}`);
    console.log(`Provider: ${result.provider}`);
    console.log(`Quality passed: ${result.quality.passed}`);
    if (result.warnings.length > 0) result.warnings.forEach((warning) => console.warn(`Warning: ${warning}`));
    if (result.quality.warnings.length > 0) result.quality.warnings.forEach((warning) => console.warn(`Quality warning: ${warning}`));
    return;
  }

  if (command === 'message:queue') {
    const queue = scanMessageQueue();
    console.log('Message review queue generated: sales-marketing-engine/operator/generated/message-review-queue.md');
    console.log(`Pending review: ${queue.summary.pending_review}`);
    console.log(`Approved but not sent: ${queue.summary.approved}`);
    console.log(`Needs edit: ${queue.summary.needs_edit}`);
    return;
  }

  if (command === 'message:review') {
    const result = reviewMessage({ file: getArg('--file'), status: getArg('--status'), note: getArg('--note') });
    console.log(`Message reviewed: ${result.item.fileName}`);
    console.log(`Status: ${result.item.status}`);
    console.log(`Queue report: sales-marketing-engine/operator/generated/message-review-queue.md`);
    return;
  }

  if (command === 'message:sent') {
    const result = markMessageSent({ file: getArg('--file'), channel: getArg('--channel'), note: getArg('--note') });
    console.log(`Message marked sent: ${result.item.fileName}`);
    console.log(`Status: ${result.item.status}`);
    if (result.nextFollowUpAt) console.log(`Next follow-up: ${result.nextFollowUpAt}`);
    else console.log('Next follow-up: not scheduled');
    console.log('No message was sent automatically.');
    return;
  }

  if (command === 'sources:report') {
    const report = generateSourceQualityReport();
    console.log('Source quality report generated: sales-marketing-engine/operator/generated/source-quality-report.md');
    console.log(`Enabled sources: ${report.summary.enabledSources}`);
    console.log(`Best source: ${report.summary.bestSource}`);
    console.log(`Worst source: ${report.summary.worstSource}`);
    return;
  }

  if (command === 'lead:optimize') {
    const result = await optimizeLeadMessage({ leadId: getArg('--id'), type: getArg('--type') });
    console.log(`Optimized lead message generated: ${result.file}`);
    console.log(`AI enabled: ${result.aiEnabled}`);
    console.log(`Provider: ${result.provider}`);
    console.log(`Quality passed: ${result.quality.passed}`);
    if (result.warnings.length > 0) result.warnings.forEach((warning) => console.warn(`Warning: ${warning}`));
    if (result.quality.warnings.length > 0) result.quality.warnings.forEach((warning) => console.warn(`Quality warning: ${warning}`));
    return;
  }

  throw new Error(`Unknown lead operator command: ${command}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
