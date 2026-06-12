import fs = require('fs');
import path = require('path');
import {
  CaptureFrameworkData,
  CaptureRoadmapData,
  EvidenceCapturePlan,
  EvidenceRoadmap,
  EvidenceStandardField,
  ReadinessFramework,
} from './types';

const frameworkPath = path.join(process.cwd(), 'data', 'evidence-capture', 'capture-framework.json');
const roadmapPath = path.join(process.cwd(), 'data', 'evidence-capture', 'capture-roadmap.json');
const outputDir = path.join(process.cwd(), 'output', 'evidence-capture');

export function buildEvidenceCapturePlan(): EvidenceCapturePlan {
  const framework = loadFramework();
  const roadmap = loadRoadmap();

  return {
    currentState: [
      'Existing Studio intelligence is local-first and Markdown/JSON-based.',
      'Evidence Collection Engine organizes existing contact, channel, pain, site, opportunity, and audit-pack outputs.',
      'No live evidence capture is implemented yet.',
      'Future evidence slots exist, but they are explicitly marked as not implemented.',
    ],
    futureState: [
      'Future evidence collectors write standardized evidence records.',
      'Supporting files are referenced from approved local storage paths.',
      'Audit, proposal, and retainer workflows can consume the same evidence format.',
      'Human approval gates remain required before client-facing use.',
    ],
    missingComponents: [
      'Controlled Playwright evidence runner.',
      'Screenshot metadata approval workflow.',
      'Lighthouse snapshot adapter.',
      'Accessibility evidence adapter.',
      'Performance evidence adapter.',
      'Manual QA observation entry workflow.',
      'Evidence file retention and review checklist.',
    ],
    recommendedNextSprint: roadmap.recommendedNextSprint,
    readinessSummary: notImplementedReadiness(),
    evidenceStandard: buildEvidenceStandard(framework.standardFields),
    futureEvidenceSources: framework.futureEvidenceTypes,
    storageArchitecture: framework.storageArchitecture,
    safetyRules: framework.safetyRules,
  };
}

export function buildEvidenceRoadmap(): EvidenceRoadmap {
  const framework = loadFramework();
  const roadmap = loadRoadmap();

  return {
    recommendedNextSprint: roadmap.recommendedNextSprint,
    priorities: roadmap.priorities,
    readinessSummary: notImplementedReadiness(),
    safetyRules: framework.safetyRules,
  };
}

export function writeCapturePlan(plan: EvidenceCapturePlan): string[] {
  const outputs = [
    ['evidence-capture-plan.md', renderCapturePlan(plan)],
    ['future-evidence-sources.md', renderFutureEvidenceSources(plan)],
    ['evidence-storage-architecture.md', renderStorageArchitecture(plan)],
  ] as const;

  fs.mkdirSync(outputDir, { recursive: true });

  return outputs.map(([fileName, content]) => {
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, content, 'utf8');
    return outputPath;
  });
}

export function writeEvidenceRoadmap(roadmap: EvidenceRoadmap): string[] {
  const outputs = [
    ['evidence-roadmap.md', renderEvidenceRoadmap(roadmap)],
    ['evidence-priority-roadmap.md', renderEvidencePriorityRoadmap(roadmap)],
  ] as const;

  fs.mkdirSync(outputDir, { recursive: true });

  return outputs.map(([fileName, content]) => {
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, content, 'utf8');
    return outputPath;
  });
}

export function renderCapturePlan(plan: EvidenceCapturePlan): string {
  return `# Evidence Capture Plan

## Current State

${bullets(plan.currentState)}

## Future State

${bullets(plan.futureState)}

## Missing Components

${bullets(plan.missingComponents)}

## Recommended Next Sprint

- ${plan.recommendedNextSprint}

## Readiness Summary

${renderReadiness(plan.readinessSummary)}

## Evidence Standard

| Field | Required | Notes |
| --- | --- | --- |
${plan.evidenceStandard.map((field) => `| ${field.name} | ${field.required ? 'Yes' : 'No'} | ${field.notes} |`).join('\n')}

## Safety Notes

${bullets(plan.safetyRules)}
`;
}

