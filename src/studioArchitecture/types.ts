export type RuntimeClassification = 'source-of-truth' | 'generated' | 'cache' | 'runtime' | 'sample' | 'temporary';

export interface StudioCommand {
  name: string;
  script: string;
  domain: string;
  status: 'official-candidate' | 'legacy' | 'candidate-deprecation' | 'supporting';
  reasons: string[];
}

export interface CommandGroup {
  key: string;
  commands: StudioCommand[];
  reason: string;
}

export interface CommandInventory {
  totalCommands: number;
  officialCommands: StudioCommand[];
  legacyCommands: StudioCommand[];
  candidateDeprecations: StudioCommand[];
  supportingCommands: StudioCommand[];
  duplicateCommandGroups: CommandGroup[];
  overlappingCommandGroups: CommandGroup[];
  officialRecommendations: string[];
}

export interface RuntimeInventoryItem {
  path: string;
  root: 'data' | 'output' | 'runtime' | 'dashboard' | 'samples';
  classification: RuntimeClassification;
  sizeBytes: number;
  modifiedAt: string;
  staleDays: number;
  notes: string[];
}

export interface RuntimeInventory {
  totalFiles: number;
  byClassification: Record<RuntimeClassification, number>;
  duplicateDataCandidates: CommandGroup[];
  staleFiles: RuntimeInventoryItem[];
  candidateArchives: RuntimeInventoryItem[];
  files: RuntimeInventoryItem[];
}

export interface SourceOfTruthItem {
  authority: string;
  sourcePath: string;
  derivedOutputs: string[];
  cachePaths: string[];
  manualEditPolicy: string;
}

export interface ArchitectureAudit {
  generatedAt: string;
  commandInventory: CommandInventory;
  runtimeInventory: RuntimeInventory;
  sourceOfTruth: SourceOfTruthItem[];
  architectureStatus: string;
  commandHealth: string;
  runtimeHealth: string;
  consolidationProgress: string;
  risks: string[];
}
