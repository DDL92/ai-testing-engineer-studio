import path = require('path');

const testOutputRoot = path.join(process.cwd(), 'tmp', 'test-output');

export function isStudioTestMode(): boolean {
  return process.env.STUDIO_TEST_MODE === '1' || process.env.NODE_ENV === 'test';
}

export function runtimeDataPath(...segments: string[]): string {
  return path.join(isStudioTestMode() ? path.join(testOutputRoot, 'data') : path.join(process.cwd(), 'data'), ...segments);
}

export function runtimeOutputPath(...segments: string[]): string {
  return path.join(isStudioTestMode() ? path.join(testOutputRoot, 'output') : path.join(process.cwd(), 'output'), ...segments);
}

export function runtimeRootPath(...segments: string[]): string {
  return path.join(isStudioTestMode() ? testOutputRoot : process.cwd(), ...segments);
}
