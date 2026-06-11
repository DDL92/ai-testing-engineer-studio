import { Lead } from '../leads/types';
import { buildOutboundPlan } from '../outbound/outboundRules';
import { LeadPack, LeadPackInput, LeadPackRecommendation, LeadPackSection } from './types';

export function buildLeadPack(input: LeadPackInput): LeadPack {
  const { lead, score } = input;
  const recommendedOffer = score.recommendedOffer;
  const outboundPlan = buildOutboundPlan(lead);

  return {
    leadId: lead.id,
    companyName: lead.companyName,
    generatedAt: new Date().toISOString(),
    score,
    recommendedOffer,
    sections: [
      leadOverviewSection(lead),
      scoreSection(score.reasons),
      fitAssessmentSection(lead, score.score),
      painPointSection(lead),
      recommendedOfferSection(recommendedOffer),
      auditAngleSection(lead),
      outreachAngleSection(lead),
      outboundStatusSection(lead, outboundPlan),
      contactInformationSection(lead),
      qualificationSummarySection(lead),
      outreachChannelRecommendationSection(outboundPlan),
      manualMessageDraftSection(lead),
      followUpDraftSection(lead),
      manualOutreachChecklistSection(outboundPlan),
      followUpPlanSection(outboundPlan),
      discoveryQuestionsSection(lead),
      proposalAngleSection(lead),
      risksSection(lead),
      recommendedNextActionSection(lead, score.score),
      updatedRecommendedNextActionSection(outboundPlan),
      suggestedCommandsSection(lead),
      safetyReminderSection(),
    ],
    recommendations: buildRecommendations(lead, score.score),
    suggestedNextCommands: suggestedNextCommands(lead),
    safetyReminder: safetyReminder(),
    outboundPlan,
  };
}

function leadOverviewSection(lead: Lead): LeadPackSection {
  return {
    title: 'Lead Overview',
    body: [
      `Company: ${lead.companyName}`,
      `Website: ${lead.website || 'Not provided'}`,
      `Industry: ${lead.industry}`,
      `Source: ${lead.source}`,
      `Status: ${lead.status}`,
      `Current notes: ${lead.fitNotes}`,
    ],
  };
}

function scoreSection(reasons: string[]): LeadPackSection {
  return {
    title: 'Score',
    body: reasons.length > 0 ? reasons : ['No scoring reasons were generated. Review the lead manually before action.'],
  };
}

function fitAssessmentSection(lead: Lead, score: number): LeadPackSection {
  if (lead.recommendedOffer === 'not-fit' || score < 4) {
    return {
      title: 'Fit Assessment',
      body: ['Low fit for current QA Automation offers. Keep paused unless stronger software-product or QA pain evidence appears.'],
    };
  }

  if (score >= 8) {
    return {
      title: 'Fit Assessment',
      body: ['High fit for a manual QA audit or automation-retainer conversation because the lead has strong product and QA pain signals.'],
    };
  }

  return {
    title: 'Fit Assessment',
    body: ['Moderate fit. Review the website and pain points manually before deciding whether to prepare outreach or an audit.'],
  };
}

function painPointSection(lead: Lead): LeadPackSection {
  return {
    title: 'Pain Points',
    body: lead.painPoints.length > 0
      ? lead.painPoints.map((painPoint) => `Review angle: ${painPoint}`)
      : ['No explicit pain points are recorded. Do not invent pain points; review manually first.'],
  };
}

function recommendedOfferSection(recommendedOffer: Lead['recommendedOffer']): LeadPackSection {
  return {
    title: 'Recommended Offer',
    body: [
      `Recommended offer: ${recommendedOffer}`,
      offerReason(recommendedOffer),
    ],
  };
}

function auditAngleSection(lead: Lead): LeadPackSection {
  return {
    title: 'Audit Angle',
    body: [
      lead.website
        ? `Manually review ${lead.website} for the recorded pain points before proposing any audit scope.`
        : 'No website is available, so do not prepare a site audit until a valid target URL is confirmed.',
      `Focus areas from local data: ${lead.painPoints.join(', ') || 'none recorded'}.`,
    ],
  };
}

