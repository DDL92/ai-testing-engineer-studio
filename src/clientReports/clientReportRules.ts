import { Client, ClientReport, ClientReportSection } from './types';

export function buildClientReport(client: Client): ClientReport {
  return {
    clientId: client.id,
    companyName: client.companyName,
    generatedAt: new Date().toISOString(),
    sections: [
      executiveSummarySection(client),
      workCompletedSection(client),
      currentCoverageSection(client),
      keyRisksSection(client),
      automationOpportunitiesSection(client),
      recommendedNextStepsSection(client),
      retainerValueSection(client),
      nextWeekFocusSection(client),
      manualReviewSection(),
    ],
  };
}

function executiveSummarySection(client: Client): ClientReportSection {
  return {
    title: 'Executive Summary',
    body: [
      `${client.companyName} is currently marked ${client.status} for ${client.serviceType}.`,
      `Current focus: ${client.currentFocus}`,
      'This report uses local demo data only and should be manually reviewed before sharing.',
    ],
  };
}

function workCompletedSection(client: Client): ClientReportSection {
  return {
    title: 'Work Completed',
    body: client.completedWork.length > 0
      ? client.completedWork
      : ['No completed work is recorded in local data for this reporting period.'],
  };
}

function currentCoverageSection(client: Client): ClientReportSection {
  return {
    title: 'Current QA Coverage',
    body: [
      coverageDescription(client),
      'Coverage should be treated as partial unless linked evidence confirms broader workflow coverage.',
    ],
  };
}

function keyRisksSection(client: Client): ClientReportSection {
  return {
    title: 'Key Risks / Open Items',
    body: client.openRisks.length > 0
      ? client.openRisks
      : ['No open risks are recorded in local data. Confirm manually before reporting risk status externally.'],
  };
}

function automationOpportunitiesSection(client: Client): ClientReportSection {
  return {
    title: 'Automation Opportunities',
    body: automationOpportunities(client),
  };
}

function recommendedNextStepsSection(client: Client): ClientReportSection {
  return {
    title: 'Recommended Next Steps',
    body: client.recommendedNextSteps.length > 0
      ? client.recommendedNextSteps
      : ['Review current scope and define one safe next QA action.'],
  };
}

function retainerValueSection(client: Client): ClientReportSection {
  const feeText = client.monthlyFee > 0 ? `$${client.monthlyFee}/month` : 'not recorded';

  return {
    title: 'Retainer Value Summary',
    body: [
      `Recorded monthly fee: ${feeText}.`,
      'Value is described through delivered work, risk visibility, and clearer next actions; this report does not claim exact ROI.',
      client.serviceType.includes('retainer')
        ? 'The retainer should stay focused on bounded QA coverage, failure review, and recurring reporting.'
        : 'This engagement can support a future retainer only if recurring QA needs are confirmed.',
    ],
  };
}

function nextWeekFocusSection(client: Client): ClientReportSection {
  return {
    title: 'Next-Week Focus',
    body: [
      client.recommendedNextSteps[0] || client.currentFocus,
      'Confirm priorities with Daniel before committing to client-facing scope.',
    ],
  };
}

function manualReviewSection(): ClientReportSection {
  return {
    title: 'Manual Review Note',
    body: [
      'Review this report before sending.',
      'Do not add metrics, findings, or client claims unless supported by reviewed evidence.',
      'Send manually only after Daniel approves the content.',
    ],
  };
}

function coverageDescription(client: Client): string {
  if (client.serviceType === 'qa-audit') {
    return 'Current coverage is audit-focused and should be described as findings and recommendations, not ongoing automated coverage.';
  }

  if (client.serviceType === 'playwright-starter-pack') {
    return 'Current coverage is starter-level Playwright smoke coverage for approved flows only.';
  }

  return 'Current coverage is bounded retainer support for approved workflows and should not be described as full product coverage.';
}

function automationOpportunities(client: Client): string[] {
  const base = [
    'Add or maintain smoke coverage for the highest-risk approved workflow.',
    'Keep screenshots, traces, and HTML reports available for failure review where configured.',
  ];

  if (client.serviceType === 'playwright-starter-pack') {
    return [...base, 'Identify whether the starter suite should become a small monthly maintenance retainer.'];
  }

  if (client.serviceType.includes('retainer')) {
    return [...base, 'Review recurring failures and convert stable patterns into maintainable regression coverage.'];
  }

  return [...base, 'Use audit findings to choose one safe automation candidate.'];
}
