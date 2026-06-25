import { DeliveryQueue } from './deliveryLeadTypes';
import { LeadVertical } from './types';

export type LeadOutcomeStatus =
  | 'not_contacted'
  | 'contacted'
  | 'responded'
  | 'interest_verified'
  | 'meeting_booked'
  | 'quote_sent'
  | 'won'
  | 'lost'
  | 'bad_fit'
  | 'already_booked'
  | 'no_response';

export interface LeadOutcomeRecord {
  leadId: string;
  clientId: string;
  clientName: string;
  vertical: LeadVertical;
  outcomeStatus: LeadOutcomeStatus;
  outcomeNotes: string;
  estimatedValue: number;
  sourceName: string;
  leadType: string;
  deliveryQueue: DeliveryQueue;
  isSample?: boolean;
  recordedAt: string;
  updatedAt: string;
}
