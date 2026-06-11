import { AuditResult } from '../../../qa-audit-runner/src/types/audit';
import { recommendedOffer, suggestedPrice } from '../scoring/scorer';
import { Lead } from '../types/lead';

export function buildAuditBasedProposalMarkdown(lead: Lead, audit: AuditResult): string {
  const offer = recommendedAuditOffer(lead, audit);
  const findings = audit.findings.map((finding) => `- ${finding.severity.toUpperCase()}: ${finding.title} - ${finding.details}`).join('\n');
  const hasIssues = audit.findings.some((finding) => finding.severity === 'medium' || finding.severity === 'high');

  return `# Audit-Based Proposal Draft: ${lead.companyName}

Human review required before sending. This draft references only the public-page audit output saved locally.

## Lead Details

- Lead ID: ${lead.id}
- Company: ${lead.companyName}
- Website: ${lead.website}
- Source: ${lead.source}
- Score: ${lead.score}/100
- Status: ${lead.status}

## Website Audited

- Audited URL: ${audit.targetUrl}
- Final URL: ${audit.finalUrl}
- Audit timestamp: ${audit.timestamp}
- Screenshot: ${audit.screenshot}

## Actual Audit Findings

${findings}

## QA Risks

- This was a quick public-page QA audit, not an authenticated product audit.
- Public-page issues may indicate gaps in regression checks, release smoke tests, or monitoring.
- Authenticated flows, dashboards, checkout, and account workflows still need validation if they exist.

## Automation Opportunities

- Add Playwright smoke coverage for public pages and core navigation.
- Add console/network error checks for business-critical pages.
- Add form validation coverage if public or authenticated forms are part of the product.
- Add CI reporting with trace, screenshots, and HTML report on failure.

## Suggested Message

Hi ${lead.contactName || 'there'}, I ran a quick public-page QA audit for ${lead.companyName} at ${audit.targetUrl}.

${hasIssues ? 'I noticed a few QA signals worth reviewing, including captured findings in the audit report.' : 'The public page looked clean in this quick pass, which makes it a good starting point for a deeper conversation about authenticated flows or smoke test setup.'}

I noticed potential automation opportunities around public-page smoke checks, navigation coverage, and release confidence. A deeper audit would validate this further, especially for login-only or dashboard workflows if those are part of the product.

Would it be useful if I sent a short summary and suggested next steps?

## Suggested Offer

- Offer: ${offer}
- Suggested price: ${suggestedPrice(offer)}

## Suggested Next Action

Review the audit output, personalize this draft with real context, then send manually only if the company is still a good fit.

## Follow-Up Sequence

### Follow-up Day 2

Hi ${lead.contactName || 'there'}, quick follow-up on the public-page QA audit. The next useful step would be a focused review of the highest-risk product flows and a short Playwright smoke test plan.

### Follow-up Day 5

Hi ${lead.contactName || 'there'}, if regression prevention is on the roadmap, I can keep this practical: validate the main workflows, identify automation gaps, and recommend the first Playwright checks worth adding.

### Follow-up Day 9

Hi ${lead.contactName || 'there'}, checking once more. The quick audit only covered public pages, so a deeper audit would be the right way to validate private app flows before making larger QA decisions.

### Final Soft Follow-up

Hi ${lead.contactName || 'there'}, I will close the loop here. If QA automation or Playwright coverage becomes a priority, I can share the public-page audit summary and next-step options.
`;
}

function recommendedAuditOffer(lead: Lead, audit: AuditResult): string {
  const issueCount = audit.consoleErrors.length + audit.failedNetworkRequests.length + audit.findings.filter((finding) => finding.severity === 'medium' || finding.severity === 'high').length;

  if (issueCount >= 3) return '$900 Playwright Starter Pack';
  if (issueCount > 0) return '$199 Detailed QA Audit';
  if (lead.score >= 80) return '$1,500/month QA Automation Maintenance';
  return 'Free Mini QA Audit';
}
