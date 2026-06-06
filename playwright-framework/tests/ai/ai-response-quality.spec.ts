import { request, expect, test } from '@playwright/test';
import { env } from '../../config/env';
import { expectedResponseRules, testPrompts } from '../../utils/testData';

test.describe('AI response quality', () => {
  test('returns a relevant response that follows basic quality rules', async () => {
    test.skip(!env.aiApiUrl, 'Set AI_API_URL to run AI response quality tests.');

    // Arrange
    const api = await request.newContext();
    const startedAt = Date.now();

    // Act
    const response = await api.post(env.aiApiUrl!, {
      data: { prompt: testPrompts.helpfulAnswer }
    });
    const responseBody = await response.json().catch(() => ({}));
    const answer = String(responseBody.answer ?? responseBody.message ?? responseBody.text ?? '');

    // Assert
    expect(response.ok()).toBeTruthy();
    expect(Date.now() - startedAt).toBeLessThan(expectedResponseRules.maxLatencyMs);
    expect(answer.length).toBeGreaterThanOrEqual(expectedResponseRules.minimumAnswerLength);
    expect(answer.toLowerCase()).toContain('test');
    await api.dispose();
  });
});