function outreachAngleSection(lead: Lead): LeadPackSection {
  return {
    title: 'Outreach Angle',
    body: [
      `Use a concise manual-review message focused on ${lead.industry} QA risk and the recorded pain points.`,
      'Do not claim results, metrics, findings, or prior review work that has not been completed.',
    ],
  };
}

function outboundStatusSection(lead: Lead, outboundPlan: ReturnType<typeof buildOutboundPlan>): LeadPackSection {
  return {
    title: 'Outbound Status',
    body: [
      `Current outreach status: ${lead.outreachStatus ?? 'not-started'}`,
      `Recommended outreach status: ${outboundPlan.recommendation.status}`,
      `Last contacted: ${lead.lastContactedAt || 'Not recorded'}`,
      `Next follow-up date: ${lead.nextFollowUpDate || 'Not scheduled'}`,
      `Outbound notes: ${lead.outreachNotes || 'No outbound notes recorded.'}`,
    ],
  };
}

function contactInformationSection(lead: Lead): LeadPackSection {
  return {
    title: 'Contact Information',
    body: [
      `Contact name: ${lead.contactName || 'Not recorded'}`,
      `Contact role: ${lead.contactRole || 'Not recorded'}`,
      `Contact URL: ${lead.contactUrl || 'Not recorded'}`,
      'Use public, manually reviewed contact information only. Do not scrape or enrich private data.',
    ],
  };
}

function qualificationSummarySection(lead: Lead): LeadPackSection {
  return {
    title: 'Qualification Summary',
    body: [
      lead.qualificationSummary || `Score ${lead.score}/10. ${lead.fitNotes || 'Review fit manually before outreach.'}`,
      `Recommended offer: ${lead.recommendedOffer}`,
      `Recorded pain points: ${lead.painPoints.join(', ') || 'None recorded'}`,
    ],
  };
}

function outreachChannelRecommendationSection(outboundPlan: ReturnType<typeof buildOutboundPlan>): LeadPackSection {
  return {
    title: 'Outreach Channel Recommendation',
    body: [
      `Recommended channel: ${outboundPlan.recommendation.channel}`,
      'This is a manual channel recommendation only. The system does not send messages.',
    ],
  };
}

function manualMessageDraftSection(lead: Lead): LeadPackSection {
  const outboundPlan = buildOutboundPlan(lead);

  return {
    title: 'Manual Outreach Draft',
    body: [
      `Manual-review only. Do not send without Daniel approval.`,
      outboundPlan.manualMessage,
    ],
  };
}

function followUpDraftSection(lead: Lead): LeadPackSection {
  const outboundPlan = buildOutboundPlan(lead);

  return {
    title: 'Follow-Up Draft',
    body: [
      'Manual-review only. Do not send without Daniel approval.',
      outboundPlan.followUpMessage,
    ],
  };
}

function manualOutreachChecklistSection(outboundPlan: ReturnType<typeof buildOutboundPlan>): LeadPackSection {
  return {
    title: 'Manual Outreach Checklist',
    body: outboundPlan.recommendation.checklist,
  };
}

function followUpPlanSection(outboundPlan: ReturnType<typeof buildOutboundPlan>): LeadPackSection {
  return {
    title: 'Follow-Up Plan',
    body: [
      outboundPlan.recommendation.followUpTiming,
      'Follow up manually only after Daniel approves the original message and follow-up wording.',
    ],
  };
}

function discoveryQuestionsSection(lead: Lead): LeadPackSection {
  return {
    title: 'Discovery Call Questions',
    body: [
      `Which ${lead.industry} flows create the most release risk today?`,
      'Where do regressions most often reach customers?',
      'What test coverage already exists, and where is it unreliable or missing?',
      'How often do releases happen, and what blocks confident deployment?',
      'What would make a first QA automation engagement clearly valuable within two weeks?',
    ],
  };
}

