import { scanOutputHealth } from './scanOutputs';

export function scanGeneratedArtifacts() {
  return scanOutputHealth();
}
