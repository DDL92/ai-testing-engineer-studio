import { expect, test } from '@playwright/test';
import { runnerSequence } from '../../../src/autonomousRunner/runnerRules';

test.describe('Runner orchestration regression', () => {
  test('keeps required daily refresh sequence in order', () => {
    // Arrange
    const requiredOrder = [
      'web:lead-discovery',
      'web:pain-mining',
      'web:lead-normalize',
      'web:lead-classify',
      'web:lead-qualify',
      'web:qualified-ranking',
      'revenue:focus',
      'dashboard:generate',
    ];

    // Act
    const scripts = runnerSequence.map((command) => command.script);

    // Assert
    for (const script of requiredOrder) {
      expect(scripts, `Runner sequence missing ${script}`).toContain(script);
    }
    const indexes = requiredOrder.map((script) => scripts.indexOf(script));
    expect(indexes).toEqual([...indexes].sort((left, right) => left - right));
  });
});
