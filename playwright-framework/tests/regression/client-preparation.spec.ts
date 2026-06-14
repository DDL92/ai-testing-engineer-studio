import { expect, test } from '@playwright/test';
import {
  buildClientOnboardingDocuments,
  clientPreparationPackageToOffer,
  isSupportedClientPreparationPackage,
} from '../../../src/clientWorkflow/clientWorkflowRules';
import { ClientWorkflowInput, LocalWorkflowSource } from '../../../src/clientWorkflow/types';
import { Lead, LeadScoreResult } from '../../../src/leads/types';

const source = (label: string): LocalWorkflowSource => ({
  label,
  path: `samples/${label.toLowerCase().replace(/\s+/g, '-')}.md`,
  exists: true,
  content: 'Sample source only.',
});

function inputForPackage(packageName: 'qa-audit' | 'starter-pack' | 'retainer'): ClientWorkflowInput {
  const recommendedOffer = clientPreparationPackageToOffer(packageName);
  const lead: Lead = {
    id: 'demo-lead',
    companyName: 'Demo Client',
    website: 'https://example.com',
    industry: 'Demo SaaS',
    source: 'sample',
    status: 'reviewing',
    fitNotes: 'Demo workflow with booking and onboarding risk.',
    painPoints: ['booking regression', 'mobile onboarding'],
    recommendedOffer,
    score: 8,
    createdAt: '2026-06-14T00:00:00.000Z',
    updatedAt: '2026-06-14T00:00:00.000Z',
    nextAction: 'Prepare delivery plan.',
  };
  const score: LeadScoreResult = {
    score: 8,
    reasons: ['Strong QA fit'],
    recommendedOffer,
  };

  return {
    lead,
    score,
    researchPack: source('Research Pack'),
    auditPack: source('Audit Pack'),
    outreachPack: source('Outreach Pack'),
    contactReview: source('Contact Review'),
  };
}

test.describe('Client conversion preparation regression', () => {
  test('accepts official package values and rejects invalid package values', () => {
    // Arrange
    const validPackages = ['qa-audit', 'starter-pack', 'retainer'];
    const invalidPackages = ['enterprise', 'free-trial', ''];

    // Act / Assert
    for (const packageName of validPackages) {
      expect(isSupportedClientPreparationPackage(packageName), `${packageName} should be valid`).toBe(true);
    }
    for (const packageName of invalidPackages) {
      expect(isSupportedClientPreparationPackage(packageName), `${packageName} should be invalid`).toBe(false);
    }
  });

  test('builds a valid delivery plan document for each official package', () => {
    // Arrange
    const validPackages = ['qa-audit', 'starter-pack', 'retainer'] as const;

    for (const packageName of validPackages) {
      // Act
      const documents = buildClientOnboardingDocuments(inputForPackage(packageName));
      const deliveryPlan = documents.find((document) => document.fileName === 'delivery-plan.md');

      // Assert
      expect(deliveryPlan, `Missing delivery plan for ${packageName}`).toBeTruthy();
      expect(deliveryPlan?.title).toBe('Delivery Plan');
      expect(deliveryPlan?.body).toContain('## Week 1');
      expect(deliveryPlan?.body).toContain('## Week 4');
      expect(deliveryPlan?.body).toContain('Manual Review Notes');
    }
  });
});
