import fs = require('fs');
import path = require('path');
import { Lead } from '../leads/types';
import { SowCoreOffer, SowDeliverable, SowDraft, SowOffer, SowPricingOption, SowSection } from './types';

export function buildSowDraft(input: { lead: Lead; score: number; recommendedOffer: Lead['recommendedOffer'] }): SowDraft {
  const auditReportPath = detectAuditReportPath(input.lead.website);
  const hasAuditAutomationOpportunities = auditReportPath ? auditHasAutomationOpportunities(auditReportPath) : false;
  const recommendedSowOffer = selectSowOffer(input.score, input.recommendedOffer, hasAuditAutomationOpportunities);
  const pricingOptions = buildPricingOptions(recommendedSowOffer);
  const deliverables = buildDeliverables(recommendedSowOffer);

  return {
    leadId: input.lead.id,
    companyName: input.lead.companyName,
    generatedAt: new Date().toISOString(),
    recommendedOffer: input.recommendedOffer,
    recommendedSowOffer,
    score: input.score,
    auditReportPath,
    hasAuditAutomationOpportunities,
    sections: buildSections(input.lead, input.score, recommendedSowOffer, auditReportPath, hasAuditAutomationOpportunities, deliverables, pricingOptions),
    deliverables,
    pricingOptions,
  };
}

function buildSections(
  lead: Lead,
  score: number,
  recommendedSowOffer: SowOffer,
  auditReportPath: string | undefined,
  hasAuditAutomationOpportunities: boolean,
  deliverables: SowDeliverable[],
  pricingOptions: SowPricingOption[],
): SowSection[] {
  return [
    executiveSummarySection(lead, score, recommendedSowOffer),
    whyThisMattersSection(),
    currentOpportunitySection(lead, auditReportPath, hasAuditAutomationOpportunities),
    recommendedServicePathSection(recommendedSowOffer),
    pricingSection(pricingOptions),
    recommendedPackageSection(recommendedSowOffer, score, hasAuditAutomationOpportunities),
    scopeSection(lead, recommendedSowOffer),
    deliverablesSection(deliverables),
    timelineSection(recommendedSowOffer),
    successCriteriaSection(recommendedSowOffer),
    upgradePathSection(recommendedSowOffer),
    assumptionsSection(auditReportPath),
    outOfScopeSection(),
    clientResponsibilitiesSection(),
    termsNotesSection(),
    nextStepSection(),
    manualReviewSection(),
  ];
}

function executiveSummarySection(lead: Lead, score: number, recommendedSowOffer: SowOffer): SowSection {
  return {
    title: 'Executive Summary',
    body: [
      `${lead.companyName} appears to have a QA opportunity around ${lead.painPoints.join(', ') || 'release confidence and repeatable testing'}.`,
      `Based on the current local lead score of ${score}/10, the recommended package is ${recommendedSowOffer}.`,
      'This draft is designed to reduce release risk, catch regressions earlier, and make QA more repeatable without promising perfect quality or guaranteed business outcomes.',
    ],
  };
}

function whyThisMattersSection(): SowSection {
  return {
    title: 'Why This Matters',
    body: [
      'Small regressions in important product flows can create support load, lost trust, and slower releases.',
      'A focused QA engagement helps identify the first workflows worth protecting before building a larger automation program.',
      'Playwright smoke coverage can make release checks more repeatable and give the team clearer evidence when something breaks.',
    ],
  };
}

function currentOpportunitySection(lead: Lead, auditReportPath: string | undefined, hasAuditAutomationOpportunities: boolean): SowSection {
  const auditLine = auditReportPath
    ? `A local audit report was detected at ${auditReportPath}. Review it manually before referencing any finding externally.`
    : 'No matching local audit report was detected for this lead, so this draft does not claim audit findings, performance scores, or accessibility results.';

  return {
    title: 'Current QA Opportunity',
    body: [
      `Industry/context: ${lead.industry}.`,
      `Known notes: ${lead.fitNotes}`,
      `Potential QA focus areas from local data: ${lead.painPoints.join(', ') || 'none recorded'}.`,
      auditLine,
      hasAuditAutomationOpportunities
        ? 'The detected audit report includes automation opportunity language, so a starter automation package may be appropriate after manual review.'
        : 'No audit-backed automation opportunity is being claimed in this draft.',
    ],
  };
}

