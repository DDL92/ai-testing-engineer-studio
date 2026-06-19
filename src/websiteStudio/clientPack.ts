import type {
  ClientHistoryRecord,
  ClientPackContext,
  ClientRecord,
} from './clientTypes';

export function buildClientRecord(context: ClientPackContext, createdAt: string): ClientRecord {
  const { acceptance } = context;
  return {
    clientId: acceptance.clientId,
    leadId: acceptance.leadId,
    clientName: acceptance.clientName,
    createdAt,
    acceptanceStatus: 'accepted',
    selectedOffer: acceptance.selectedOffer,
    proposedPriceRange: context.proposedPriceRange,
    agreedPriceUsd: acceptance.agreedPriceUsd,
    priceRangeStatus: context.priceRangeStatus,
    depositStatus: acceptance.depositStatus,
    scopeConfirmed: true,
    targetStartDate: acceptance.targetStartDate,
    targetDeliveryDate: acceptance.targetDeliveryDate,
    primaryContactName: acceptance.primaryContactName,
    primaryContactEmail: acceptance.primaryContactEmail,
    domainStatus: acceptance.domainStatus,
    hostingStatus: acceptance.hostingStatus,
    brandAssetsStatus: acceptance.brandAssetsStatus,
    contentStatus: acceptance.contentStatus,
    leadPackPath: context.leadPackPath,
    demoPackPath: context.demoPackPath,
    salesPackPath: context.salesPackPath,
    onboardingStatus: 'not_started',
    deliveryStatus: 'planning',
    qaStatus: 'not_started',
    maintenanceStatus: 'proposed',
    deploymentAuthorized: false,
    credentialsStored: false,
    paymentVerified: false,
    manualReviewRequired: true,
    notes: acceptance.notes,
  };
}

export function buildHistoryRecord(
  context: ClientPackContext,
  createdAt: string,
  outputDirectory: string,
): ClientHistoryRecord {
  return {
    clientId: context.acceptance.clientId,
    leadId: context.acceptance.leadId,
    clientName: context.acceptance.clientName,
    selectedOffer: context.acceptance.selectedOffer,
    acceptanceStatus: 'accepted',
    createdAt,
    outputDirectory,
  };
}

export function renderOnboardingChecklist(context: ClientPackContext): string {
  const acceptance = context.acceptance;
  const checked = (confirmed: boolean): string => confirmed ? '[x]' : '[ ]';
  const fixture = fixtureNotice(context);
  const priceConfirmed = acceptance.agreedPriceUsd !== null;
  return `# Onboarding Checklist: ${acceptance.clientName}

${fixture}Onboarding status: **NOT_STARTED**. Checked items reflect only explicit acceptance input.

- ${checked(acceptance.scopeConfirmed)} Signed or explicitly accepted scope confirmed
- ${checked(Boolean(acceptance.selectedOffer))} Selected package confirmed
- ${checked(priceConfirmed)} Agreed price confirmed
- [ ] Payment terms confirmed manually
- ${checked(Boolean(acceptance.primaryContactName || acceptance.primaryContactEmail))} Primary contact confirmed
- ${checked(Boolean(acceptance.targetStartDate && acceptance.targetDeliveryDate))} Target dates confirmed
- ${checked(isConfirmed(acceptance.domainStatus))} Domain ownership confirmed
- ${checked(isConfirmed(acceptance.hostingStatus))} Hosting ownership confirmed
- [ ] Access method agreed
- [ ] Existing website backup responsibility confirmed
- ${checked(isReceived(acceptance.brandAssetsStatus))} Brand guidelines received
- ${checked(isReceived(acceptance.brandAssetsStatus))} Logo files received
- ${checked(isReceived(acceptance.brandAssetsStatus))} Approved photos/videos received
- ${checked(isReceived(acceptance.contentStatus))} Business copy received or copy scope agreed
- [ ] Services/products confirmed
- ${checked(Boolean(acceptance.primaryContactEmail))} Contact information confirmed
- [ ] Legal/privacy content responsibility confirmed
- [ ] Third-party integrations identified
- [ ] Booking/contact requirements confirmed
- [ ] Analytics requirements confirmed
- [ ] Revision process explained
- [ ] Final approval process explained

No payment, deployment, hosting, domain, or credential status is verified by this checklist.
`;
}

export function renderAssetRequest(context: ClientPackContext): string {
  return `# Asset Request Draft: ${context.acceptance.clientName}

${fixtureNotice(context)}This request has not been sent.

## 1. Required business information

Business name, description, services/products, locations, operating details, public contact information, and approved calls to action. Preferred format: DOCX, Markdown, or clearly structured text.

## 2. Brand assets

Logo variants, brand guidelines, color references, and approved font information. Preferred formats: SVG, PDF, EPS, PNG, and documented font licenses.

## 3. Website content

Approved page copy, headings, service descriptions, contact details, and required disclaimers. Preferred formats: DOCX, Markdown, CSV, or structured text.

## 4. Visual assets

Authorized photos, video, illustrations, and image captions. Preferred formats: original high-resolution JPG/PNG/WebP, MP4/WebM, or SVG. Identify every copyrighted, licensed, or attribution-required asset.

## 5. Domain and hosting information

Provider names, ownership contact, renewal responsibility, current technical constraints, and the approved access process. **Do not send passwords, tokens, private keys, recovery codes, or payment details through email, chat, or this project.**

Secure credential-sharing method: **[AGREE ON A SEPARATE SECURE METHOD — DO NOT INSERT CREDENTIALS HERE]**

## 6. Integrations

Names and requirements for booking, contact, analytics, maps, email, CRM, or other approved services. Share no API keys or secrets in project files.

## 7. Legal and policy content

Client-approved privacy, cookie, terms, accessibility, and regulatory content, plus confirmation of who is responsible for legal review.

## 8. Approval contacts

Primary approver, backup approver, consolidated-feedback process, and final publication/deployment authority.

Provide authorized assets only. Do not include private identity documents, banking details, hosting credentials, domain credentials, or payment-card data.
`;
}

function fixtureNotice(context: ClientPackContext): string {
  return context.fictional
    ? '> Fictional validation fixture. This document is test-only and must not be sent.\n\n'
    : '';
}

function isConfirmed(value: string): boolean {
  return /^(confirmed|owned|client_owned)$/i.test(value);
}

function isReceived(value: string): boolean {
  return /^(received|complete|approved)$/i.test(value);
}
