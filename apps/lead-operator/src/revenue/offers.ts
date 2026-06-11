import { BillingType, OfferType } from '../types/lead';

export interface OfferDefinition {
  id: OfferType;
  name: string;
  defaultPrice: number;
  billingType: BillingType;
  description: string;
  recommendedFor: string;
}

export const offers: OfferDefinition[] = [
  {
    id: 'free_mini_audit',
    name: 'Free Mini QA Audit',
    defaultPrice: 0,
    billingType: 'one_time',
    description: 'Lightweight public-page QA review used to start a qualified conversation.',
    recommendedFor: 'Warm leads needing trust before a paid audit.',
  },
  {
    id: 'detailed_qa_audit',
    name: '$199 Detailed QA Audit',
    defaultPrice: 199,
    billingType: 'one_time',
    description: 'Client-ready QA audit with risks, screenshots, and recommended automation roadmap.',
    recommendedFor: 'Teams with visible QA risk but not ready for implementation.',
  },
  {
    id: 'playwright_starter_pack',
    name: '$900 Playwright Starter Pack',
    defaultPrice: 900,
    billingType: 'one_time',
    description: 'Initial Playwright + TypeScript coverage for high-risk workflows with reporting.',
    recommendedFor: 'SaaS teams needing practical automation setup.',
  },
  {
    id: 'qa_automation_setup',
    name: '$1,500 QA Automation Setup',
    defaultPrice: 1500,
    billingType: 'one_time',
    description: 'Broader setup project for Playwright, CI reporting, and core regression workflows.',
    recommendedFor: 'Higher-fit teams with clear automation gaps.',
  },
  {
    id: 'monthly_qa_maintenance',
    name: '$1,000/month QA Automation Maintenance',
    defaultPrice: 1000,
    billingType: 'monthly',
    description: 'Recurring QA automation maintenance, regression coverage, and release support.',
    recommendedFor: 'Teams shipping frequently that need ongoing QA ownership.',
  },
  {
    id: 'custom',
    name: 'Custom Offer',
    defaultPrice: 0,
    billingType: 'one_time',
    description: 'Manually configured custom offer.',
    recommendedFor: 'Custom scope or mixed billing situations.',
  },
];

export function getOffer(offerType: string | undefined): OfferDefinition {
  const offer = offers.find((item) => item.id === offerType);
  if (!offer) throw new Error(`Invalid offer. Supported offers: ${offers.map((item) => item.id).join(', ')}`);
  return offer;
}

export function estimateSuggestedOfferValue(suggestedOffer: string): number {
  if (suggestedOffer.includes('$1,500')) return 1500;
  if (suggestedOffer.includes('$900')) return 900;
  if (suggestedOffer.includes('$199')) return 199;
  return 0;
}