function recommendedServicePathSection(recommendedSowOffer: SowOffer): SowSection {
  return {
    title: 'Recommended Service Path',
    body: [
      `Recommended path: ${recommendedSowOffer}.`,
      'The recommendation is deterministic, based on lead score, local recommended offer, and any detected audit automation opportunity.',
      'Daniel should confirm fit, pricing, and scope manually before sending.',
    ],
  };
}

function pricingSection(pricingOptions: SowPricingOption[]): SowSection {
  return {
    title: 'Pricing Options',
    body: pricingOptions.flatMap((option) => [
      `${option.recommended ? 'Recommended option: ' : ''}${option.name}`,
      `Price: ${option.range}`,
      `Best for: ${option.bestFor}`,
      `Deliverables: ${option.deliverables.join('; ')}`,
    ]),
  };
}

function recommendedPackageSection(recommendedSowOffer: SowOffer, score: number, hasAuditAutomationOpportunities: boolean): SowSection {
  return {
    title: 'Recommended Package',
    body: [
      `${recommendedSowOffer} is recommended for this draft.`,
      recommendationReason(recommendedSowOffer, score, hasAuditAutomationOpportunities),
      'Use cautious positioning: this is a proposed next step, not a guarantee of revenue, perfect quality, complete coverage, or production readiness.',
    ],
  };
}

function scopeSection(lead: Lead, recommendedSowOffer: SowOffer): SowSection {
  if (recommendedSowOffer === 'QA Audit') {
    return {
      title: 'Scope of Work',
      body: [
        `Run a focused QA risk review for ${lead.website || lead.companyName}.`,
        'Review approved public or provided flows for visible QA risks and automation opportunities.',
        'Capture evidence screenshots, prioritized findings, and a practical next-step roadmap.',
      ],
    };
  }

  if (recommendedSowOffer === 'Playwright Starter Pack') {
    return {
      title: 'Scope of Work',
      body: [
        'Create a first Playwright automation foundation for approved public or staging workflows.',
        'Focus on smoke tests that improve confidence before deployments.',
        'Keep implementation small, readable, CI-ready, and easy to extend.',
      ],
    };
  }

  if (recommendedSowOffer === 'Agency Partner Retainer') {
    return {
      title: 'Scope of Work',
      body: [
        'Provide bounded recurring QA automation support for approved agency client projects.',
        'Support launch checks, smoke coverage, failure review, and recurring QA reporting.',
        'Keep scope limited to agreed projects, workflows, and monthly capacity.',
      ],
    };
  }

  return {
    title: 'Scope of Work',
    body: [
      'Provide bounded monthly QA automation coverage and maintenance for approved workflows.',
      'Maintain and extend smoke/regression coverage where it supports release confidence.',
      'Provide recurring QA reporting with risks, completed work, and recommended next actions.',
    ],
  };
}

function deliverablesSection(deliverables: SowDeliverable[]): SowSection {
  return {
    title: 'Deliverables',
    body: deliverables.map((deliverable) => `${deliverable.title}: ${deliverable.description}`),
  };
}

function timelineSection(recommendedSowOffer: SowOffer): SowSection {
  if (recommendedSowOffer === 'QA Audit') {
    return {
      title: 'Timeline',
      body: ['Estimated 1-3 business days after target URL, scope, and access constraints are confirmed.'],
    };
  }

  if (recommendedSowOffer === 'Playwright Starter Pack') {
    return {
      title: 'Timeline',
      body: ['Estimated 3-7 business days after approved workflows, environment, and run instructions are confirmed.'],
    };
  }

  return {
    title: 'Timeline',
    body: ['Monthly engagement with weekly or monthly review cadence. Initial setup and first-month scope should be confirmed before work begins.'],
  };
}

function successCriteriaSection(recommendedSowOffer: SowOffer): SowSection {
  if (recommendedSowOffer === 'QA Audit') {
    return {
      title: 'Success Criteria',
      body: [
        'Client receives a clear QA risk review with evidence, prioritized findings, and a realistic automation roadmap.',
      ],
    };
  }

  if (recommendedSowOffer === 'Playwright Starter Pack') {
    return {
      title: 'Success Criteria',
      body: [
        'A small approved Playwright smoke suite can be run locally or in CI and produces useful failure evidence.',
      ],
    };
  }

  return {
    title: 'Success Criteria',
    body: [
      'Recurring QA automation work produces maintained tests, clearer release risks, and a monthly client-ready QA summary.',
    ],
  };
}

