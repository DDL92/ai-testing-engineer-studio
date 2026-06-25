export type BuyerRole =
  | 'buyer_service'
  | 'vendor'
  | 'directory'
  | 'staffing_recruitment'
  | 'job_posting'
  | 'employee_seeking_work'
  | 'unknown';

export type BuyerRoleConfidence =
  | 'low'
  | 'medium'
  | 'high';

export interface BuyerRoleClassification {
  buyerRole: BuyerRole;
  buyerRoleConfidence: BuyerRoleConfidence;
  buyerRoleSignals: string[];
  buyerRoleReasons: string[];
}
