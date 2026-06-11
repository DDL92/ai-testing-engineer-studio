import { Lead, LeadScoreResult, RecommendedOffer } from '../leads/types';

export interface LeadResearchPack {
  lead: Lead;
  score: LeadScoreResult;
  sections: LeadResearchSection[];
  revenuePotential: RevenuePotential;
  suggestedCommands: string[];
}

export interface LeadResearchSection {
  title: string;
  body: string[];
}

export interface RevenuePotential {
  recommendedOffer: RecommendedOffer;
  priceRange: string;
  engagementPath: string[];
  note: string;
}
