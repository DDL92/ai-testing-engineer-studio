import fs = require('fs');
import path = require('path');
import { expect, test } from '@playwright/test';
import { notifyDailyPlan } from '../../../src/notifications/notifyDailyPlan';
import { buildDailyRevenuePlan, renderDailyRevenuePlan } from '../../../src/operator/dailyRevenueOperatorRules';
import { DailyRevenuePlan } from '../../../src/operator/types';
import { preferCachedRotation, shouldTriggerAutomaticRefresh } from '../../../src/operator/runDailyRevenueOperator';
import { ContactAwareLeadEvaluation, ContactAwareRotationReport } from '../../../src/contactAwareRotation/types';
import { OutreachRecord } from '../../../src/outreachTracking/types';
import { WebsiteLeadRecord } from '../../../src/websiteStudio/types';

const now = new Date('2026-06-25T12:00:00.000Z');

function qaLead(companyName: string, rank: number, status: ContactAwareLeadEvaluation['contactStatus'] = 'READY'): ContactAwareLeadEvaluation {
  return {
    companyId: slug(companyName),
    companyName,
    rank,
    recommendedOffer: 'QA Automation Retainer ($1500-$3000/month)',
    evidenceStatus: 'READY',
    contactStatus: status,
    ...(status === 'READY' ? {
      primaryContactName: `Contact ${rank}`,
      primaryContactTitle: 'Engineering Manager',
      primaryContactConfidence: 90,
      primaryContactSource: `https://${slug(companyName)}.example/team`,
    } : {}),
    reason: status === 'READY' ? 'Verified technical contact.' : 'Contact requires manual verification.',
    contactPackPath: `output/contacts/${slug(companyName)}-contact-pack.md`,
  };
}

function rotation(leads: ContactAwareLeadEvaluation[]): ContactAwareRotationReport {
  const readyLeads = leads.filter((lead) => lead.contactStatus === 'READY');
  return {
    generatedAt: now.toISOString(),
    status: readyLeads.length ? 'READY' : 'NO_CONTACT_READY_LEAD',
    selectedLead: readyLeads[0],
    readyLeads,
    evaluatedLeads: leads,
    skippedLeads: leads.filter((lead) => lead.contactStatus !== 'READY'),
    nextManualAction: 'Review manually.',
    safetyRules: [],
  };
}

function outreach(companyName: string, followUpDate: string, sentAt = '2026-06-20'): OutreachRecord {
  return {
    companyId: slug(companyName),
    companyName,
    contactName: `${companyName} Contact`,
    contactRole: 'Engineering Manager',
    channel: 'linkedin',
    status: 'message-sent',
    sentAt,
    lastTouchAt: sentAt,
    nextFollowUpAt: followUpDate,
    messageType: 'manual_dm',
    notes: '',
    humanApproved: true,
    source: 'Outcome Tracking',
    messageSent: true,
    replyReceived: false,
  };
}

function website(
  companyName: string,
  options: {
    presence?: WebsiteLeadRecord['analysis']['presence'];
    signal?: string;
    email?: string | null;
    decision?: WebsiteLeadRecord['analysis']['decision'];
  } = {},
): WebsiteLeadRecord {
  const presence = options.presence ?? 'no_website';
  const signal = options.signal ?? 'no dedicated website';
  return {
    lead: {
      id: slug(companyName),
      companyName,
      website: presence === 'no_website' ? null : `https://${slug(companyName)}.example`,
      industry: 'boutique_hotel',
      source: 'public_directory',
      status: 'new',
      fitNotes: '',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      nextAction: 'verify website presence',
    },
    location: 'Costa Rica',
    publicContact: {
      instagramUrl: null,
      facebookUrl: null,
      email: options.email ?? null,
      phone: null,
    },
    inspection: {
      inspectedAt: now.toISOString(),
      requestedUrl: null,
      reachable: presence === 'functioning_website',
      httpStatus: presence === 'functioning_website' ? 200 : null,
      httpsUsed: true,
      finalUrl: null,
      pageTitlePresent: true,
      metaDescriptionPresent: true,
      viewportMetaPresent: true,
      mailtoLinkPresent: Boolean(options.email),
      telLinkPresent: false,
      conversionLinkPresent: presence === 'functioning_website',
      internalNavigationLinks: presence === 'functioning_website' ? 8 : 0,
      brokenResponse: false,
      responseTimeMs: 500,
      htmlSizeBytes: 1000,
      failure: null,
    },
    analysis: {
      presence,
      opportunitySignals: signal ? [signal] : [],
      evidenceGaps: presence === 'no_website' ? ['Current website presence requires manual verification'] : [],
      score: 80,
      scoreBreakdown: {
        websiteNeed: 30,
        nicheFit: 20,
        commercialPotential: 15,
        conversionOpportunity: 10,
        maintenancePotential: 3,
        evidenceConfidence: 2,
      },
      decision: options.decision ?? 'PRIORITY',
      primaryOffer: { name: 'Website Presence Starter', priceRange: 'USD 900–1,500' },
      recurringFollowUp: 'Monthly Website Care — USD 100–300/month',
      strongestOpportunity: signal || 'No verified opportunity',
      personalizedSalesAngle: signal,
      nextAction: 'verify website presence',
      manualReviewRequired: true,
    },
  };
}

