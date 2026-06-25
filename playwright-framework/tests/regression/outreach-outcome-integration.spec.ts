import { expect, test } from '@playwright/test';
import { OutcomeRecord } from '../../../src/outcomeTracking/types';
import {
  buildOutreachSummary,
  buildPlannedFollowUps,
  loadOutreachRecords,
  mergeOutreachRecords,
  outcomeToOutreachRecord,
  parseFollowUpDate,
  renderOutreachStatus,
} from '../../../src/outreachTracking/outreachTrackingRules';
import { OutreachRecord } from '../../../src/outreachTracking/types';

function outcome(overrides: Partial<OutcomeRecord> = {}): OutcomeRecord {
  return {
    company: 'SimplyBook.me',
    contact: 'Rut Steinsen',
    channel: 'linkedin',
    date: '2026-06-22',
    action_type: 'manual_dm',
    message_sent: true,
    response_status: 'sent',
    meeting_status: 'not_sent',
    proposal_status: 'not_sent',
    deal_status: 'not_sent',
    revenue_status: 'not_sent',
    amount: 0,
    notes: '',
    next_action: 'Wait for reply; follow up on 2026-06-25 if no response',
    ...overrides,
  };
}

function legacy(overrides: Partial<OutreachRecord> = {}): OutreachRecord {
  return {
    companyId: 'simplybook-me',
    companyName: 'SimplyBook.me',
    contactName: 'Rut Steinsen',
    contactRole: '',
    channel: 'linkedin',
    status: 'message-sent',
    sentAt: '2026-06-22',
    lastTouchAt: '2026-06-22',
    nextFollowUpAt: '2026-06-25',
    messageType: 'manual LinkedIn message',
    notes: '',
    humanApproved: true,
    source: 'Legacy Outreach',
    messageSent: true,
    replyReceived: false,
    ...overrides,
  };
}

test.describe('Outcome and outreach integration', () => {
  test('counts a sent outcome once without treating sent as a reply', () => {
    // Arrange
    const records = [outcomeToOutreachRecord(outcome())];

    // Act
    const summary = buildOutreachSummary(records, '2026-06-23');

    // Assert
    expect(summary.messagesSent).toBe(1);
    expect(summary.replied).toBe(0);
    expect(summary.waiting).toBe(1);
  });

  test('loads SimplyBook.me as actual Outcome Tracking outreach', () => {
    // Arrange / Act
    const record = loadOutreachRecords().find((item) =>
      item.companyName === 'SimplyBook.me' && item.contactName === 'Rut Steinsen');

    // Assert
    expect(record).toMatchObject({
      sentAt: '2026-06-22',
      nextFollowUpAt: '2026-06-25',
      source: 'Outcome Tracking',
      messageSent: true,
      replyReceived: false,
    });
  });

  test('recognizes structured and historical free-text follow-up dates', () => {
    expect(parseFollowUpDate(outcome().next_action)).toBe('2026-06-25');
    expect(outcomeToOutreachRecord(outcome({ follow_up_date: '2026-06-26' })).nextFollowUpAt).toBe('2026-06-26');
  });

  test('includes SimplyBook.me when the follow-up is upcoming or due', () => {
    const records = [outcomeToOutreachRecord(outcome())];

    expect(buildPlannedFollowUps(records, '2026-06-23')).toHaveLength(1);
    expect(buildPlannedFollowUps(records, '2026-06-25')).toHaveLength(1);
  });

  test('deduplicates the same outreach across outcome and legacy stores', () => {
    const merged = mergeOutreachRecords([
      outcomeToOutreachRecord(outcome()),
      legacy(),
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.source).toBe('Outcome Tracking');
    expect(buildOutreachSummary(merged, '2026-06-25').messagesSent).toBe(1);
  });

  test('keeps prepared drafts and discovered contacts out of sent activity', () => {
    const records = [outcomeToOutreachRecord(outcome())];
    const context = {
      preparedButUnsent: ['Prepared Co - Draft Contact (prepared)'],
      contactDiscoveryCandidates: ['Discovery Co (CONTACT_BLOCKED)'],
    };

    const summary = buildOutreachSummary(records, '2026-06-23', context);
    const report = renderOutreachStatus(summary, records, context, '2026-06-23');

    expect(summary.messagesSent).toBe(1);
    expect(summary.totalCompaniesContacted).toBe(1);
    expect(summary.preparedButUnsent).toBe(1);
    expect(summary.contactDiscoveryCandidates).toBe(1);
    expect(report).toContain('Prepared But Unsent Leads');
    expect(report).toContain('Contact-Discovery Candidates');
  });

  test('only renders manual review guidance and performs no external action', () => {
    const records = [outcomeToOutreachRecord(outcome())];
    const report = renderOutreachStatus(
      buildOutreachSummary(records, '2026-06-25'),
      records,
      undefined,
      '2026-06-25',
    );

    expect(report).toContain('No messages, invitations, emails, or follow-ups are sent.');
    expect(report).toContain('Human approval remains required before any external action.');
  });
});