function proposalAngleSection(lead: Lead): LeadPackSection {
  return {
    title: 'Proposal/SOW Angle',
    body: [
      `Position the proposal around ${lead.recommendedOffer} only after manual review confirms fit.`,
      'Keep scope small: audit evidence, top risks, starter Playwright coverage, and a clear retainer path if recurring QA support is justified.',
    ],
  };
}

function risksSection(lead: Lead): LeadPackSection {
  const risks = [
    lead.website ? '' : 'Missing website blocks audit command generation.',
    lead.recommendedOffer === 'not-fit' ? 'Lead is currently marked not-fit.' : '',
    lead.status === 'lost' || lead.status === 'paused' ? `Lead status is ${lead.status}; avoid outreach unless Daniel reopens it.` : '',
    'Any outreach or proposal must be manually approved.',
  ].filter(Boolean);

  return {
    title: 'Risks / Disqualifiers',
    body: risks,
  };
}

function recommendedNextActionSection(lead: Lead, score: number): LeadPackSection {
  return {
    title: 'Recommended Next Action',
    body: [recommendedNextAction(lead, score)],
  };
}

function updatedRecommendedNextActionSection(outboundPlan: ReturnType<typeof buildOutboundPlan>): LeadPackSection {
  return {
    title: 'Updated Recommended Next Action',
    body: [outboundPlan.recommendation.nextAction],
  };
}

function suggestedCommandsSection(lead: Lead): LeadPackSection {
  return {
    title: 'Suggested Next Commands',
    body: suggestedNextCommands(lead),
  };
}

function safetyReminderSection(): LeadPackSection {
  return {
    title: 'Safety Reminder',
    body: safetyReminder(),
  };
}

function buildRecommendations(lead: Lead, score: number): LeadPackRecommendation[] {
  return [
    {
      label: 'Next manual action',
      reason: `Lead score is ${score}/10 and offer fit is ${lead.recommendedOffer}.`,
      suggestedManualAction: recommendedNextAction(lead, score),
    },
  ];
}

function recommendedNextAction(lead: Lead, score: number): string {
  if (lead.status === 'lost' || lead.status === 'paused' || lead.recommendedOffer === 'not-fit' || score < 4) {
    return 'Keep paused unless new evidence improves fit. Do not send outreach.';
  }

  if (!lead.website) {
    return 'Find or confirm the correct website manually before preparing an audit or outreach.';
  }

  if (lead.recommendedOffer === 'agency-partner-retainer') {
    return 'Manually review agency fit, then draft a partner-retainer angle for Daniel approval.';
  }

  if (lead.recommendedOffer === 'qa-automation-retainer') {
    return 'Prepare a scoped QA audit angle first, then decide whether a retainer conversation is justified.';
  }

  return lead.nextAction;
}

function suggestedNextCommands(lead: Lead): string[] {
  const commands = [];

  if (lead.website) {
    commands.push(`npm run audit:site -- --url ${lead.website}`);
  }

  commands.push(`npm run sow:generate -- --id ${lead.id}`);
  commands.push('npm run day:plan');

  return commands;
}

function safetyReminder(): string[] {
  return [
    'This pack is for manual review only.',
    'Do not auto-send outreach.',
    'Daniel approves all client communication.',
    'Do not invent claims, metrics, audit findings, or client-specific facts.',
    'Use only local lead data unless Daniel explicitly approves more research.',
  ];
}

function offerReason(recommendedOffer: Lead['recommendedOffer']): string {
  if (recommendedOffer === 'qa-automation-retainer') {
    return 'Use when the lead shows recurring QA risk and enough product complexity to justify ongoing automation support.';
  }

  if (recommendedOffer === 'agency-partner-retainer') {
    return 'Use when the lead may need recurring QA support across multiple client projects.';
  }

  if (recommendedOffer === 'playwright-starter-pack') {
    return 'Use when a small first Playwright engagement is the clearest next step.';
  }

  if (recommendedOffer === 'qa-audit') {
    return 'Use when a focused audit is the safest first offer.';
  }

  return 'Do not prioritize outreach unless the lead is manually requalified.';
}
