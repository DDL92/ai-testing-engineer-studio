import { expect, test } from '@playwright/test';
import { buildContactCandidate } from '../../../src/contactDiscovery/contactRules';
import { normalizeContactDiscoveryReport } from '../../../src/contactDiscovery/contactRules';
import { ContactDiscoveryReport, ContactEvidenceInput } from '../../../src/contactDiscovery/types';
import {
  buildContactAwareRotation,
  evaluateCandidate,
} from '../../../src/contactAwareRotation/rotationRules';
import { LeadRotationCandidate } from '../../../src/leadRotation/types';
import { resolveMessagePackCompany } from '../../../src/messageReview/generateMessagePack';
import { buildDrafts, buildMessageReview } from '../../../src/messageReview/messageRules';
import { buildTopLeadAuditPackage } from '../../../src/topLeadAudit/topLeadAuditRules';
import { currentEvidenceProTarget, evidenceTargetsMatch } from '../../../src/evidencePro/evidenceProRules';

function lead(companyName: string, rank: number): LeadRotationCandidate {
  return {
    rank,
    companyId: companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    companyName,
    website: `https://${companyName.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
    category: 'Scheduling SaaS',
    recommendedOffer: 'QA Audit ($199-$500)',
    qualificationScore: 85,
    qaOpportunityScore: 85,
    evidenceStatus: 'READY',
    companyConfidence: 90,
    evidenceConfidence: 90,
    painConfidence: 80,
    falsePositivePenalty: 0,
    commercialReadinessScore: 85,
    readiness: 'READY',
    recommendation: 'PROMOTE',
    blockers: [],
    reasons: [],
    sourceLead: {} as LeadRotationCandidate['sourceLead'],
  };
}

function evidence(overrides: Partial<ContactEvidenceInput> = {}): ContactEvidenceInput {
  return {
    companyName: 'ReadyCo',
    fullName: 'Jane Doe',
    title: 'Engineering Manager',
    sourceUrl: 'https://readyco.com/team/jane-doe',
    sourceType: 'official-company-page',
    evidenceSummary: 'Jane Doe is Engineering Manager at ReadyCo.',
    currentEmploymentVerified: true,
    ...overrides,
  };
}

function contact(
  companyName: string,
  status: ContactDiscoveryReport['status'],
  options: { generatedAt?: string; snippetOnly?: boolean } = {},
): ContactDiscoveryReport {
  const candidate = status === 'READY' || status === 'NEEDS_MANUAL_REVIEW'
    ? buildContactCandidate(evidence({
      companyName,
      sourceUrl: `https://${companyName.toLowerCase()}.com/team/jane-doe`,
      sourceType: options.snippetOnly ? 'search-result-snippet' : 'official-company-page',
      snippetOnly: options.snippetOnly,
      currentEmploymentVerified: !options.snippetOnly,
    }))
    : null;
  return {
    generatedAt: options.generatedAt ?? '2026-06-22T00:00:00.000Z',
    companyName,
    companyDomain: `${companyName.toLowerCase()}.com`,
    recommendedOffer: 'QA Audit ($199-$500)',
    status,
    primaryContact: status === 'READY' ? candidate : null,
    backupContacts: [],
    rejectedCandidates: [],
    manualVerificationCandidates: status === 'NEEDS_MANUAL_REVIEW' && candidate ? [candidate] : [],
    candidates: candidate ? [candidate] : [],
    searchQueries: [],
    searchDiagnostics: [],
    totalSearchResults: candidate ? 1 : 0,
    limitations: [],
    safetyRules: [],
  };
}

const now = new Date('2026-06-22T12:00:00.000Z');

