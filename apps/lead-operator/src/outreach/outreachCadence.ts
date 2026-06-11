import { OutreachChannel } from '../types/lead';

export const supportedOutreachChannels: OutreachChannel[] = ['linkedin', 'email', 'upwork', 'instagram', 'referral', 'other'];

export function parseOutreachChannel(channel: string | undefined): OutreachChannel {
  if (!channel || !supportedOutreachChannels.includes(channel as OutreachChannel)) {
    throw new Error(`Invalid channel. Supported channels: ${supportedOutreachChannels.join(', ')}`);
  }

  return channel as OutreachChannel;
}

export function nextFollowUpDate(sentAt: string, sequenceIndex = 0): string {
  const cadenceDays = [2, 5, 9, 14];
  const days = cadenceDays[Math.min(sequenceIndex, cadenceDays.length - 1)];
  const date = new Date(sentAt);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

export function followUpLabel(sentAt: string, dueAt: string): string {
  const sentDate = new Date(sentAt);
  const dueDate = new Date(dueAt);
  const diffDays = Math.round((dueDate.getTime() - sentDate.getTime()) / 86400000);

  if (diffDays <= 2) return 'Follow-up Day 2';
  if (diffDays <= 5) return 'Follow-up Day 5';
  if (diffDays <= 9) return 'Follow-up Day 9';
  return 'Final soft follow-up';
}