function upgradePathSection(recommendedSowOffer: SowOffer): SowSection {
  const agencyPath = 'QA Audit -> Agency Partner Retainer';
  const standardPath = 'QA Audit -> Playwright Starter Pack -> QA Automation Retainer';

  return {
    title: 'Upgrade Path',
    body: [
      recommendedSowOffer === 'Agency Partner Retainer' ? agencyPath : standardPath,
      'The next step should be earned through reviewed evidence, confirmed workflow value, and clear client need.',
    ],
  };
}

function assumptionsSection(auditReportPath: string | undefined): SowSection {
  return {
    title: 'Assumptions',
    body: [
      'This draft uses local lead data and generated local artifacts only.',
      auditReportPath
        ? 'Any audit evidence must be manually reviewed before being included in client-facing language.'
        : 'No audit findings, performance numbers, or accessibility compliance claims are included because no matching audit evidence was detected.',
      'Pricing and final package selection should be confirmed after discovery call context, workflow complexity, and access needs are clear.',
    ],
  };
}

function outOfScopeSection(): SowSection {
  return {
    title: 'Out of Scope',
    body: [
      'Unlimited QA coverage.',
      'Guaranteed revenue, perfect quality, or zero-defect promises.',
      'Production bug fixes unless separately scoped.',
      'Login, account, or payment testing unless explicitly approved and safely scoped.',
      'Security testing, penetration testing, compliance certification, or legal review.',
      'Automated outreach, CRM updates, or client communication.',
    ],
  };
}

function clientResponsibilitiesSection(): SowSection {
  return {
    title: 'Client Responsibilities',
    body: [
      'Confirm target URLs, approved environments, and business-critical workflows.',
      'Provide safe staging access only if login-based testing is explicitly approved.',
      'Review findings and clarify priorities before scope expands.',
      'Approve any client-facing report, proposal, or scope change before it is sent or executed.',
    ],
  };
}

function termsNotesSection(): SowSection {
  return {
    title: 'Terms Notes',
    body: [
      'Pricing is draft and should be confirmed manually.',
      'Scope is bounded to the deliverables and workflows listed in the final approved proposal.',
      'Production fixes are not included unless separately scoped.',
      'Login and payment testing require explicit approval and safe access.',
      'Timelines depend on access, workflow complexity, and responsiveness.',
      'This proposal must be reviewed before sending.',
    ],
  };
}

function nextStepSection(): SowSection {
  return {
    title: 'Next Step',
    body: [
      'Review this draft before sending.',
      'Adjust package and price based on discovery call context.',
      'Send manually only after Daniel approves the final version.',
    ],
  };
}

function manualReviewSection(): SowSection {
  return {
    title: 'Manual Review Note',
    body: [
      'No proposal was sent automatically.',
      'Remove unsupported claims before sending.',
      'Do not include private credentials, real client secrets, or unapproved production access.',
      'Do not claim audit findings, performance numbers, or client-specific facts that are not supported by reviewed evidence.',
    ],
  };
}

function buildDeliverables(recommendedSowOffer: SowOffer): SowDeliverable[] {
  if (recommendedSowOffer === 'QA Audit') {
    return [
      { title: 'QA risk review', description: 'Focused review of approved site or product-flow risk.' },
      { title: 'Evidence screenshots', description: 'Screenshots and notes for reviewed public or approved flows.' },
      { title: 'Prioritized findings', description: 'Cautious findings that require manual review before client delivery.' },
      { title: 'Automation recommendations', description: 'Clear next-step roadmap for possible Playwright coverage.' },
    ];
  }

  if (recommendedSowOffer === 'Playwright Starter Pack') {
    return [
      { title: 'Playwright setup', description: 'Small TypeScript Playwright foundation using existing project conventions.' },
      { title: 'Smoke test suite', description: 'Approved smoke tests for critical public or staging workflows.' },
      { title: 'Failure evidence', description: 'Screenshots, traces, or HTML reporting where configured.' },
      { title: 'Run instructions', description: 'README notes for running and extending the starter suite.' },
    ];
  }

  if (recommendedSowOffer === 'Agency Partner Retainer') {
    return [
      { title: 'Partner QA support', description: 'Bounded recurring QA automation support for approved agency work.' },
      { title: 'Launch smoke coverage', description: 'Smoke checks for approved client launch or maintenance flows.' },
      { title: 'Risk summaries', description: 'Concise notes on recurring risks, failures, and recommended next actions.' },
      { title: 'Monthly reporting', description: 'Client-ready QA progress summary where appropriate.' },
    ];
  }

  return [
    { title: 'Test maintenance', description: 'Maintain approved smoke/regression coverage.' },
    { title: 'New smoke/regression coverage', description: 'Add bounded coverage for approved high-risk workflows.' },
    { title: 'Monthly QA report', description: 'Summarize delivered work, risks, next steps, and roadmap updates.' },
    { title: 'CI monitoring recommendations', description: 'Recommend practical CI reporting improvements without overbuilding.' },
  ];
}