test.describe('Contact-Aware Lead Rotation regression', () => {
  test('selects the first ranked lead when contact status is READY', async () => {
    // Arrange
    const candidates = [lead('SecondCo', 2), lead('FirstCo', 1)];

    // Act
    const report = await buildContactAwareRotation({}, {
      candidates,
      readContact: (company) => contact(company, 'READY'),
      now,
      persist: false,
    });

    // Assert
    expect(report.status).toBe('READY');
    expect(report.selectedLead?.companyName).toBe('FirstCo');
  });

  test('skips a contact-blocked first lead and selects the second ready lead', async () => {
    // Arrange
    const candidates = [lead('Setmore', 1), lead('ReadyCo', 2)];

    // Act
    const report = await buildContactAwareRotation({}, {
      candidates,
      readContact: (company) => company === 'Setmore'
        ? contact(company, 'NEEDS_MANUAL_REVIEW', { snippetOnly: true })
        : contact(company, 'READY'),
      now,
      persist: false,
    });

    // Assert
    expect(report.selectedLead?.companyName).toBe('ReadyCo');
    expect(report.skippedLeads[0]?.companyName).toBe('Setmore');
    expect(report.skippedLeads[0]?.contactStatus).toBe('CONTACT_BLOCKED');
  });

  test('continues after the first ready lead and collects up to three ready leads', async () => {
    // Arrange
    const candidates = [
      lead('ReadyOne', 1),
      lead('ReadyTwo', 2),
      lead('ReadyThree', 3),
      lead('ReadyFour', 4),
    ];

    // Act
    const report = await buildContactAwareRotation({ maxLeads: 10 }, {
      candidates,
      readContact: (company) => contact(company, 'READY'),
      now,
      persist: false,
    });

    // Assert
    expect(report.readyLeads.map((item) => item.companyName)).toEqual(['ReadyOne', 'ReadyTwo', 'ReadyThree']);
    expect(report.evaluatedLeads.find((item) => item.companyName === 'ReadyFour')?.contactStatus).toBe('NOT_EVALUATED');
  });

  test('snippet-only candidate does not make a lead ready', () => {
    // Arrange
    const candidate = lead('Setmore', 1);
    const discovery = contact('Setmore', 'NEEDS_MANUAL_REVIEW', { snippetOnly: true });

    // Act
    const evaluation = evaluateCandidate(candidate, discovery);

    // Assert
    expect(evaluation.contactStatus).toBe('CONTACT_BLOCKED');
    expect(evaluation.primaryContactName).toBeUndefined();
  });

  test('NO_CANDIDATES_FOUND rotates to the next lead', async () => {
    // Arrange / Act
    const report = await buildContactAwareRotation({}, {
      candidates: [lead('EmptyCo', 1), lead('ReadyCo', 2)],
      readContact: (company) => contact(company, company === 'EmptyCo' ? 'NO_CANDIDATES_FOUND' : 'READY'),
      now,
      persist: false,
    });

    // Assert
    expect(report.selectedLead?.companyName).toBe('ReadyCo');
    expect(report.skippedLeads[0]?.contactStatus).toBe('NO_CANDIDATES_FOUND');
  });

  test('SEARCH_UNAVAILABLE stops the workflow', async () => {
    // Arrange
    let secondRead = false;

    // Act
    const report = await buildContactAwareRotation({}, {
      candidates: [lead('UnavailableCo', 1), lead('ReadyCo', 2)],
      readContact: (company) => {
        if (company === 'ReadyCo') secondRead = true;
        return contact(company, company === 'UnavailableCo' ? 'SEARCH_UNAVAILABLE' : 'READY');
      },
      now,
      persist: false,
    });

    // Assert
    expect(report.status).toBe('SEARCH_UNAVAILABLE');
    expect(secondRead).toBe(false);
  });

  test('maximum lead limit is respected', async () => {
    // Arrange
    const candidates = Array.from({ length: 7 }, (_, index) => lead(`Company${index + 1}`, index + 1));
    let reads = 0;

    // Act
    const report = await buildContactAwareRotation({ maxLeads: 5 }, {
      candidates,
      readContact: (company) => {
        reads += 1;
        return contact(company, 'NO_CANDIDATES_FOUND');
      },
      now,
      persist: false,
    });

    // Assert
    expect(reads).toBe(5);
    expect(report.evaluatedLeads.filter((item) => item.contactStatus === 'NOT_EVALUATED')).toHaveLength(2);
  });

  test('fresh cached contact results are reused', async () => {
    // Arrange
    let discoveries = 0;

    // Act
    await buildContactAwareRotation({}, {
      candidates: [lead('ReadyCo', 1)],
      readContact: () => contact('ReadyCo', 'READY', { generatedAt: '2026-06-20T00:00:00.000Z' }),
      discover: async () => {
        discoveries += 1;
        return contact('ReadyCo', 'READY');
      },
      now,
      persist: false,
    });

    // Assert
    expect(discoveries).toBe(0);
  });

  test('invalidated cached contact is not reused as READY', async () => {
    // Arrange
    const mike = buildContactCandidate(evidence({
      companyName: 'SimplyBook.me',
      fullName: 'Mike Benkovich',
      title: 'CTO',
      sourceUrl: 'https://be.simplybook.me',
      sourceType: 'official-company-page',
      currentEmploymentVerified: true,
      employmentStatus: 'current',
    }));
    const invalidated = normalizeContactDiscoveryReport({
      ...contact('SimplyBook.me', 'READY'),
      primaryContact: mike,
      candidates: [mike],
    });

    // Act
    const result = await buildContactAwareRotation({}, {
      candidates: [lead('SimplyBook.me', 1)],
      readContact: () => invalidated,
      now,
      persist: false,
    });

    // Assert
    expect(result.status).toBe('NO_CONTACT_READY_LEAD');
    expect(result.skippedLeads[0]?.contactStatus).toBe('CONTACT_BLOCKED');
  });

  test('--refresh reruns discovery', async () => {
    // Arrange
    let discoveries = 0;

    // Act
    await buildContactAwareRotation({ refresh: true }, {
      candidates: [lead('ReadyCo', 1)],
      readContact: () => contact('ReadyCo', 'READY'),
      discover: async () => {
        discoveries += 1;
        return contact('ReadyCo', 'READY');
      },
      now,
      persist: false,
    });

    // Assert
    expect(discoveries).toBe(1);
  });

  test('no ready lead produces NO_CONTACT_READY_LEAD', async () => {
    // Arrange / Act
    const report = await buildContactAwareRotation({}, {
      candidates: [lead('BlockedCo', 1)],
      readContact: () => contact('BlockedCo', 'NEEDS_MANUAL_REVIEW', { snippetOnly: true }),
      now,
      persist: false,
    });

    // Assert
    expect(report.status).toBe('NO_CONTACT_READY_LEAD');
    expect(report.selectedLead).toBeUndefined();
  });

  test('message pack resolves the selected contact-ready lead', () => {
    // Arrange / Act
    const company = resolveMessagePackCompany(undefined, 'ReadyCo', 'Setmore', 'Appointy');

    // Assert
    expect(company).toBe('ReadyCo');
  });

  test('operational message context preserves commercial and previous-lead traceability', () => {
    // Arrange / Act
    const review = buildMessageReview('', { persistDrafts: false });

    // Assert
    expect(review.evidenceBasis).toContain('Commercial top-ranked lead: Appointy');
    expect(review.evidenceBasis).toContain('Previous lead-rotation actionable lead: Setmore');
    expect(review.evidenceBasis.some((item) => item.startsWith('Current contact-ready operational lead:'))).toBe(true);
    expect(review.evidenceBasis.some((item) => item.startsWith('Current execution target:'))).toBe(true);
  });

  test('message drafts contain no internal review wording or typo', () => {
    // Arrange / Act
    const drafts = buildDrafts('SimplyBook.me', 'Mike', false);
    const bodies = drafts.map((draft) => draft.body).join('\n');

    // Assert
    expect(bodies).not.toContain('for manual review');
    expect(bodies).not.toContain('manual review only');
    expect(bodies).not.toContain('human approval required');
    expect(bodies).not.toContain('afull');
    expect(bodies).toContain('Would it be useful if I sent you the short summary?');
  });

  test('internal safety rules retain manual-review controls', () => {
    // Arrange / Act
    const review = buildMessageReview('SimplyBook.me', { persistDrafts: false });

    // Assert
    expect(review.safetyRules.join(' ')).toContain('Manual-only message review.');
    expect(review.safetyRules.join(' ')).toContain('Human approval is required');
  });

  test('top-lead audit and evidence target resolve the same operational company', () => {
    // Arrange / Act
    const audit = buildTopLeadAuditPackage();
    const evidenceTarget = currentEvidenceProTarget();

    // Assert
    expect(audit.companyName).toBe(evidenceTarget.companyName);
    expect(['Contact-Ready Operational Lead', 'Lead Rotation Actionable Lead']).toContain(evidenceTarget.source);
  });

  test('evidence cache cannot silently reuse evidence across companies', () => {
    // Arrange
    const staleTarget = {
      companyId: 'setmore',
      companyName: 'Setmore',
      website: 'https://www.setmore.com',
      source: 'Lead Rotation Actionable Lead' as const,
    };
    const simplyBookTarget = {
      companyId: 'simplybook-me',
      companyName: 'SimplyBook.me',
      website: 'https://simplybook.me',
      source: 'Contact-Ready Operational Lead' as const,
    };

    // Act
    const matches = evidenceTargetsMatch(staleTarget, simplyBookTarget);

    // Assert
    expect(matches).toBe(false);
  });

  test('Setmore-like blocked lead remains recorded for future revisit', async () => {
    // Arrange / Act
    const report = await buildContactAwareRotation({}, {
      candidates: [lead('Setmore', 1), lead('ReadyCo', 2)],
      readContact: (company) => company === 'Setmore'
        ? contact(company, 'NEEDS_MANUAL_REVIEW', { snippetOnly: true })
        : contact(company, 'READY'),
      now,
      persist: false,
    });

    // Assert
    expect(report.skippedLeads).toContainEqual(expect.objectContaining({
      companyName: 'Setmore',
      contactStatus: 'CONTACT_BLOCKED',
    }));
  });

  test('rotation has no outreach side effects', async () => {
    // Arrange
    const externalActions: string[] = [];

    // Act
    await buildContactAwareRotation({}, {
      candidates: [lead('ReadyCo', 1)],
      readContact: () => contact('ReadyCo', 'READY'),
      discover: async () => {
        externalActions.push('search');
        return contact('ReadyCo', 'READY');
      },
      now,
      persist: false,
    });

    // Assert
    expect(externalActions).toEqual([]);
  });
});
