import { recommendOutreachChannel } from '../outbound/outboundRules';
import { Lead, LeadScoreResult } from '../leads/types';
import { LocalSourceStatus, OutreachAngle, OutreachPack, OutreachPackDocument, OutreachPackInput } from './types';

const targetContactRoles = [
  'Head of Engineering',
  'VP Engineering',
  'CTO',
  'QA Manager',
  'Product Manager',
  'Founder',
  'Operations Lead',
];

export function buildOutreachPack(input: OutreachPackInput): OutreachPack {
  const channel = recommendOutreachChannel(input.lead);
  const angle = buildOutreachAngle(input.lead, input.score, hasLocalAuditEvidence(input));

  return {
    leadId: input.lead.id,
    companyName: input.lead.companyName,
    generatedAt: new Date().toISOString(),
    channel,
    angle,
    documents: [
      contactStrategy(input, channel, angle),
      linkedInMessage(input, angle),
      emailDraft(input, angle),
      followUpOne(input, angle),
      followUpTwo(input),
      callInvite(input, angle),
      safetyChecklist(input),
    ],
  };
}

export function isQualifiedForOutreachPack(lead: Lead, score: LeadScoreResult): boolean {
  if (lead.status === 'lost' || lead.status === 'paused') return false;
  if (score.recommendedOffer === 'not-fit') return false;
  return score.score >= 4;
}

export function qualificationFailureReason(lead: Lead, score: LeadScoreResult): string {
  if (lead.status === 'lost' || lead.status === 'paused') {
    return `Lead status is ${lead.status}. Reopen or requalify the lead before generating outreach assets.`;
  }

  if (score.recommendedOffer === 'not-fit') {
    return 'Lead is currently scored as not-fit. Add stronger QA-fit evidence before generating outreach assets.';
  }

  return `Lead score is ${score.score}/10. Require at least 4/10 before generating outreach assets.`;
}

function contactStrategy(input: OutreachPackInput, channel: string, angle: OutreachAngle): OutreachPackDocument {
  const { lead, score } = input;

  return doc('contact-strategy.md', `Contact Strategy: ${lead.companyName}`, [
    `# Contact Strategy: ${lead.companyName}`,
    '',
    '## Lead Summary',
    '',
    bullets([
      `Company: ${lead.companyName}`,
      `Website: ${lead.website || 'Not provided'}`,
      `Industry: ${lead.industry}`,
      `Score: ${score.score}/10`,
      `Recommended offer: ${score.recommendedOffer}`,
      `Status: ${lead.status}`,
    ]),
    '',
    '## Best Outreach Channel',
    '',
    bullets([
      `Recommended channel: ${channel}`,
      'Use this as a manual channel recommendation only. This command does not send messages or automate any platform.',
    ]),
    '',
    '## Target Contact Roles',
    '',
    bullets(targetContactRoles),
    '',
    '## Why This Lead Is Worth Contacting',
    '',
    bullets([
      `Local fit notes: ${lead.fitNotes || 'No fit notes recorded.'}`,
      `Local pain points: ${lead.painPoints.join(', ') || 'None recorded.'}`,
      `Outreach angle: ${angle.summary}`,
    ]),
    '',
    '## Suggested Angle',
    '',
    bullets([
      angle.summary,
      `${angle.auditPhrase} focused on practical QA risk and safe Playwright smoke coverage.`,
      'Keep the message short, no-pressure, and manually reviewed.',
    ]),
    '',
    '## Evidence Available',
    '',
    bullets(evidenceSummary(input)),
    '',
    '## Recommended Manual Next Step',
    '',
    bullets([
      'Find a real contact manually from public sources.',
      'Review the selected LinkedIn or email draft.',
      'Confirm the draft contains no unsupported claims or invented audit findings.',
      'Send manually only after Daniel approves.',
    ]),
    '',
    '## Do Not Claim',
    '',
    bullets(doNotClaim(input)),
    '',
    '## Approval Checklist',
    '',
    checklist(approvalChecklist()),
  ]);
}

