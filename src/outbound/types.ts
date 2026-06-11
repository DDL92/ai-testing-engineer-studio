import { Lead, OutreachChannel, OutreachStatus } from '../leads/types';

export interface OutboundRecommendation {
  channel: OutreachChannel;
  status: OutreachStatus;
  nextAction: string;
  followUpTiming: string;
  checklist: string[];
}

export interface OutboundPlan {
  lead: Lead;
  recommendation: OutboundRecommendation;
  manualMessage: string;
  followUpMessage: string;
  safetyReminder: string[];
}
