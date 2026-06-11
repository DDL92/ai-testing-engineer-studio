import { Lead, LeadScoreResult, RecommendedOffer } from '../leads/types';
import { OutboundPlan } from '../outbound/types';

export interface LeadPackSection {
  title: string;
  body: string[];
}

export interface LeadPackRecommendation {
  label: string;
  reason: string;
  suggestedManualAction: string;
}

export interface LeadPack {
  leadId: string;
  companyName: string;
  generatedAt: string;
  score: LeadScoreResult;
  recommendedOffer: RecommendedOffer;
  sections: LeadPackSection[];
  recommendations: LeadPackRecommendation[];
  suggestedNextCommands: string[];
  safetyReminder: string[];
  outboundPlan: OutboundPlan;
}

export interface LeadPackInput {
  lead: Lead;
  score: LeadScoreResult;
}
