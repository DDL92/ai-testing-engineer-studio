import { expect, test } from '@playwright/test';
import { buildDailyRevenuePlan } from '../../../src/operator/dailyRevenueOperatorRules';
import { ContactAwareRotationReport } from '../../../src/contactAwareRotation/types';
import { analyzeWebsiteLead } from '../../../src/websiteStudio/opportunityScorer';
import {
  detectWebsiteMigration,
  inspectPublicWebsite,
} from '../../../src/websiteStudio/publicWebsiteInspector';
import { buildWebsiteRanking } from '../../../src/websiteStudio/rankingWorkflow';
import { WebsiteCandidateInput, WebsiteLeadRecord } from '../../../src/websiteStudio/types';

const legacyUrl = 'https://www.reunionexperience.org';
const canonicalUrl = 'https://www.reunionwellness.org';

const legacyHtml = `
  <html>
    <head><title>Reunion Costa Rica Healing Center</title></head>
    <body>
      <p>We are beginning a new chapter. Visit our new website for Reunion Wellness.</p>
      <a href="${canonicalUrl}">Continue to our new website</a>
      <a href="https://instagram.com/reunion">Instagram</a>
    </body>
  </html>
`;

const canonicalHtml = `
  <html>
    <head>
      <title>Reunion Wellness Resort & Retreats | Costa Rica</title>
      <meta name="description" content="Wellness resort and retreats">
      <meta name="viewport" content="width=device-width">
    </head>
    <body>
      <nav>
        <a href="/accommodations">Accommodations</a>
        <a href="/retreats">Retreats</a>
        <a href="/wellness">Wellness</a>
        <a href="/experiences">Experiences</a>
      </nav>
      <a href="/availability">Check availability</a>
      <a href="mailto:hello@reunionwellness.org">Email</a>
      <a href="tel:+50600000000">Call</a>
      <address>Guanacaste, Costa Rica</address>
    </body>
  </html>
`;

const vajraHtml = `
  <html>
    <head>
      <title>Vajra Sol Travel | Costa Rica Yoga Retreat</title>
      <meta name="description" content="Costa Rica yoga retreats">
      <meta name="viewport" content="width=device-width">
    </head>
    <body>
      <nav>
        ${Array.from({ length: 41 }, (_, index) => `<a href="/page-${index}">Page ${index}</a>`).join('')}
      </nav>
      <a href="/yoga-retreats/costa-rica-playa-langosta/book">Book Now</a>
      <a href="/request-a-quote">Request a Quote</a>
    </body>
  </html>
`;

function candidate(): WebsiteCandidateInput {
  return {
    id: 'tavily_reunion_costa_rica_healing_center_715f5cb6',
    businessName: 'Reunion Costa Rica Healing Center',
    category: 'wellness',
    source: 'tavily_search',
    location: 'Guanacaste, Costa Rica',
    websiteUrl: legacyUrl,
  };
}

function publicFetch(url: string | URL | Request): Promise<Response> {
  const value = String(url);
  if (value.startsWith(canonicalUrl)) {
    return Promise.resolve(new Response(canonicalHtml, {
      status: 200,
      headers: { 'content-type': 'text/html' },
    }));
  }
  return Promise.resolve(new Response(legacyHtml, {
    status: 200,
    headers: { 'content-type': 'text/html' },
  }));
}

async function reunionRecord(): Promise<WebsiteLeadRecord> {
  const inspection = await inspectPublicWebsite(legacyUrl, publicFetch as typeof fetch);
  const analysis = analyzeWebsiteLead(candidate(), inspection);
  return {
    lead: {
      id: candidate().id,
      companyName: inspection.canonicalSiteName ?? candidate().businessName,
      website: inspection.canonicalWebsiteUrl ?? legacyUrl,
      industry: 'wellness',
      source: 'tavily_search',
      status: 'new',
      fitNotes: '',
      createdAt: '2026-06-23T00:00:00.000Z',
      updatedAt: '2026-06-23T00:00:00.000Z',
      nextAction: analysis.nextAction,
    },
    location: 'Guanacaste, Costa Rica',
    publicContact: {
      instagramUrl: null,
      facebookUrl: null,
      email: null,
      phone: null,
    },
    inspection,
    analysis,
    canonicalWebsiteUrl: inspection.canonicalWebsiteUrl,
    legacyWebsiteUrl: inspection.legacyWebsiteUrl,
    migrationDetected: inspection.migrationDetected,
    migrationEvidence: inspection.migrationEvidence,
    migrationTargetUrl: inspection.migrationTargetUrl,
  };
}

const emptyRotation: ContactAwareRotationReport = {
  generatedAt: '2026-06-23T00:00:00.000Z',
  status: 'NO_CONTACT_READY_LEAD',
  readyLeads: [],
  evaluatedLeads: [],
  skippedLeads: [],
  nextManualAction: '',
  safetyRules: [],
};

