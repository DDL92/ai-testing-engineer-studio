import fs = require('fs');
import path = require('path');
import {
  CompanyContactRecord,
  ContactCoverage,
  ContactDepartment,
  ContactRecord,
} from './types';

const contactsPath = path.join(process.cwd(), 'data', 'contacts', 'contacts.json');
const outputDir = path.join(process.cwd(), 'output', 'contact-research');

const departmentsToReport: ContactDepartment[] = [
  'founder',
  'product',
  'engineering',
  'customer-success',
];

export function loadCompanyContacts(): CompanyContactRecord[] {
  const raw = fs.readFileSync(contactsPath, 'utf8').trim();
  if (!raw) return [];
  return JSON.parse(raw) as CompanyContactRecord[];
}

export function findCompanyContactRecord(company: string): CompanyContactRecord | undefined {
  const normalized = normalize(company);
  return loadCompanyContacts().find((record) => {
    return normalize(record.companyId) === normalized || normalize(record.companyName) === normalized;
  });
}

export function buildContactCoverage(company: CompanyContactRecord): ContactCoverage {
  const founderContacts = contactsForDepartment(company.contacts, 'founder');
  const productContacts = contactsForDepartment(company.contacts, 'product');
  const engineeringContacts = contactsForDepartment(company.contacts, 'engineering');
  const customerSuccessContacts = contactsForDepartment(company.contacts, 'customer-success');
  const missingDepartments = departmentsToReport.filter((department) => contactsForDepartment(company.contacts, department).length === 0);

  return {
    company,
    founderContacts,
    productContacts,
    engineeringContacts,
    customerSuccessContacts,
    missingDepartments,
    recommendedNextContact: recommendNextContact(company.contacts, missingDepartments),
    recommendedChannel: recommendChannel(company.contacts),
    safetyNotes: [
      'Manual research only. Do not scrape LinkedIn, call APIs, enrich private data, or use credentials.',
      'Do not invent additional contacts, roles, LinkedIn URLs, emails, or personalization.',
      'This command does not send invitations, messages, emails, or follow-ups.',
      'Daniel must approve contact, channel, and message before any external action.',
    ],
  };
}

export function writeContactResearchReport(coverage: ContactCoverage): string {
  const outputPath = path.join(outputDir, `${coverage.company.companyId}-contact-research.md`);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, renderContactResearchReport(coverage), 'utf8');
  return outputPath;
}

export function renderContactResearchReport(coverage: ContactCoverage): string {
  return `# Contact Research: ${coverage.company.companyName}

## Company

${bullets([
    `Company ID: ${coverage.company.companyId}`,
    `Company: ${coverage.company.companyName}`,
    `Total identified contacts: ${coverage.company.contacts.length}`,
  ])}

## Contact Coverage

${bullets([
    `Founder contacts: ${coverage.founderContacts.length}`,
    `Product contacts: ${coverage.productContacts.length}`,
    `Engineering contacts: ${coverage.engineeringContacts.length}`,
    `Customer Success contacts: ${coverage.customerSuccessContacts.length}`,
  ])}

## Founder Contacts

${renderContacts(coverage.founderContacts)}

## Product Contacts

${renderContacts(coverage.productContacts)}

## Engineering Contacts

${renderContacts(coverage.engineeringContacts)}

## Customer Success Contacts

${renderContacts(coverage.customerSuccessContacts)}

## Missing Contact Gaps

${coverage.missingDepartments.length > 0 ? bullets(coverage.missingDepartments.map(formatDepartmentGap)) : '- No required contact gaps identified.'}

## Recommended Next Contact

${coverage.recommendedNextContact}

## Recommended Channel

${coverage.recommendedChannel}

## Safety Notes

${bullets(coverage.safetyNotes)}
`;
}

function contactsForDepartment(contacts: ContactRecord[], department: ContactDepartment): ContactRecord[] {
  return contacts
    .filter((contact) => contactMatchesDepartment(contact, department))
    .sort((left, right) => left.priority - right.priority || left.name.localeCompare(right.name));
}

function contactMatchesDepartment(contact: ContactRecord, department: ContactDepartment): boolean {
  if (contact.department === department) return true;

  const role = contact.role.toLowerCase();

  if (department === 'founder') return role.includes('founder') || role.includes('co-founder') || role.includes('ceo');
  if (department === 'product') return role.includes('product');
  if (department === 'engineering') return role.includes('engineering') || role.includes('technology') || /\bcto\b/.test(role);
  if (department === 'customer-success') return role.includes('customer success') || role.includes('support');

  return false;
}

function recommendNextContact(contacts: ContactRecord[], missingDepartments: ContactDepartment[]): string {
  if (missingDepartments.includes('customer-success')) {
    return 'Manually identify a real Customer Success or Support leader next. Use only public, manually reviewed sources.';
  }

  const notMessaged = contacts
    .filter((contact) => contact.status === 'identified' || contact.status === 'not-contacted' || contact.status === 'connected')
    .sort((left, right) => left.priority - right.priority);

  if (notMessaged[0]) {
    return `${notMessaged[0].name} (${notMessaged[0].role}) is the next local candidate to review because status is ${notMessaged[0].status}. Daniel approval is required before messaging.`;
  }

  return 'No new contact is ready from local data. Wait for connection acceptance or manually research the missing gaps.';
}

function recommendChannel(contacts: ContactRecord[]): string {
  const hasLinkedInPath = contacts.some((contact) => contact.linkedinUrl || contact.status === 'invitation-sent' || contact.status === 'message-sent' || contact.status === 'connected');
  if (hasLinkedInPath) return 'LinkedIn manual review path. No automated LinkedIn activity is allowed.';
  return 'No channel is ready. Manually verify a public channel before outreach.';
}

function renderContacts(contacts: ContactRecord[]): string {
  if (contacts.length === 0) return 'Not identified yet.';

  return bullets(contacts.map((contact) => {
    const linkedIn = contact.linkedinUrl || 'Not recorded';
    return `${contact.name} - ${contact.role} - status: ${contact.status} - priority: ${contact.priority} - LinkedIn: ${linkedIn} - reason: ${contact.reason}`;
  }));
}

function formatDepartmentGap(department: ContactDepartment): string {
  return `${formatDepartment(department)}: Not identified yet.`;
}

function formatDepartment(department: ContactDepartment): string {
  return department
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function bullets(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}