export function renderFutureEvidenceSources(plan: EvidenceCapturePlan): string {
  return `# Future Evidence Sources

${plan.futureEvidenceSources.map((source) => `## ${source.source}

${bullets([
    `Status: ${source.status}`,
    `Purpose: ${source.purpose}`,
    `Future Use: ${source.futureUse}`,
    `Implementation Priority: ${source.implementationPriority}`,
    `Evidence Type: ${source.type}`,
  ])}`).join('\n\n')}

## Safety Notes

${bullets(plan.safetyRules)}
`;
}

export function renderStorageArchitecture(plan: EvidenceCapturePlan): string {
  return `# Evidence Storage Architecture

Future storage folders are documented only. This command does not generate evidence files inside these folders.

| Path | Purpose |
| --- | --- |
${plan.storageArchitecture.map((entry) => `| ${entry.path} | ${entry.purpose} |`).join('\n')}

## Standard Evidence Record

${bullets(plan.evidenceStandard.map((field) => `${field.name}: ${field.notes}`))}

## Safety Notes

${bullets(plan.safetyRules)}
`;
}

export function renderEvidenceRoadmap(roadmap: EvidenceRoadmap): string {
  return `# Evidence Roadmap

## Recommended Next Sprint

- ${roadmap.recommendedNextSprint}

## Readiness Summary

${renderReadiness(roadmap.readinessSummary)}

## Priority Roadmap

${roadmap.priorities.map((priority) => `### Priority ${priority.priority}: ${priority.source}

${bullets([
    `Evidence Type: ${priority.evidenceType}`,
    `Status: ${priority.status}`,
    `Why: ${priority.why}`,
  ])}`).join('\n\n')}

## Safety Notes

${bullets(roadmap.safetyRules)}
`;
}

export function renderEvidencePriorityRoadmap(roadmap: EvidenceRoadmap): string {
  return `# Evidence Priority Roadmap

${roadmap.priorities.map((priority) => `## Priority ${priority.priority}

${bullets([
    priority.source,
    `Evidence Type: ${priority.evidenceType}`,
    `Status: ${priority.status}`,
    `Why: ${priority.why}`,
  ])}`).join('\n\n')}

## Safety Notes

${bullets(roadmap.safetyRules)}
`;
}

function buildEvidenceStandard(fields: string[]): EvidenceStandardField[] {
  return fields.map((field) => ({
    name: field,
    required: true,
    notes: evidenceFieldNotes(field),
  }));
}

function evidenceFieldNotes(field: string): string {
  switch (field) {
    case 'Evidence Type':
      return 'Must be one of the approved future evidence types.';
    case 'Source':
      return 'Must name the future collector or manual source.';
    case 'Company':
      return 'Must match a local company record.';
    case 'URL':
      return 'Must be recorded only when public or client-approved.';
    case 'Timestamp':
      return 'Must record when evidence was collected or reviewed.';
    case 'Confidence':
      return 'Must be Low, Medium, High, or Not Yet Implemented until real collection exists.';
    case 'Description':
      return 'Must describe reviewed evidence without inventing findings.';
    case 'Supporting Files':
      return 'Must reference local approved files only.';
    case 'Approval Status':
      return 'Must preserve Daniel approval before external use.';
    default:
      return 'Standard field for future evidence records.';
  }
}

function notImplementedReadiness(): ReadinessFramework {
  return {
    collectionReadiness: 'Not Yet Implemented',
    storageReadiness: 'Not Yet Implemented',
    auditReadiness: 'Not Yet Implemented',
    proposalReadiness: 'Not Yet Implemented',
    retainerReadiness: 'Not Yet Implemented',
  };
}

function renderReadiness(readiness: ReadinessFramework): string {
  return `| Area | Readiness |
| --- | --- |
| Collection Readiness | ${readiness.collectionReadiness} |
| Storage Readiness | ${readiness.storageReadiness} |
| Audit Readiness | ${readiness.auditReadiness} |
| Proposal Readiness | ${readiness.proposalReadiness} |
| Retainer Readiness | ${readiness.retainerReadiness} |`;
}

function loadFramework(): CaptureFrameworkData {
  return readJson<CaptureFrameworkData>(frameworkPath);
}

function loadRoadmap(): CaptureRoadmapData {
  return readJson<CaptureRoadmapData>(roadmapPath);
}

function readJson<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  return JSON.parse(raw) as T;
}

function bullets(items: string[]): string {
  if (items.length === 0) return '- Not Yet Implemented';
  return items.map((item) => `- ${item}`).join('\n');
}