function plan(options: {
  outreach?: OutreachRecord[];
  qa?: ContactAwareLeadEvaluation[];
  websites?: WebsiteLeadRecord[];
  date?: Date;
  recurrenceCounts?: Record<string, number>;
} = {}): DailyRevenuePlan {
  return buildDailyRevenuePlan({
    now: options.date ?? now,
    outreachRecords: options.outreach ?? [],
    qaRotation: rotation(options.qa ?? []),
    websiteLeads: options.websites ?? [],
    recurrenceCounts: options.recurrenceCounts,
  });
}

test.describe('Autonomous Daily Revenue Operator', () => {
  test('selects due follow-ups before new outreach', () => {
    const result = plan({
      outreach: [outreach('DueCo', '2026-06-25')],
      qa: [qaLead('QaCo', 1)],
    });

    expect(result.selectedActions[0]?.actionType).toBe('follow_up');
    expect(result.selectedActions[0]?.companyName).toBe('DueCo');
  });

  test('does not select a follow-up before its due date', () => {
    const result = plan({
      date: new Date('2026-06-24T12:00:00.000Z'),
      outreach: [outreach('SimplyBook.me', '2026-06-25', '2026-06-22')],
    });

    expect(result.followUpActions).toHaveLength(0);
  });

  test('selects SimplyBook.me on or after the due date', () => {
    const result = plan({
      outreach: [outreach('SimplyBook.me', '2026-06-25', '2026-06-22')],
    });

    expect(result.followUpActions.map((action) => action.companyName)).toContain('SimplyBook.me');
  });

  test('QA pipeline contributes up to three actions and defaults cold outreach to QA Audit', () => {
    const result = plan({
      qa: [qaLead('QA1', 1), qaLead('QA2', 2), qaLead('QA3', 3), qaLead('QA4', 4)],
    });

    expect(result.qaActions).toHaveLength(3);
    expect(result.qaActions.every((action) => action.offer === 'QA Audit ($199-$500)')).toBe(true);
  });

  test('Website pipeline contributes up to two actions', () => {
    const result = plan({
      websites: [website('Web1'), website('Web2'), website('Web3')],
    });

    expect(result.websiteActions).toHaveLength(2);
  });

  test('does not stop after the first usable lead and caps total actions at five', () => {
    const result = plan({
      qa: [qaLead('QA1', 1), qaLead('QA2', 2), qaLead('QA3', 3)],
      websites: [website('Web1'), website('Web2'), website('Web3')],
    });

    expect(result.selectedActions).toHaveLength(5);
    expect(result.qaActions).toHaveLength(3);
    expect(result.websiteActions).toHaveLength(2);
    expect(result.status).toBe('READY');
    expect(result.actionCounts.commerciallyReady).toBe(3);
    expect(result.actionCounts.preparationActions).toBe(2);
  });

  test('five total tasks remain PARTIAL when fewer than three are commercially ready', () => {
    const result = plan({
      qa: [
        qaLead('ReadyQA', 1),
        qaLead('Verify1', 2, 'CONTACT_BLOCKED'),
        qaLead('Verify2', 3, 'CONTACT_BLOCKED'),
        qaLead('Verify3', 4, 'CONTACT_BLOCKED'),
      ],
      websites: [website('ReviewWeb')],
    });

    expect(result.selectedActions).toHaveLength(5);
    expect(result.actionCounts.commerciallyReady).toBe(1);
    expect(result.actionCounts.preparationActions).toBe(4);
    expect(result.status).toBe('PARTIAL');
  });

  test('fewer than five useful actions produces PARTIAL rather than failure', () => {
    const result = plan({ qa: [qaLead('OnlyCo', 1)] });

    expect(result.status).toBe('PARTIAL');
    expect(result.selectedActions).toHaveLength(1);
  });

  test('removes duplicate companies across verticals', () => {
    const result = plan({
      qa: [qaLead('SharedCo', 1)],
      websites: [website('SharedCo'), website('OtherWeb')],
    });

    expect(result.selectedActions.filter((action) => action.companyName === 'SharedCo')).toHaveLength(1);
  });

  test('skips recently contacted companies for new outreach', () => {
    const result = plan({
      outreach: [outreach('RecentCo', '2026-07-01', '2026-06-24')],
      qa: [qaLead('RecentCo', 1), qaLead('FreshCo', 2)],
    });

    expect(result.selectedActions.map((action) => action.companyName)).not.toContain('RecentCo');
    expect(result.skippedCandidates.some((item) => item.companyName === 'RecentCo')).toBe(true);
  });

  test('unverified QA contacts create verify_contact rather than outreach', () => {
    const result = plan({ qa: [qaLead('VerifyCo', 1, 'CONTACT_BLOCKED')] });

    expect(result.selectedActions[0]?.actionType).toBe('verify_contact');
  });

  test('a business with no verified website creates review work, not a false send-ready action', () => {
    const result = plan({ websites: [website('NoSiteCo', { presence: 'no_website', email: 'public@example.com' })] });

    expect(result.websiteActions[0]?.actionType).toBe('review_evidence');
    expect(result.websiteActions[0]?.reason).toContain('no dedicated website');
  });

  test('a functioning modern site without a specific weakness is excluded', () => {
    const result = plan({
      websites: [website('ModernCo', { presence: 'functioning_website', signal: '', decision: 'QUALIFIED' })],
    });

    expect(result.websiteActions).toHaveLength(0);
    expect(result.skippedCandidates[0]?.reason).toContain('Working site');
  });

  test('prepared context cannot create sent activity or a follow-up action', () => {
    const prepared = outreach('PreparedCo', '2026-06-25');
    prepared.messageSent = false;
    prepared.status = 'waiting';

    const result = plan({ outreach: [prepared] });

    expect(result.followUpActions).toHaveLength(0);
  });

  test('notification failure leaves the plan unchanged', () => {
    const result = plan({ qa: [qaLead('SafeCo', 1)] });
    const before = JSON.stringify(result);

    const notification = notifyDailyPlan(result, () => {
      const error = new Error('osascript unavailable') as Error & { status: number; stderr: string };
      error.status = 1;
      error.stderr = 'execution error: not allowed in this session';
      throw error;
    });

    expect(notification.succeeded).toBe(false);
    expect(notification.attemptedCommand).toBe('/usr/bin/osascript');
    expect(notification.exitCode).toBe(1);
    expect(notification.sanitizedStderr).toContain('not allowed');
    expect(JSON.stringify(result)).toBe(before);
  });

  test('search failure reuses the prior contact cache', () => {
    const cached = rotation([qaLead('CachedCo', 1)]);
    const unavailable: ContactAwareRotationReport = {
      generatedAt: now.toISOString(),
      status: 'SEARCH_UNAVAILABLE',
      readyLeads: [],
      evaluatedLeads: [],
      skippedLeads: [],
      nextManualAction: 'Search unavailable.',
      safetyRules: [],
    };

    expect(preferCachedRotation(unavailable, cached).readyLeads[0]?.companyName).toBe('CachedCo');
  });

  test('low commercial readiness and recurring preparation trigger bounded refresh', () => {
    const lowReadiness = plan({
      qa: [qaLead('VerifyCo', 1, 'CONTACT_BLOCKED')],
    });
    const ready = plan({
      qa: [qaLead('QA1', 1), qaLead('QA2', 2), qaLead('QA3', 3)],
    });

    expect(shouldTriggerAutomaticRefresh(lowReadiness, false)).toBe(true);
    expect(shouldTriggerAutomaticRefresh(ready, false)).toBe(false);
    expect(shouldTriggerAutomaticRefresh(ready, true)).toBe(true);
  });

  test('notification command is local-only', () => {
    const result = plan({ qa: [qaLead('SafeCo', 1)] });
    let command = '';
    let args: string[] = [];

    expect(notifyDailyPlan(result, (nextCommand, nextArgs) => {
      command = nextCommand;
      args = nextArgs;
    }).succeeded).toBe(true);
    expect(command).toBe('/usr/bin/osascript');
    expect(args.join(' ')).toContain('displayNotification');
  });

  test('launchd template contains no secrets and schedules 07:30', () => {
    const template = fs.readFileSync(path.join(process.cwd(), 'config/macos/com.aitestingengineer.studio.daily.plist.template'), 'utf8');

    expect(template).not.toMatch(/TAVILY_API_KEY|password|token/i);
    expect(template).toContain('<integer>7</integer>');
    expect(template).toContain('<integer>30</integer>');
  });

  test('installer resolves absolute repository and npm paths', () => {
    const installer = fs.readFileSync(path.join(process.cwd(), 'scripts/macos/install-daily-operator.sh'), 'utf8');

    expect(installer).toContain('REPO_ROOT=');
    expect(installer).toContain('command -v npm');
    expect(installer).toContain('plutil -lint');
  });

  test('daily actions remain manual-only', () => {
    const result = plan({
      outreach: [outreach('DueCo', '2026-06-25')],
      qa: [qaLead('QA1', 1)],
      websites: [website('Web1')],
    });

    expect(result.safetyRules.join(' ')).toContain('No outreach');
    expect(result.selectedActions.every((action) => /manual|verify/i.test(action.manualInstruction))).toBe(true);
  });

  test('suppresses a preparation-only company on its third consecutive run', () => {
    const result = plan({
      qa: [qaLead('RepeatedCo', 1, 'CONTACT_BLOCKED'), qaLead('NextCo', 2, 'CONTACT_BLOCKED')],
      recurrenceCounts: { repeatedco: 2 },
    });

    expect(result.selectedActions.map((action) => action.companyName)).not.toContain('RepeatedCo');
    expect(result.selectedActions.map((action) => action.companyName)).toContain('NextCo');
    expect(result.skippedCandidates.find((item) => item.companyName === 'RepeatedCo')?.reason).toContain('three consecutive runs');
  });

  test('skips low-commercial-fit QA targets and continues to later candidates', () => {
    const lowFit = qaLead('Zoho Creator', 1, 'LOW_COMMERCIAL_FIT');
    lowFit.reason = 'Low commercial fit for current small-business QA Audit outreach; skip unless a strong explicit trigger appears.';
    const result = plan({
      qa: [lowFit, qaLead('Later QA Co', 2)],
    });

    expect(result.selectedActions.map((action) => action.companyName)).toContain('Later QA Co');
    expect(result.selectedActions.map((action) => action.companyName)).not.toContain('Zoho Creator');
    expect(result.skippedCandidates.find((item) => item.companyName === 'Zoho Creator')?.reason).toContain('Low commercial fit');
  });

  test('renders action counters with corrected word spacing', () => {
    const result = plan({ qa: [qaLead('Businessand Co', 1)] });
    result.skippedCandidates.push({
      companyName: 'Spacing Co',
      reason: 'No useful action fortoday because businessand contact evidence is incomplete.',
    });

    const markdown = renderDailyRevenuePlan(result);

    expect(markdown).toContain('Total commercially ready actions: 1');
    expect(markdown).toContain('Total preparation actions: 0');
    expect(markdown).toContain('for today');
    expect(markdown).toContain('business and');
    expect(markdown).not.toContain('fortoday');
    expect(markdown).not.toContain('because businessand contact');
  });
});

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
