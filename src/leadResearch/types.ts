export type ContactDepartment =
  | 'founder'
  | 'product'
  | 'engineering'
  | 'customer-success'
  | 'operations'
  | 'marketing'
  | 'other';

export type ContactStatus =
  | 'identified'
  | 'invitation-sent'
  | 'message-sent'
  | 'connected'
  | 'replied'
  | 'not-contacted'
  | 'do-not-contact';

export interface ContactRecord {
  name: string;
  role: string;
  department: ContactDepartment;
  linkedinUrl: string;
  priority: number;
  reason: string;
  status: ContactStatus;
  source: string;
  notes: string;
}

export interface CompanyContactRecord {
  companyId: string;
  companyName: string;
  contacts: ContactRecord[];
}

export interface ContactCoverage {
  company: CompanyContactRecord;
  founderContacts: ContactRecord[];
  productContacts: ContactRecord[];
  engineeringContacts: ContactRecord[];
  customerSuccessContacts: ContactRecord[];
  missingDepartments: ContactDepartment[];
  recommendedNextContact: string;
  recommendedChannel: string;
  safetyNotes: string[];
}
