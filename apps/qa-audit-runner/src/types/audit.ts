export interface AuditConfig {
  targetUrl: string;
  outputDir: string;
  screenshotPath: string;
}

export interface DetectedForm {
  name: string;
  method: string;
  action: string;
  inputCount: number;
  submitButtonCount: number;
}

export interface DetectedButton {
  text: string;
  type: string;
}

export interface DetectedNavigationLink {
  text: string;
  href: string;
  isInternal: boolean;
}

export interface InternalLinkStatus {
  url: string;
  status: number | null;
  ok: boolean;
  error?: string;
}

export interface AuditFinding {
  severity: 'info' | 'low' | 'medium' | 'high';
  title: string;
  details: string;
}

export interface AuditResult {
  targetUrl: string;
  finalUrl: string;
  pageTitle: string;
  timestamp: string;
  screenshot: string;
  visibleBodyContent: {
    hasVisibleBody: boolean;
    textSample: string;
    characterCount: number;
  };
  forms: DetectedForm[];
  buttons: DetectedButton[];
  navigationLinks: DetectedNavigationLink[];
  consoleErrors: string[];
  failedNetworkRequests: string[];
  metadata: {
    description: string;
    viewport: string;
    language: string;
  };
  internalLinkStatuses: InternalLinkStatus[];
  findings: AuditFinding[];
}
