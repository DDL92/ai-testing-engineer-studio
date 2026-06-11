import { Lead, OutreachChannel, OutreachStatus } from '../leads/types';
import { OutboundPlan, OutboundRecommendation } from './types';

export function recommendOutreachChannel(lead: Lead): OutreachChannel {
  if (lead.outreachChannel) return lead.outreachChannel;
  if (lead.source.toLowerCase().includes('linkedin') || lead.contactUrl?.includes('linkedin.com')) return 'linkedin';
  if (lead.source.toLowerCase().includes('upwork')) return 'upwork';
  if (lead.contactUrl) return 'manual-other';
  return 'linkedin';
}

export function recommendOutreachStatus(lead: Lead): OutreachStatus {
  if (lead.outreachStatus) return lead.outreachStatus;
  if (lead.status === 'lost') return 'lost';
  if (lead.status === 'paused') return 'paused';
  if (lead.status === 'won') return 'won';
  if (lead.status === 'proposal-sent') return 'proposal-sent';
  if (lead.status === 'audit-ready') return 'audit-offered';
  if (lead.recommendedOffer === 'qa-automation-retainer' || lead.recommendedOffer === 'agency-partner-retainer') {
    return 'retainer-opportunity';
  }
  return 'not-started';
}

export function recommendManualNextAction(lead: Lead): string {
  const status = recommendOutreachStatus(lead);

  if (!lead.contactUrl && !lead.contactName) {
    return 'Research a safe public contact before preparing outreach. Do not scrape or enrich private data.';
  }

  if ((lead.score >= 7 || status === 'retainer-opportunity') && status === 'not-started') {
    return 'Prepare a manual, no-pressure QA Audit message for Daniel review. Do not send automatically.';
  }

  if (status === 'retainer-opportunity') {
    return 'Prepare a manual message or lead pack review focused on QA Audit first, then retainer fit if qualified.';
  }

  if (status === 'contacted' && !lead.nextFollowUpDate) {
    return 'Set a manual follow-up date three business days after contact.';
  }

  if (status === 'follow-up-needed') {
    return 'Review context and prepare a short follow-up draft for Daniel approval.';
  }

  if (status === 'audit-offered') {
    return 'Track response and prepare audit scope only if the lead shows interest.';
  }

  if (status === 'proposal-ready') {
    return 'Review the SOW manually, adjust pricing after discovery, and send only after approval.';
  }

  if (status === 'proposal-sent') {
    return 'Track proposal response and prepare a manual follow-up if appropriate.';
  }

  if (status === 'lost' || status === 'paused') {
    return 'Do not continue outreach unless Daniel manually reopens the lead.';
  }

  return 'Review qualification, confirm contact path, and prepare the next manual action.';
}

export function recommendFollowUpTiming(lead: Lead): string {
  const status = recommendOutreachStatus(lead);

  if (lead.nextFollowUpDate) return `Follow up on ${lead.nextFollowUpDate}.`;
  if (status === 'contacted' || status === 'message-prepared') return 'If sent manually, follow up in 3 business days.';
  if (status === 'audit-offered') return 'If no response, follow up in 3-5 business days.';
  if (status === 'proposal-sent') return 'If no response, follow up in 5 business days.';
  return 'No follow-up date yet. Set one only after Daniel approves and sends a message.';
}

export function buildOutreachChecklist(lead: Lead): string[] {
  return [
    'Confirm the company, website, and contact are correct.',
    'Confirm the lead was manually researched and not scraped.',
    `Confirm offer fit: ${lead.recommendedOffer}.`,
    'Remove unsupported claims, fake metrics, and pressure language.',
    'Do not say an audit was completed unless audit output exists and has been reviewed.',
    'Confirm Daniel approves the message before sending.',
    'Record lastContactedAt and nextFollowUpDate manually after sending.',
  ];
}

export function buildOutboundPlan(lead: Lead): OutboundPlan {
  const recommendation: OutboundRecommendation = {
    channel: recommendOutreachChannel(lead),
    status: recommendOutreachStatus(lead),
    nextAction: recommendManualNextAction(lead),
    followUpTiming: recommendFollowUpTiming(lead),
    checklist: buildOutreachChecklist(lead),
  };

  return {
    lead,
    recommendation,
    manualMessage: buildManualMessage(lead),
    followUpMessage: buildFollowUpMessage(lead),
    safetyReminder: [
      'Manual outreach only.',
      'No messages were sent by this system.',
      'Do not use APIs, scraping, credentials, or CRM integrations.',
      'Human approval is required before outreach, follow-up, proposal, or client communication.',
    ],
  };
}

export function buildManualMessage(lead: Lead): string {
  const greeting = lead.contactName ? `Hi ${lead.contactName},` : `Hi ${lead.companyName} team,`;
  const painPoint = lead.painPoints[0] || 'release confidence';

  return `${greeting} I noticed ${lead.companyName} is in ${lead.industry}. I help teams review QA risk around flows like ${painPoint} and identify safe Playwright smoke test opportunities. If useful, I can share a small QA Audit outline. No pressure.`;
}

export function buildFollowUpMessage(lead: Lead): string {
  const greeting = lead.contactName ? `Hi ${lead.contactName},` : `Hi ${lead.companyName} team,`;
  const painPoint = lead.painPoints[0] || 'core product flows';

  return `${greeting} quick follow-up in case a focused QA Audit around ${painPoint} would be useful. Happy to keep it scoped to a short manual review and clear next steps.`;
}