function linkedInMessage(input: OutreachPackInput, angle: OutreachAngle): OutreachPackDocument {
  const { lead } = input;

  return doc('linkedin-message.md', `LinkedIn Message: ${lead.companyName}`, [
    `# LinkedIn Message: ${lead.companyName}`,
    '',
    '## Connection Request Version',
    '',
    `Hi ${lead.companyName} team - I work with ${lead.industry} teams on practical QA risk reviews and Playwright smoke coverage. Thought it may be useful to connect. No pressure either way.`,
    '',
    '## First Message Version',
    '',
    `Hi ${lead.companyName} team - I noticed ${lead.companyName} is in the ${lead.industry} space. I help teams review QA risk around ${angle.painPointText} and turn the highest-value checks into repeatable Playwright coverage.`,
    '',
    `${angle.auditPhrase} that stays scoped to public or approved flows, avoids credentials, and focuses on practical next steps. If useful, I can send a short outline for review. No pressure.`,
    '',
    '## Manual Review Note',
    '',
    bullets([
      'Replace the team greeting only after a real contact is found manually.',
      'Do not add fake personalization, fake results, fake urgency, or unsupported findings.',
      'Human approval is required before sending this manually.',
    ]),
  ]);
}

function emailDraft(input: OutreachPackInput, angle: OutreachAngle): OutreachPackDocument {
  const { lead } = input;

  return doc('email-draft.md', `Email Draft: ${lead.companyName}`, [
    `# Email Draft: ${lead.companyName}`,
    '',
    '## Subject Line Options',
    '',
    bullets([
      `QA audit idea for ${lead.companyName}`,
      `Small Playwright QA review for ${lead.companyName}`,
      `${lead.industry} QA risk review`,
    ]),
    '',
    '## Email Body',
    '',
    `Hi ${lead.companyName} team,`,
    '',
    `I work with software teams on practical QA risk reviews and Playwright smoke test coverage. Based on the local notes I have for ${lead.companyName}, the relevant areas appear to be ${angle.painPointText}.`,
    '',
    `${angle.auditPhrase} that keeps scope small: review the approved public/product flow, identify the highest-risk QA areas, and recommend a few repeatable Playwright checks.`,
    '',
    'Would a short outline be useful for whoever owns QA, product quality, or release confidence?',
    '',
    'No pressure either way.',
    '',
    'Daniel',
    '',
    '## Manual Review Note',
    '',
    bullets([
      'Send only after Daniel approves the contact, wording, and evidence.',
      'Do not claim completed audit findings unless the local audit files have been reviewed.',
      'Do not use aggressive sales language, fake personalization, or automated sending.',
    ]),
  ]);
}

function followUpOne(input: OutreachPackInput, angle: OutreachAngle): OutreachPackDocument {
  const { lead } = input;

  return doc('follow-up-1.md', `Follow-Up 1: ${lead.companyName}`, [
    `# Follow-Up 1: ${lead.companyName}`,
    '',
    `Hi ${lead.companyName} team - quick follow-up in case a small QA audit outline around ${angle.painPointText} would be useful.`,
    '',
    'I can keep it lightweight: a short risk summary, practical Playwright opportunities, and clear next steps. No pressure if this is not a priority.',
    '',
    '## Manual Review Note',
    '',
    bullets([
      'Do not send automatically.',
      'Send only if Daniel manually sent the first message and chooses to follow up.',
      'Track the follow-up date manually.',
    ]),
  ]);
}

function followUpTwo(input: OutreachPackInput): OutreachPackDocument {
  const { lead } = input;

  return doc('follow-up-2.md', `Follow-Up 2: ${lead.companyName}`, [
    `# Follow-Up 2: ${lead.companyName}`,
    '',
    `Hi ${lead.companyName} team - closing the loop on this. If reviewing QA risk or Playwright smoke coverage becomes useful later, happy to share a small scoped outline.`,
    '',
    'No need to reply if now is not the right time.',
    '',
    '## Manual Review Note',
    '',
    bullets([
      'No guilt language, urgency tricks, or fake scarcity.',
      'Do not send automatically.',
      'Archive or update the lead manually after this follow-up.',
    ]),
  ]);
}

function callInvite(input: OutreachPackInput, angle: OutreachAngle): OutreachPackDocument {
  const { lead } = input;

  return doc('call-invite.md', `Call Invite: ${lead.companyName}`, [
    `# Call Invite: ${lead.companyName}`,
    '',
    `If useful, I can walk through a 15-minute QA audit outline for ${lead.companyName}.`,
    '',
    'Scope would stay simple:',
    '',
    bullets([
      `Review the known QA risk areas around ${angle.painPointText}.`,
      'Identify safe Playwright smoke-test opportunities.',
      'Confirm what should not be tested without explicit approval.',
      'Agree whether a small audit, starter suite, or no action is the right next step.',
    ]),
    '',
    'No guaranteed results, no production claims, and no credentialed testing without explicit approval.',
    '',
    '## Manual Review Note',
    '',
    bullets([
      'Daniel must approve the invite before sending.',
      'Use a real scheduling method manually; this command does not create calendar links or send invites.',
    ]),
  ]);
}

