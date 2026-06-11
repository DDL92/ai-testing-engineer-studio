import type { Lead, OutreachRecord } from '../types/lead';

export type MessageType =
  | 'linkedin_dm'
  | 'cold_email'
  | 'instagram_dm'
  | 'upwork_proposal'
  | 'follow_up'
  | 'audit_based_proposal'
  | 'objection_response'
  | 'closing_message';

export const supportedMessageTypes: MessageType[] = [
  'linkedin_dm',
  'cold_email',
  'instagram_dm',
  'upwork_proposal',
  'follow_up',
  'audit_based_proposal',
  'objection_response',
  'closing_message',
];

export interface MessageOptimizationInput {
  type: MessageType;
  draft: string;
  lead?: Lead;
  auditFindings?: string;
  proposalDrafts?: string[];
  leadReview?: string;
  outreachHistory?: OutreachRecord[];
}

export function parseMessageType(value: string | undefined): MessageType {
  if (supportedMessageTypes.includes(value as MessageType)) return value as MessageType;
  throw new Error(`Unsupported --type. Use one of: ${supportedMessageTypes.join(', ')}`);
}

export function buildOptimizerPrompt(input: MessageOptimizationInput): string {
  return [
    'Improve this business message for Daniel, a Senior QA Automation Engineer specializing in Playwright and TypeScript.',
    '',
    'Safety constraints:',
    '- Preserve accuracy.',
    '- Do not overclaim.',
    '- Do not invent audit findings, private app access, bugs, metrics, or prior relationships.',
    '- Do not imply any message will be sent automatically.',
    '- Keep the message human, concise, specific, and review-ready.',
    '- Include a clear but low-pressure CTA.',
    '',
    `Message type: ${input.type}`,
    input.lead ? leadContext(input.lead) : '',
    input.auditFindings ? `Audit findings available:\n${input.auditFindings}` : 'Audit findings available: none provided.',
    input.leadReview ? `Lead review context:\n${input.leadReview.slice(0, 3000)}` : '',
    input.outreachHistory?.length ? `Outreach history:\n${input.outreachHistory.map((record) => `- ${record.sentAt}: ${record.channel}, ${record.messageType}, next ${record.nextFollowUpAt}. ${record.note}`).join('\n')}` : 'Outreach history: none provided.',
    '',
    'Draft to improve:',
    input.draft,
    '',
    'Return only the optimized message body. Do not add metadata.',
  ].filter(Boolean).join('\n');
}

export function leadContext(lead: Lead): string {
  return [
    'Lead context:',
    `- Company: ${lead.companyName}`,
    `- Website: ${lead.website || 'missing'}`,
    `- Score: ${lead.score}/100 (${lead.scoreBreakdown.category})`,
    `- QA fit: ${lead.qaFitReason || 'not documented'}`,
    `- Pain point: ${lead.detectedPainPoint || 'not documented'}`,
    `- Suggested offer: ${lead.suggestedOffer || 'not set'}`,
    `- Status: ${lead.status}`,
  ].join('\n');
}