test.describe('Website Studio migrated-domain false-positive prevention', () => {
  test('detects explicit migration language and extracts the replacement domain', () => {
    const migration = detectWebsiteMigration(legacyHtml, legacyUrl);

    expect(migration?.targetUrl).toBe(`${canonicalUrl}/`);
    expect(migration?.evidence.join(' ')).toContain('new website');
  });

  test('inspects the canonical domain and retains the legacy URL', async () => {
    const inspection = await inspectPublicWebsite(legacyUrl, publicFetch as typeof fetch);

    expect(inspection.migrationDetected).toBe(true);
    expect(inspection.legacyWebsiteUrl).toBe(legacyUrl);
    expect(inspection.canonicalWebsiteUrl).toBe(`${canonicalUrl}/`);
    expect(inspection.requestedUrl).toBe(`${canonicalUrl}/`);
    expect(inspection.internalNavigationLinks).toBeGreaterThanOrEqual(3);
    expect(inspection.conversionLinkPresent).toBe(true);
    expect(inspection.mailtoLinkPresent).toBe(true);
  });

  test('ignores legacy deficiencies and marks Reunion not qualified', async () => {
    const record = await reunionRecord();

    expect(record.lead.companyName).toBe('Reunion Wellness Resort & Retreats');
    expect(record.analysis.decision).toBe('NOT_QUALIFIED');
    expect(record.analysis.score).toBe(0);
    expect(record.analysis.opportunitySignals).toEqual([]);
    expect(record.analysis.nextAction).toBe('skip — migrated domain; no verified redesign opportunity');
    expect(record.analysis.strongestOpportunity).toContain('navigation, contact details, and booking paths');
  });

  test('does not rank migrated false positives for outreach or homepage demos', async () => {
    const record = await reunionRecord();

    expect(buildWebsiteRanking([record])).toEqual([]);
    expect(record.analysis.nextAction).not.toBe('prepare homepage demo');
    expect(record.analysis.nextAction).not.toBe('prepare website audit');
  });

  test('daily operator skips Reunion and continues to a later Website candidate', async () => {
    const reunion = await reunionRecord();
    const later = {
      ...reunion,
      lead: {
        ...reunion.lead,
        id: 'later-business',
        companyName: 'Later Business',
        website: 'https://later.example',
        nextAction: 'prepare website audit' as const,
      },
      inspection: {
        ...reunion.inspection,
        migrationDetected: false,
        canonicalWebsiteUrl: undefined,
        legacyWebsiteUrl: undefined,
        migrationEvidence: undefined,
        migrationTargetUrl: undefined,
        mailtoLinkPresent: true,
      },
      analysis: {
        ...reunion.analysis,
        decision: 'QUALIFIED' as const,
        score: 65,
        opportunitySignals: ['no visible booking or conversion link'],
        strongestOpportunity: 'no visible booking or conversion link',
        nextAction: 'prepare website audit' as const,
      },
      migrationDetected: false,
      canonicalWebsiteUrl: undefined,
      legacyWebsiteUrl: undefined,
      migrationEvidence: undefined,
      migrationTargetUrl: undefined,
    };

    const plan = buildDailyRevenuePlan({
      now: new Date('2026-06-23T12:00:00.000Z'),
      outreachRecords: [],
      qaRotation: emptyRotation,
      websiteLeads: [reunion, later],
    });

    expect(plan.websiteActions.map((action) => action.companyName)).toContain('Later Business');
    expect(plan.websiteActions.map((action) => action.companyName)).not.toContain('Reunion Wellness Resort & Retreats');
    expect(plan.skippedCandidates.find((item) => item.companyName === 'Reunion Wellness Resort & Retreats')?.reason)
      .toContain('migrated domain');
  });

  test('normal external links do not become canonical without explicit migration evidence', () => {
    const html = `
      <p>Follow us and read partner resources.</p>
      <a href="https://instagram.com/example">Instagram</a>
      <a href="https://partner.example">Partner</a>
    `;

    expect(detectWebsiteMigration(html, 'https://business.example')).toBeNull();
  });

  test('generic new chapter language does not replace the domain without a linked current-site cue', () => {
    const html = `
      <p>A new chapter begins for our wellness program.</p>
      <a href="https://instagram.com/example">Follow our updates</a>
    `;

    expect(detectWebsiteMigration(html, 'https://business.example')).toBeNull();
  });
});