function safetyChecklist(input: OutreachPackInput): OutreachPackDocument {
  const { lead } = input;

  return doc('safety-checklist.md', `Safety Checklist: ${lead.companyName}`, [
    `# Safety Checklist: ${lead.companyName}`,
    '',
    checklist([
      'Contact was found manually through public sources',
      'Message reviewed by Daniel',
      'No unsupported claims',
      'No fake metrics',
      'No fake audit results',
      'No automated sending',
      'No scraping',
      'No private data used',
      'Correct company name',
      'Correct website',
      'Follow-up date manually tracked',
    ]),
    '',
    '## Local Evidence Check',
    '',
    bullets(evidenceSummary(input)),
    '',
    '## Human Approval Required',
    '',
    bullets([
      'Do not send outreach until Daniel approves the contact, channel, message, and evidence.',
      'Do not automate LinkedIn, email, CRM updates, scraping, or follow-ups.',
      `Confirm company name is ${lead.companyName}.`,
      `Confirm website is ${lead.website || 'not recorded'}.`,
    ]),
  ]);
}

function buildOutreachAngle(lead: Lead, score: LeadScoreResult, auditExists: boolean): OutreachAngle {
  const painPointText = relevantPainPoints(lead);
  const auditPhrase = auditExists
    ? 'I put together a small QA audit outline'
    : 'I can put together a small QA audit outline';

  if (score.recommendedOffer === 'agency-partner-retainer') {
    return {
      summary: 'Lead with partner QA support for repeatable client launches and maintenance workflows.',
      auditPhrase,
      painPointText,
    };
  }

  if (score.score >= 8 && score.recommendedOffer === 'qa-automation-retainer') {
    return {
      summary: 'Lead with QA risk plus repeatable Playwright coverage for recurring release confidence.',
      auditPhrase,
      painPointText,
    };
  }

  if (score.score >= 6 && score.score <= 7) {
    return {
      summary: 'Lead with a small QA audit offer before proposing larger automation scope.',
      auditPhrase,
      painPointText,
    };
  }

  return {
    summary: 'Lead with a cautious QA audit outline and avoid larger scope until interest is confirmed.',
    auditPhrase,
    painPointText,
  };
}

function relevantPainPoints(lead: Lead): string {
  const localPainPoints = lead.painPoints.map((painPoint) => painPoint.toLowerCase());
  const allowedTerms = ['booking', 'onboarding', 'mobile', 'payment', 'regression'];
  const matched = allowedTerms.filter((term) => localPainPoints.some((painPoint) => painPoint.includes(term)));

  if (matched.length > 0) return matched.join(', ');
  if (lead.painPoints.length > 0) return lead.painPoints.slice(0, 3).join(', ');
  return 'core product flows and release confidence';
}

function hasLocalAuditEvidence(input: OutreachPackInput): boolean {
  return input.auditPack.exists || input.auditReport.exists;
}

function evidenceSummary(input: OutreachPackInput): string[] {
  return [
    `${input.researchPack.label}: ${input.researchPack.exists ? input.researchPack.path : `missing at ${input.researchPack.path}`}`,
    `${input.auditPack.label}: ${input.auditPack.exists ? input.auditPack.path : `missing at ${input.auditPack.path}`}`,
    `${input.auditReport.label}: ${input.auditReport.exists ? input.auditReport.path : `missing at ${input.auditReport.path}`}`,
  ];
}

function doNotClaim(input: OutreachPackInput): string[] {
  const claims = [
    'Do not claim a specific defect, metric, conversion issue, compliance gap, or production risk unless manually verified.',
    'Do not claim private product knowledge, internal priorities, or a named stakeholder.',
    'Do not claim a completed audit unless local audit report or audit pack files exist and Daniel has reviewed them.',
  ];

  if (!hasLocalAuditEvidence(input)) {
    claims.push('No local audit evidence was detected, so message copy must frame the audit as an offer, not completed work.');
  }

  return claims;
}

function approvalChecklist(): string[] {
  return [
    'Correct company and website confirmed.',
    'Real contact found manually through public sources.',
    'Message contains no invented contact names.',
    'Message contains no invented audit findings.',
    'Human approval given before sending.',
  ];
}

function doc(fileName: OutreachPackDocument['fileName'], title: string, lines: string[]): OutreachPackDocument {
  return {
    fileName,
    title,
    body: `${lines.join('\n').trim()}\n`,
  };
}

function bullets(lines: string[]): string {
  return lines.map((line) => `- ${line}`).join('\n');
}

function checklist(lines: string[]): string {
  return lines.map((line) => `- [ ] ${line}`).join('\n');
}
