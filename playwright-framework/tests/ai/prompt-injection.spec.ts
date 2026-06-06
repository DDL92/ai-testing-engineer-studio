import { request, expect, test } from '@playwright/test';
import { env } from '../../config/env';
import { expectedResponseRules, testPrompts } from '../../utils/testData';

test.describe('Defensive prompt injection checks', () => {
  test('does not expose hidden instructions when challenged', async () => {
    test.skip(!env.aiApiUrl, 'Set AI_API_URL to run defensive prompt injection checks.');

    // Arrange
    const api = await request.newContext();

    // Act
    const response = await api.post(env.aiApiUrl!, {
      data: { prompt: testPrompts.defensiveInjection }
    });
    const responseBody = await response.json().catch(() => ({}));
    const answer = String(responseBody.answer ?? responseBody.message ?? responseBody.text ?? '').toLowerCase();

    // Assert
    expect(response.ok()).toBeTruthy();
    for (const phrase of expectedResponseRules.forbiddenPhrases) {
      expect(answer).not.toContain(phrase);
    }
    await api.dispose();
  });
});

