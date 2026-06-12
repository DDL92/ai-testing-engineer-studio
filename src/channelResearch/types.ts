import { Lead } from '../leads/types';
import { CompanyContactRecord, ContactRecord } from '../leadResearch/types';

export type ChannelType =
  | 'linkedin'
  | 'website-contact-form'
  | 'demo-request'
  | 'public-email'
  | 'partnership'
  | 'blog'
  | 'community'
  | 'events'
  | 'podcast'
  | 'webinar'
  | 'public-slack-discord'
  | 'product-contact'
  | 'support-contact';

export interface ChannelRecord {
  company: string;
  companyId: string;
  channel: string;
  url: string;
  type: ChannelType;
  priority: number;
  notes: string;
}

export interface ChannelCompanyProfile {
  lead: Pick<Lead, 'id' | 'companyName' | 'website' | 'industry' | 'score' | 'painPoints'>;
  companyId: string;
  companyName: string;
  contacts?: CompanyContactRecord;
  channels: ChannelRecord[];
  recommendedOrder: ChannelRecommendation[];
  outreachAngles: OutreachAngle[];
}

export interface ChannelRecommendation {
  channel: string;
  reason: string;
  priority: number;
}

export interface OutreachAngle {
  department: 'Product' | 'Engineering' | 'Customer Success' | 'Operations';
  angle: string;
}

export interface ChannelPlanItem {
  companyId: string;
  companyName: string;
  score: number;
  priorityScore: number;
  recommendedChannels: ChannelRecommendation[];
  nextAction: string;
}

export interface ChannelPlan {
  generatedAt: string;
  today: ChannelPlanItem[];
  safetyNotes: string[];
}

export type PublicContact = ContactRecord;
