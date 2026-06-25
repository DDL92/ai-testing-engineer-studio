import { expect, test } from '@playwright/test';
import {
  buildContactCandidate,
  normalizeContactDiscoveryReport,
  scoreCommercialFit,
  scoreContactConfidence,
  scoreContactRole,
  selectContacts,
} from '../../../src/contactDiscovery/contactRules';
import {
  buildContactQueries,
  discoverContacts,
  parseContactEvidence,
} from '../../../src/contactDiscovery/discoverContacts';
import { renderContactPack } from '../../../src/contactDiscovery/generateContactPack';
import { ContactDiscoveryReport, ContactEvidenceInput } from '../../../src/contactDiscovery/types';
import { buildDrafts } from '../../../src/messageReview/messageRules';

function evidence(overrides: Partial<ContactEvidenceInput> = {}): ContactEvidenceInput {
  return {
    companyName: 'Example SaaS',
    fullName: 'Alex Morgan',
    title: 'QA Manager',
    sourceUrl: 'https://example.com/team/alex-morgan',
    sourceType: 'official-company-page',
    evidenceSummary: 'Alex Morgan is QA Manager at Example SaaS.',
    currentEmploymentVerified: true,
    ...overrides,
  };
}

function report(overrides: Partial<ContactDiscoveryReport> = {}): ContactDiscoveryReport {
  return {
    generatedAt: '2026-06-22T00:00:00.000Z',
    companyName: 'Example SaaS',
    companyDomain: 'example.com',
    recommendedOffer: 'QA Audit ($199-$500)',
    status: 'NO_CANDIDATES_FOUND',
    primaryContact: null,
    backupContacts: [],
    rejectedCandidates: [],
    manualVerificationCandidates: [],
    candidates: [],
    searchQueries: [],
    searchDiagnostics: [],
    totalSearchResults: 0,
    limitations: [],
    safetyRules: [],
    ...overrides,
  };
}

