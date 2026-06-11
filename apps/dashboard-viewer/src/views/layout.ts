import { escapeHtml } from '../rendering/markdown';

export interface NavItem {
  href: string;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Command Center' },
  { href: '/actions', label: 'Action Cockpit' },
  { href: '/message-optimizer', label: 'Message Optimizer' },
  { href: '/message-queue', label: 'Message Queue' },
  { href: '/sources', label: 'Source Quality' },
  { href: '/revenue', label: 'Revenue' },
  { href: '/pipeline', label: 'Pipeline' },
  { href: '/approval-queue', label: 'Approval Queue' },
  { href: '/lead-reviews', label: 'Lead Reviews' },
  { href: '/weekly', label: 'Weekly' },
  { href: '/reports', label: 'Reports' },
];

export function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} - AI Testing Engineer Studio</title>
  <style>
    :root { color-scheme: light; --text:#172033; --muted:#64748b; --line:#d8dee9; --bg:#f7f8fb; --panel:#ffffff; --accent:#14532d; --accent2:#0f766e; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:var(--bg); color:var(--text); line-height:1.5; }
    header { background:#ffffff; border-bottom:1px solid var(--line); padding:18px 24px 0; position:sticky; top:0; z-index:10; }
    header h1 { margin:0 0 14px; font-size:20px; letter-spacing:0; }
    nav { display:flex; gap:4px; overflow-x:auto; padding-bottom:0; }
    nav a { color:var(--muted); text-decoration:none; padding:10px 12px; border:1px solid transparent; border-bottom:0; border-radius:6px 6px 0 0; white-space:nowrap; font-size:14px; }
    nav a:hover { color:var(--text); background:#f1f5f9; }
    main { max-width:1280px; margin:0 auto; padding:24px; }
    h2 { margin:26px 0 10px; font-size:22px; }
    h3 { margin:22px 0 8px; font-size:17px; }
    p, li { font-size:14px; }
    a { color:#0f766e; }
    .grid { display:grid; gap:14px; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); }
    .card { background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:16px; min-width:0; }
    .card h2, .card h3 { margin-top:0; }
    .metric { font-size:26px; font-weight:700; margin:4px 0; }
    .muted { color:var(--muted); }
    .file-list { display:grid; gap:10px; }
    .file-row { background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:14px; }
    .file-row h3 { margin:0 0 6px; font-size:15px; overflow-wrap:anywhere; }
    .preview { color:var(--muted); margin:6px 0 10px; }
    .toolbar { display:flex; gap:8px; flex-wrap:wrap; margin:12px 0; }
    .button { display:inline-flex; align-items:center; justify-content:center; border:1px solid var(--line); background:#fff; color:var(--text); text-decoration:none; border-radius:6px; padding:7px 10px; font-size:13px; }
    .button:hover { border-color:#94a3b8; }
    pre { background:#111827; color:#f9fafb; padding:12px; border-radius:8px; overflow:auto; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size:13px; }
    table { width:100%; border-collapse:collapse; background:#fff; border:1px solid var(--line); }
    td, th { border:1px solid var(--line); padding:8px; vertical-align:top; font-size:13px; }
    .markdown { background:#fff; border:1px solid var(--line); border-radius:8px; padding:20px; }
    .markdown h1:first-child, .markdown h2:first-child { margin-top:0; }
    .commands code { display:block; margin:6px 0; padding:8px; background:#eef2f7; border-radius:6px; overflow:auto; color:#0f172a; }
  </style>
</head>
<body>
  <header>
    <h1>AI Testing Engineer Studio Dashboard</h1>
    <nav>${navItems.map((item) => `<a href="${item.href}">${item.label}</a>`).join('')}</nav>
  </header>
  <main>${body}</main>
</body>
</html>`;
}

export function emptyState(message: string): string {
  return `<div class="card"><p class="muted">${escapeHtml(message)}</p></div>`;
}

export function commandsBlock(commands: string[]): string {
  return `<div class="card commands"><h2>Command Snippets</h2>${commands.map((command) => `<code>${escapeHtml(command)}</code>`).join('')}</div>`;
}