test.describe('Website Studio commercial-fit false-positive prevention', () => {
  test('aborted inspection retries once and remains inconclusive without verified downtime', async () => {
    let calls = 0;
    const inspection = await inspectPublicWebsite('https://www.peaceretreatcostarica.com', (async () => {
      calls += 1;
      throw new DOMException('This operation was aborted', 'AbortError');
    }) as typeof fetch);
    const analysis = analyzeWebsiteLead({
      id: 'peace',
      businessName: 'Peace Retreat Costa Rica',
      category: 'wellness',
      source: 'tavily_search',
      websiteUrl: 'https://www.peaceretreatcostarica.com',
    }, inspection);

    expect(calls).toBe(2);
    expect(inspection.status).toBe('ABORTED');
    expect(inspection.attemptCount).toBe(2);
    expect(inspection.externalReachabilityUnverified).toBe(true);
    expect(analysis.decision).toBe('INSPECTION_INCONCLUSIVE');
    expect(analysis.nextAction).toBe('RETRY_INSPECTION');
    expect(analysis.opportunitySignals).not.toContain('website unreachable');
    expect(analysis.primaryOffer.name).not.toBe('Website Recovery / Redesign Pack');
  });

  test('one bounded retry can recover a successful inspection', async () => {
    let calls = 0;
    const inspection = await inspectPublicWebsite('https://example.com', (async () => {
      calls += 1;
      if (calls === 1) throw new DOMException('The operation was aborted.', 'AbortError');
      return new Response('<html><head><title>Recovered</title><meta name="viewport" content="width=device-width"></head><body><a href="/book">Book Now</a></body></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      });
    }) as typeof fetch);

    expect(calls).toBe(2);
    expect(inspection.status).toBe('SUCCESS');
    expect(inspection.reachable).toBe(true);
    expect(inspection.externalReachabilityUnverified).toBe(false);
  });

  test('booking links, quote pages, and forms count as conversion paths', async () => {
    const inspection = await inspectPublicWebsite('https://vajrasoltravel.com/yoga-retreats/costa-rica-playa-langosta', (async () => (
      new Response(`${vajraHtml}<form><label>Host Your Retreat</label><input name="quote"></form>`, {
        status: 200,
        headers: { 'content-type': 'text/html' },
      })
    )) as typeof fetch);

    expect(inspection.conversionLinkPresent).toBe(true);
    expect(inspection.internalNavigationLinks).toBeGreaterThanOrEqual(40);
  });

  test('does not qualify a functioning parent-platform page solely for missing mailto or tel links', async () => {
    const inspection = await inspectPublicWebsite('https://www.vajrasoltravel.com/yoga-retreats/costa-rica-playa-langosta', (async () => (
      new Response(vajraHtml, {
        status: 200,
        headers: { 'content-type': 'text/html' },
      })
    )) as typeof fetch);
    const analysis = analyzeWebsiteLead({
      id: 'tavily_costa_rica_luxe_yoga_and_wellness_retreat_f5e23ceb',
      businessName: 'Costa Rica luxe Yoga and Wellness Retreat',
      category: 'yoga',
      source: 'tavily_search',
      websiteUrl: 'https://www.vajrasoltravel.com/yoga-retreats/costa-rica-playa-langosta',
    }, inspection);

    expect(inspection.parentPlatformPage).toBe(true);
    expect(inspection.rootDomain).toBe('vajrasoltravel.com');
    expect(analysis.decision).toBe('NOT_QUALIFIED');
    expect(analysis.nextAction).toBe('skip — functioning site; no verified redesign opportunity');
    expect(analysis.strongestOpportunity).toContain('functioning parent website');
  });

  test('daily operator skips corrected Website false positives and continues', async () => {
    const vajraInspection = await inspectPublicWebsite('https://www.vajrasoltravel.com/yoga-retreats/costa-rica-playa-langosta', (async () => (
      new Response(vajraHtml, {
        status: 200,
        headers: { 'content-type': 'text/html' },
      })
    )) as typeof fetch);
    const vajraAnalysis = analyzeWebsiteLead({
      id: 'vajra',
      businessName: 'Costa Rica luxe Yoga and Wellness Retreat',
      category: 'yoga',
      source: 'tavily_search',
      websiteUrl: 'https://www.vajrasoltravel.com/yoga-retreats/costa-rica-playa-langosta',
    }, vajraInspection);
    const vajra = {
      ...await reunionRecord(),
      lead: {
        ...(await reunionRecord()).lead,
        id: 'vajra',
        companyName: 'Vajra Sol Travel',
        website: 'https://www.vajrasoltravel.com/yoga-retreats/costa-rica-playa-langosta',
        nextAction: vajraAnalysis.nextAction,
      },
      inspection: vajraInspection,
      analysis: vajraAnalysis,
      migrationDetected: false,
    };
    const later = {
      ...vajra,
      lead: { ...vajra.lead, id: 'later-site', companyName: 'Later Website Candidate', nextAction: 'prepare website audit' as const },
      analysis: {
        ...vajra.analysis,
        decision: 'QUALIFIED' as const,
        score: 65,
        opportunitySignals: ['no visible booking or conversion link'],
        strongestOpportunity: 'no visible booking or conversion link',
        nextAction: 'prepare website audit' as const,
      },
      publicContact: { ...vajra.publicContact, email: 'hello@example.com' },
    };

    const plan = buildDailyRevenuePlan({
      now: new Date('2026-06-23T12:00:00.000Z'),
      outreachRecords: [],
      qaRotation: emptyRotation,
      websiteLeads: [vajra, later],
    });

    expect(plan.websiteActions.map((action) => action.companyName)).toContain('Later Website Candidate');
    expect(plan.websiteActions.map((action) => action.companyName)).not.toContain('Vajra Sol Travel');
    expect(plan.skippedCandidates.find((item) => item.companyName === 'Vajra Sol Travel')?.reason)
      .toContain('functioning parent website');
  });
});