test.describe('Contact Discovery regression', () => {
  test('scores target roles deterministically', () => {
    // Arrange / Act / Assert
    expect(scoreContactRole('QA Manager')).toBe(100);
    expect(scoreContactRole('QA Lead')).toBe(95);
    expect(scoreContactRole('Director of Engineering')).toBe(90);
    expect(scoreContactRole('Engineering Manager')).toBe(88);
    expect(scoreContactRole('CTO')).toBe(78);
    expect(scoreContactRole('Product Owner')).toBe(65);
    expect(scoreContactRole('CEO')).toBe(60);
  });

  test('scores evidence confidence deterministically', () => {
    // Arrange / Act / Assert
    expect(scoreContactConfidence({ sourceType: 'official-company-page' })).toBe(100);
    expect(scoreContactConfidence({ sourceType: 'reputable-public-article' })).toBe(80);
    expect(scoreContactConfidence({ sourceType: 'search-result-snippet', snippetOnly: true })).toBe(55);
    expect(scoreContactConfidence({ sourceType: 'official-company-page', staleEvidence: true })).toBe(45);
  });

  test('rejects recruiter, sales, marketing, and support roles', () => {
    // Arrange
    const titles = ['Technical Recruiter', 'VP Sales', 'Marketing Manager', 'Support Lead'];

    // Act
    const candidates = titles.map((title) => buildContactCandidate(evidence({ title })));

    // Assert
    for (const candidate of candidates) {
      expect(candidate.roleScore).toBe(0);
      expect(candidate.rejectionReasons).toContain('Role is outside engineering, product, or quality leadership.');
    }
  });

  test('selects one primary and up to two ranked backups', () => {
    // Arrange
    const candidates = [
      buildContactCandidate(evidence({ fullName: 'Casey One', title: 'Engineering Manager' })),
      buildContactCandidate(evidence({ fullName: 'Jordan Two', title: 'QA Lead' })),
      buildContactCandidate(evidence({ fullName: 'Alex Three', title: 'QA Manager' })),
      buildContactCandidate(evidence({ fullName: 'Taylor Four', title: 'CTO' })),
    ];

    // Act
    const selection = selectContacts(candidates);

    // Assert
    expect(selection.status).toBe('READY');
    expect(selection.primaryContact?.fullName).toBe('Alex Three');
    expect(selection.backupContacts.map((contact) => contact.fullName)).toEqual(['Jordan Two', 'Casey One']);
  });

  test('does not select a snippet-only candidate as primary', () => {
    // Arrange
    const candidate = buildContactCandidate(evidence({
      sourceType: 'search-result-snippet',
      snippetOnly: true,
      currentEmploymentVerified: false,
    }));

    // Act
    const selection = selectContacts([candidate]);

    // Assert
    expect(selection.status).toBe('NEEDS_MANUAL_REVIEW');
    expect(selection.primaryContact).toBeNull();
  });

  test('distinguishes current and past employment evidence', () => {
    // Arrange
    const current = buildContactCandidate(evidence({
      fullName: 'Yuriy Protsiuk',
      title: 'Product Owner',
      sourceType: 'search-result-snippet',
      snippetOnly: true,
      currentEmploymentVerified: false,
      employmentStatus: 'current',
    }));
    const past = buildContactCandidate(evidence({
      fullName: 'Sviatoslav Bordovski',
      title: 'QA Automation Lead',
      sourceType: 'search-result-snippet',
      snippetOnly: true,
      currentEmploymentVerified: false,
      employmentStatus: 'past',
    }));

    // Act
    const selection = selectContacts([current, past]);

    // Assert
    expect(selection.status).toBe('NEEDS_MANUAL_REVIEW');
    expect(current.rejectionReasons).not.toContain('The source shows the target company as past employment.');
    expect(past.rejectionReasons).toContain('The source shows the target company as past employment.');
  });

  test('Product Owner remains relevant below QA and engineering leadership', () => {
    // Arrange / Act / Assert
    expect(scoreContactRole('Product Owner')).toBeGreaterThan(scoreContactRole('CEO'));
    expect(scoreContactRole('Product Owner')).toBeLessThan(scoreContactRole('Engineering Manager'));
    expect(scoreContactRole('Product Owner')).toBeLessThan(70);
  });

  test('generates individual bounded role queries', () => {
    // Arrange / Act
    const queries = buildContactQueries('Setmore', 'setmore.com');

    // Assert
    expect(queries).toContain('"Setmore" "QA Manager"');
    expect(queries).toContain('"Setmore" "Engineering Manager"');
    expect(queries).toContain('"Setmore" CTO');
    expect(queries).toContain('site:linkedin.com/in "Setmore" engineering');
    expect(queries.length).toBeLessThanOrEqual(10);
    expect(queries.every((query) => !query.includes(' OR '))).toBe(true);
  });

  test('retains a LinkedIn snippet candidate at capped confidence', () => {
    // Arrange
    const parsed = parseContactEvidence('Setmore', 'setmore.com', {
      title: 'Jordan Lee - Engineering Manager at Setmore | LinkedIn',
      url: 'https://www.linkedin.com/in/jordan-lee',
      content: 'Jordan Lee is an Engineering Manager at Setmore.',
    });

    // Act
    const candidate = parsed ? buildContactCandidate(parsed) : null;

    // Assert
    expect(candidate).not.toBeNull();
    expect(candidate?.fullName).toBe('Jordan Lee');
    expect(candidate?.title).toBe('Engineering Manager');
    expect(candidate?.confidenceScore).toBeLessThanOrEqual(55);
    expect(candidate?.currentEmploymentVerified).toBe(false);
    expect(candidate?.publicProfileUrl).toBe('https://www.linkedin.com/in/jordan-lee');
  });

  test('retains colon-formatted public product candidate for manual verification', () => {
    // Arrange
    const parsed = parseContactEvidence('Setmore', 'setmore.com', {
      title: 'Setmore - Crunchbase Company Profile & Funding',
      url: 'https://www.crunchbase.com/organization/setmore',
      content: 'Photo of Mo Arshath. Mo Arshath: Product Manager. Details. Legal Name Setmore Inc.',
    });

    // Act
    const candidate = parsed ? buildContactCandidate(parsed) : null;

    // Assert
    expect(candidate?.fullName).toBe('Mo Arshath');
    expect(candidate?.title).toBe('Product Manager');
    expect(candidate?.roleScore).toBe(55);
    expect(candidate?.confidenceScore).toBe(55);
    expect(candidate?.currentEmploymentVerified).toBe(false);
  });

  test('rejects content-title strings as person names', () => {
    // Arrange / Act
    const parsed = parseContactEvidence('Zoho Creator', 'zoho.com', {
      title: 'CreatorsUnveiled series featuring Praveen - Zoho Creator',
      url: 'https://www.zoho.com/creator/videos/creatorsunveiled-praveen',
      content: 'CreatorsUnveiled series featuring Praveen explores Zoho Creator workflows.',
    });
    const candidate = buildContactCandidate(evidence({
      companyName: 'Zoho Creator',
      fullName: 'CreatorsUnveiled series featuring Praveen',
      title: 'Engineering Manager',
      sourceUrl: 'https://www.zoho.com/creator/videos/creatorsunveiled-praveen',
      sourceType: 'official-company-page',
    }));

    // Assert
    expect(parsed).toBeNull();
    expect(candidate.rejectionReasons).toContain('Candidate name resembles a title, headline, event, or content label rather than a plausible person.');
  });

  test('unknown employment cannot become send-ready', () => {
    // Arrange
    const candidate = buildContactCandidate(evidence({
      fullName: 'Alex Morgan',
      title: 'Engineering Manager',
      currentEmploymentVerified: false,
      employmentStatus: 'unknown',
    }));

    // Act
    const selection = selectContacts([candidate]);

    // Assert
    expect(selection.status).toBe('NEEDS_MANUAL_REVIEW');
    expect(selection.primaryContact).toBeNull();
    expect(candidate.rejectionReasons).toContain('Current employment is not verified by the public source.');
  });

  test('low commercial-fit enterprise leads are deprioritized', async () => {
    // Arrange / Act
    const discovery = await discoverContacts('Zoho Creator', {
      hasApiKey: true,
      persist: false,
      company: {
        companyName: 'Zoho Creator',
        companyDomain: 'zoho.com',
        recommendedOffer: 'QA Audit ($199-$500)',
      },
      search: async (query) => ({
        query,
        results: [{
          title: 'Alex Morgan - Engineering Manager at Zoho Creator',
          url: 'https://www.zoho.com/creator/team/alex-morgan',
          content: 'Alex Morgan is Engineering Manager at Zoho Creator.',
        }],
      }),
      verify: async (input) => ({
        ...input,
        sourceType: 'official-company-page',
        currentEmploymentVerified: true,
        employmentStatus: 'current',
        snippetOnly: false,
      }),
    });

    // Assert
    expect(scoreCommercialFit('Zoho Creator', 'QA Audit ($199-$500)')).toBe('LOW');
    expect(discovery.commercialFit).toBe('LOW');
    expect(discovery.status).toBe('NEEDS_MANUAL_REVIEW');
    expect(discovery.primaryContact).toBeNull();
    expect(discovery.limitations.join(' ')).toContain('Commercial fit is low');
  });

  test('missing Tavily configuration produces SEARCH_UNAVAILABLE', async () => {
    // Arrange / Act
    const discovery = await discoverContacts('Setmore', {
      hasApiKey: false,
      persist: false,
      search: async () => {
        throw new Error('Search should not execute without configuration.');
      },
    });

    // Assert
    expect(discovery.status).toBe('SEARCH_UNAVAILABLE');
    expect(discovery.limitations).toContain('Public search unavailable: TAVILY_API_KEY missing or provider request failed.');
    expect(discovery.searchDiagnostics.every((item) => item.status === 'SKIPPED')).toBe(true);
  });

  test('provider failure is reported as unavailable rather than zero candidates', async () => {
    // Arrange / Act
    const discovery = await discoverContacts('Setmore', {
      hasApiKey: true,
      persist: false,
      search: async () => {
        throw new Error('Tavily search failed: 503 unavailable');
      },
    });

    // Assert
    expect(discovery.status).toBe('SEARCH_UNAVAILABLE');
    expect(discovery.searchDiagnostics.every((item) => item.status === 'FAILED')).toBe(true);
    expect(discovery.searchDiagnostics[0]?.errorCategory).toBe('provider_request_failed');
  });

  test('provider success with no named results produces NO_CANDIDATES_FOUND', async () => {
    // Arrange / Act
    const discovery = await discoverContacts('Setmore', {
      hasApiKey: true,
      persist: false,
      search: async (query) => ({
        query,
        results: [{
          title: 'Setmore appointment scheduling',
          url: 'https://www.setmore.com',
          content: 'Online appointment scheduling software for businesses.',
        }],
      }),
    });

    // Assert
    expect(discovery.status).toBe('NO_CANDIDATES_FOUND');
    expect(discovery.totalSearchResults).toBe(discovery.searchQueries.length);
    expect(discovery.searchDiagnostics.every((item) => item.status === 'SUCCESS')).toBe(true);
  });

  test('low-confidence candidates appear in the contact pack', () => {
    // Arrange
    const candidate = buildContactCandidate(evidence({
      sourceUrl: 'https://www.linkedin.com/in/alex-morgan',
      sourceType: 'search-result-snippet',
      snippetOnly: true,
      currentEmploymentVerified: false,
      publicProfileUrl: 'https://www.linkedin.com/in/alex-morgan',
    }));

    // Act
    const markdown = renderContactPack(report({
      status: 'NEEDS_MANUAL_REVIEW',
      candidates: [candidate],
      manualVerificationCandidates: [candidate],
      totalSearchResults: 1,
    }));

    // Assert
    expect(markdown).toContain('## Manual Verification Candidates');
    expect(markdown).toContain('Name: Alex Morgan');
    expect(markdown).toContain('Confidence: 55');
  });

  test('verified official-source candidate can produce READY', async () => {
    // Arrange / Act
    const discovery = await discoverContacts('Setmore', {
      hasApiKey: true,
      persist: false,
      search: async (query) => ({
        query,
        results: [{
          title: 'Alex Morgan - QA Manager at Setmore',
          url: 'https://www.setmore.com/team/alex-morgan',
          content: 'Alex Morgan is QA Manager at Setmore.',
        }],
      }),
      verify: async (input) => ({
        ...input,
        sourceType: 'official-company-page',
        currentEmploymentVerified: true,
        snippetOnly: false,
      }),
    });

    // Assert
    expect(discovery.status).toBe('READY');
    expect(discovery.primaryContact?.fullName).toBe('Alex Morgan');
    expect(discovery.primaryContact?.confidenceScore).toBe(100);
  });

  test('generic company homepage cannot verify a CTO', () => {
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
    const cached = report({
      companyName: 'SimplyBook.me',
      companyDomain: 'simplybook.me',
      status: 'READY',
      primaryContact: mike,
      candidates: [mike],
    });

    // Act
    const normalized = normalizeContactDiscoveryReport(cached);

    // Assert
    expect(normalized.status).toBe('NEEDS_MANUAL_REVIEW');
    expect(normalized.primaryContact).toBeNull();
    expect(normalized.manualVerificationCandidates[0]?.confidenceScore).toBe(55);
    expect(normalized.manualVerificationCandidates[0]?.currentEmploymentVerified).toBe(false);
  });

  test('requires manual review when no candidate meets thresholds', () => {
    // Arrange
    const candidate = buildContactCandidate(evidence({ title: 'Software Engineer' }));

    // Act
    const selection = selectContacts([candidate]);

    // Assert
    expect(selection.status).toBe('NEEDS_MANUAL_REVIEW');
    expect(selection.backupContacts).toEqual([]);
  });

  test('message drafts keep the placeholder when readiness is insufficient', () => {
    // Arrange / Act
    const drafts = buildDrafts('Example SaaS', undefined, false);

    // Assert
    expect(drafts.find((draft) => draft.type === 'linkedin_normal')?.body).toContain('Hi [Name],');
    expect(drafts.find((draft) => draft.type === 'email')?.body).toContain('Hi [Name],');
  });

  test('message drafts use only the verified first name when readiness is ready', () => {
    // Arrange / Act
    const drafts = buildDrafts('Example SaaS', 'Alex', false);

    // Assert
    expect(drafts.find((draft) => draft.type === 'linkedin_normal')?.body).toContain('Hi Alex,');
    expect(drafts.find((draft) => draft.type === 'email')?.body).toContain('Hi Alex,');
    expect(drafts.find((draft) => draft.type === 'interested_reply')?.body).toContain('Thanks, Alex.');
    expect(drafts.every((draft) => !draft.body.includes('[Name]'))).toBe(true);
  });
});
