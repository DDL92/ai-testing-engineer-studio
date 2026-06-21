import type { SalesPackContext } from './salesTypes';

export function renderOutreachDrafts(context: SalesPackContext): string {
  const { record, recommendedChannel, recommendedCTA, fictional } = context;
  const business = record.lead.companyName;
  const location = record.location ? ` in ${record.location}` : '';
  const observation = evidenceObservation(context);
  const fixtureNotice = fictional
    ? '\n\n> Fictional validation draft: this business and all outreach below are test-only. Do not send.'
    : '';

  return `# Outreach Drafts: ${business}
${fixtureNotice}

All drafts are editable and require manual approval. Recommended channel: **${recommendedChannel}**.

## 1. Short email

**Subject:** Conceptual homepage idea for ${business}

Hello [RECIPIENT NAME],

I noticed ${observation} for ${business}${location}. A clear, dedicated homepage could make it easier for visitors to understand the business and find the right next step, subject to confirming the current website situation.

I prepared a conceptual homepage demo using only the supplied category and location context. It is not a finished site and includes clearly labeled placeholders that require confirmation.

Would you be open to ${recommendedCTA}?

[OPERATOR NAME]  
[OPERATOR ROLE / BUSINESS]  
[VERIFIED CONTACT DETAILS]

## 2. LinkedIn or direct-message version

Hello — I noticed ${observation} for ${business}${location}. I created a conceptual homepage direction that could make the business and next step clearer, but it is not a finished site and its placeholders require confirmation. Would you be open to ${recommendedCTA}? — [OPERATOR NAME]

## 3. Follow-up message

Hello — following up once on the conceptual homepage idea for ${business}. It uses only supplied context and requires review. If it is not relevant, no problem—please let me know and I will close the loop. Would you be open to ${recommendedCTA}? — [OPERATOR NAME]

No message was sent, scheduled, attached, or saved outside this Markdown file.
`;
}

function evidenceObservation(context: SalesPackContext): string {
  const signal = context.leadPack.verifiedOpportunitySignals[0];
  if (signal === 'social-only presence') {
    return 'the available evidence currently records a social-only presence';
  }
  if (signal) return `the available evidence records ${signal}`;
  if (context.audit.reachable) return 'the public website inspection completed';
  return 'the current website situation requires confirmation';
}
