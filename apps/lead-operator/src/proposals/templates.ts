import { Lead } from '../types/lead';
import { suggestedPrice } from '../scoring/scorer';

export function buildProposalMarkdown(lead: Lead): string {
  const scoreReasons = [
    ...lead.scoreBreakdown.positive,
    ...lead.scoreBreakdown.negative,
  ].join('\n- ');
  const recommendedChannel = lead.contactEmail ? 'Cold email' : lead.linkedinUrl ? 'LinkedIn DM' : 'Manual review';

  return `# Lead Proposal Draft: ${lead.companyName}

Human review required before any outreach is sent.

## Lead Details

- Lead ID: ${lead.id}
- Company: ${lead.companyName}
- Website: ${lead.website || 'Not provided'}
- Contact: ${lead.contactName || 'Not provided'}
- Role: ${lead.contactRole || 'Not provided'}
- Email: ${lead.contactEmail || 'Not provided'}
- LinkedIn: ${lead.linkedinUrl || 'Not provided'}
- Source: ${lead.source}
- Source URL: ${lead.sourceUrl || 'Not provided'}
- Status: ${lead.status}

## Score

- Score: ${lead.score}/100
- Category: ${lead.scoreBreakdown.category}
- Score reason:
- ${scoreReasons || 'No scoring signals captured.'}

## Recommendation

- Recommended channel: ${recommendedChannel}
- Recommended offer: ${lead.suggestedOffer}
- Suggested price: ${suggestedPrice(lead.suggestedOffer)}
- Next action: ${lead.nextAction}

## Suggested Message

${firstMessage(lead)}

## Follow-Up Sequence

### Follow-up Day 2

${followUpDay2(lead)}

### Follow-up Day 5

${followUpDay5(lead)}

### Follow-up Day 9

${followUpDay9(lead)}

### Final Soft Follow-up

${finalFollowUp(lead)}
`;
}

export function firstMessage(lead: Lead): string {
  return `Hi ${lead.contactName || 'there'}, I noticed ${lead.companyName} looks like a fit for practical QA automation support. I work with Playwright, TypeScript, CI/CD, API testing, regression prevention, and AI-assisted QA reporting.

I can run a quick Playwright-based QA audit on your web app and send a short report with QA risks, screenshots, automation opportunities, and recommended next steps.

Would it be useful if I sent over a concise audit outline for ${lead.website || 'your site'}?`;
}

export function coldEmail(lead: Lead): string {
  return `Subject: Quick Playwright QA audit for ${lead.companyName}

Hi ${lead.contactName || 'there'},

I help web product teams reduce regression risk with Playwright, TypeScript, CI/CD, API testing, and practical QA automation strategy.

I can run a quick Playwright-based QA audit on your web app and send a short report with QA risks, screenshots, automation opportunities, and recommended next steps.

Open to me sending a short outline?`;
}

export function upworkProposal(lead: Lead): string {
  return `Hi, I can help with a focused Playwright + TypeScript QA automation audit first, then turn the highest-risk workflows into maintainable tests if the audit confirms the fit.

My approach is practical: identify critical flows, check current QA risks, build stable tests with readable locators, and deliver notes your team can keep using.`;
}

export function instagramDm(lead: Lead): string {
  return `Hi ${lead.companyName}, I help web app teams with Playwright QA automation and regression prevention. I can run a quick audit and share a short report with risks, screenshots, and next steps.`;
}

function followUpDay2(lead: Lead): string {
  return `Hi ${lead.contactName || 'there'}, quick follow-up. The audit would stay lightweight: one pass over the web app, a short report, and practical automation opportunities.`;
}

function followUpDay5(lead: Lead): string {
  return `Hi ${lead.contactName || 'there'}, if QA automation is on the roadmap, I can start with a small audit so ${lead.companyName} can see risks before committing to a larger project.`;
}

function followUpDay9(lead: Lead): string {
  return `Hi ${lead.contactName || 'there'}, checking once more. A focused Playwright audit is often enough to identify the first smoke tests and CI checks worth adding.`;
}

function finalFollowUp(lead: Lead): string {
  return `Hi ${lead.contactName || 'there'}, I will close the loop here. If regression prevention or Playwright coverage becomes a priority for ${lead.companyName}, I can share a concise audit outline.`;
}
