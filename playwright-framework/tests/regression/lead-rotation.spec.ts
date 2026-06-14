import fs = require('fs');
import path = require('path');
import { expect, test } from '@playwright/test';
import { buildLeadRotationDecision, writeLeadRotationReports } from '../../../src/leadRotation/rotationRules';

test.describe('Lead Rotation regression', () => {
  test('demotes a not-ready top ranked lead', () => {
    // Arrange
    const decision = buildLeadRotationDecision();

    // Act
    const topRankedLead = decision.topRankedLead;

    // Assert
    expect(topRankedLead, 'Expected a top ranked lead').toBeTruthy();
    expect(topRankedLead?.companyName).toBe('Appointy');
    expect(topRankedLead?.readiness).toBe('NOT READY');
    expect(topRankedLead?.recommendation).toBe('DEMOTE');
  });

  test('promotes the highest commercially usable lead', () => {
    // Arrange
    const decision = buildLeadRotationDecision();

    // Act
    const actionableLead = decision.actionableLead;

    // Assert
    expect(actionableLead, 'Expected an actionable lead').toBeTruthy();
    expect(actionableLead?.readiness).toBe('READY');
    expect(actionableLead?.recommendation).toBe('PROMOTE');
    expect(actionableLead?.companyName).not.toBe(decision.topRankedLead?.companyName);
  });

  test('returns an actionable lead and rotation status', () => {
    // Arrange / Act
    const decision = buildLeadRotationDecision();

    // Assert
    expect(decision.rotationStatus).toBe('ACTIONABLE_LEAD_FOUND');
    expect(decision.actionableLead?.companyName).toBeTruthy();
    expect(decision.actionableLead?.commercialReadinessScore).toBeGreaterThan(0);
  });

  test('generates commercial ranking outputs', () => {
    // Arrange
    const decision = buildLeadRotationDecision();

    // Act
    const outputPaths = writeLeadRotationReports(decision);
    const commercialRankingPath = path.join(process.cwd(), 'output', 'lead-rotation', 'commercial-ranking.md');

    // Assert
    expect(outputPaths).toContain(commercialRankingPath);
    expect(fs.existsSync(commercialRankingPath)).toBe(true);
    expect(fs.readFileSync(commercialRankingPath, 'utf8')).toContain('Commercial Readiness Ranking');
  });
});