function buildPricingOptions(recommendedSowOffer: SowOffer): SowPricingOption[] {
  return [
    {
      name: 'QA Audit',
      range: '$199-$500',
      recommended: recommendedSowOffer === 'QA Audit',
      bestFor: 'initial risk review, QA opportunity discovery, and a small first engagement',
      deliverables: [
        'QA risk review',
        'homepage/product-flow smoke review',
        'evidence screenshots',
        'prioritized findings',
        'automation recommendations',
        'next-step roadmap',
      ],
    },
    {
      name: 'Playwright Starter Pack',
      range: '$900-$1,500',
      recommended: recommendedSowOffer === 'Playwright Starter Pack',
      bestFor: 'teams that need a first automation foundation',
      deliverables: [
        'Playwright setup',
        'smoke test suite',
        'critical flow coverage',
        'screenshots/traces on failure',
        'basic CI-ready structure',
        'README/run instructions',
      ],
    },
    {
      name: 'QA Automation Retainer',
      range: '$1,500-$3,000/month',
      recommended: recommendedSowOffer === 'QA Automation Retainer' || recommendedSowOffer === 'Agency Partner Retainer',
      bestFor: 'teams that need recurring QA automation coverage and maintenance',
      deliverables: [
        'test maintenance',
        'new smoke/regression coverage',
        'monthly QA report',
        'defect/risk summary',
        'CI monitoring recommendations',
        'automation roadmap updates',
      ],
    },
  ];
}

function selectSowOffer(score: number, recommendedOffer: Lead['recommendedOffer'], hasAuditAutomationOpportunities: boolean): SowOffer {
  if (recommendedOffer === 'agency-partner-retainer') return 'Agency Partner Retainer';
  if (score >= 8 && recommendedOffer === 'qa-automation-retainer') return 'QA Automation Retainer';
  if (score >= 7 || hasAuditAutomationOpportunities || recommendedOffer === 'playwright-starter-pack') return 'Playwright Starter Pack';
  return 'QA Audit';
}

function recommendationReason(recommendedSowOffer: SowOffer, score: number, hasAuditAutomationOpportunities: boolean): string {
  if (recommendedSowOffer === 'Agency Partner Retainer') {
    return 'The lead is marked as an agency partner opportunity, so the recommended path is a bounded recurring partner support conversation after manual qualification.';
  }

  if (recommendedSowOffer === 'QA Automation Retainer') {
    return `The score is ${score}/10 and the lead is marked as a QA Automation Retainer fit, so a retainer can be discussed after audit/discovery confirms recurring need.`;
  }

  if (recommendedSowOffer === 'Playwright Starter Pack') {
    return hasAuditAutomationOpportunities
      ? 'A detected local audit report includes automation opportunity language, so a starter Playwright package may be the clearest next paid step.'
      : `The score is ${score}/10, which suggests a small automation foundation may be appropriate after manual review.`;
  }

  return `The score is ${score}/10, so the safest paid next step is a focused QA Audit before proposing larger automation work.`;
}

function detectAuditReportPath(website: string): string | undefined {
  if (!website) return undefined;

  let hostname = '';
  try {
    hostname = new URL(website).hostname;
  } catch {
    return undefined;
  }

  const safeDomain = hostname
    .replace(/^www\./, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const auditReportPath = path.join(process.cwd(), 'output', 'audits', safeDomain, 'audit-report.md');

  if (!fs.existsSync(auditReportPath)) return undefined;
  return path.relative(process.cwd(), auditReportPath);
}

function auditHasAutomationOpportunities(auditReportPath: string): boolean {
  const absolutePath = path.join(process.cwd(), auditReportPath);
  if (!fs.existsSync(absolutePath)) return false;

  const report = fs.readFileSync(absolutePath, 'utf8').toLowerCase();
  return report.includes('automation opportunity') || report.includes('playwright starter pack') || report.includes('smoke test');
}
