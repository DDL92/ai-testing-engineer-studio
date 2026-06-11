export type ContentPlatform = 'linkedin' | 'instagram' | 'short-video';

export type ContentFormat =
  | 'linkedin-post'
  | 'instagram-carousel'
  | 'short-video-script'
  | 'qa-lesson'
  | 'audit-insight';

export interface ContentSource {
  auditPath: string;
  sourceLabel: string;
  findingTitles: string[];
}

export interface ContentSafetyNote {
  rule: string;
  reason: string;
}

export interface ContentDraft {
  id: string;
  platform: ContentPlatform;
  format: ContentFormat;
  title: string;
  body: string[];
  source: ContentSource;
  safetyNotes: ContentSafetyNote[];
}

export interface AuditFindingContent {
  title: string;
  severity: string;
  category: string;
  description: string;
  recommendation: string;
}

export interface AuditContentSource {
  auditPath: string;
  sourceLabel: string;
  findings: AuditFindingContent[];
}
