import { ContactEvidenceInput } from './types';

const simplyBookManualEvidence: ContactEvidenceInput[] = [
  {
    companyName: 'SimplyBook.me',
    fullName: 'Yuriy Protsiuk',
    title: 'Product Owner',
    sourceUrl: 'https://ua.linkedin.com/in/yuriy-protsiuk',
    sourceType: 'search-result-snippet',
    evidenceSummary: 'Manual public LinkedIn evidence identified Yuriy Protsiuk as Product Owner at SimplyBook.me. Current-company evidence requires independent confirmation because public snippets conflict.',
    currentEmploymentVerified: false,
    employmentStatus: 'current',
    snippetOnly: true,
    publicProfileUrl: 'https://ua.linkedin.com/in/yuriy-protsiuk',
  },
  {
    companyName: 'SimplyBook.me',
    fullName: 'Rut Steinsen',
    title: 'CEO',
    sourceUrl: 'https://cy.linkedin.com/in/rutsteinsen',
    sourceType: 'search-result-snippet',
    evidenceSummary: 'Public LinkedIn snippet identifies Rut Steinsen as CEO at SimplyBook.me and shows SimplyBook.me as present employment.',
    currentEmploymentVerified: false,
    employmentStatus: 'current',
    snippetOnly: true,
    publicProfileUrl: 'https://cy.linkedin.com/in/rutsteinsen',
  },
  {
    companyName: 'SimplyBook.me',
    fullName: 'Sviatoslav Bordovski',
    title: 'QA Automation Lead',
    sourceUrl: 'https://ae.linkedin.com/in/sviatoslavbordovski',
    sourceType: 'search-result-snippet',
    evidenceSummary: 'Public LinkedIn evidence shows SimplyBook.me only as past employment; the current headline does not establish current SimplyBook.me employment.',
    currentEmploymentVerified: false,
    employmentStatus: 'past',
    snippetOnly: true,
    publicProfileUrl: 'https://ae.linkedin.com/in/sviatoslavbordovski',
  },
];

export function manualContactEvidence(companyName: string): ContactEvidenceInput[] {
  if (normalize(companyName) !== 'simplybook me') return [];
  return simplyBookManualEvidence.map((item) => ({ ...item }));
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
