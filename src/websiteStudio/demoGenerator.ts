import type { ContentPlaceholder, NicheProfile, VisualBrief } from './demoTypes';
import type { WebsiteLeadRecord } from './types';

export function buildVisualBrief(record: WebsiteLeadRecord, profile: NicheProfile): VisualBrief {
  const location = record.location;
  const placeholders: ContentPlaceholder[] = [
    {
      key: 'heroSupportingCopy',
      value: `A considered ${label(record.lead.industry)} experience${location ? ` in ${location}` : ' in [LOCATION]'}.`,
      reason: 'Exact services, facilities, schedules, and availability require confirmation.',
    },
    {
      key: 'services',
      value: 'Explore our services',
      reason: 'No verified service list was supplied.',
    },
    {
      key: 'contact',
      value: 'Contact the team',
      reason: 'No verified direct contact method was supplied for publication.',
    },
    {
      key: 'businessDetails',
      value: 'Business details require confirmation',
      reason: 'Operational details were not verified.',
    },
  ];
  if (!location) {
    placeholders.push({
      key: 'location',
      value: 'Premium experience in [LOCATION]',
      reason: 'A location was not supplied.',
    });
  }

  return {
    leadId: record.lead.id,
    businessName: record.lead.companyName,
    category: record.lead.industry,
    location,
    currentWebsiteUrl: record.lead.website,
    designProfile: profile.category,
    visualMood: profile.visualMood,
    typographyDirection: profile.typographyDirection,
    spacingDirection: profile.spacingDirection,
    sectionPlan: profile.sectionOrder,
    primaryCTA: 'Contact the team',
    secondaryCTA: 'Explore the concept',
    heroType: profile.heroType,
    realAssetsAvailable: false,
    contentPlaceholders: placeholders,
    evidenceUsed: [
      `Lead store category: ${record.lead.industry}.`,
      `Lead store location: ${location ?? 'not supplied'}.`,
      ...record.analysis.opportunitySignals.map((signal) => `Existing analysis signal: ${signal}.`),
    ],
    verifiedFacts: [
      `Lead ID: ${record.lead.id}.`,
      `Qualification decision: ${record.analysis.decision}.`,
      `Current recorded website presence: ${record.analysis.presence}.`,
    ],
    suppliedInformation: [
      `Business name: ${record.lead.companyName}.`,
      `Category: ${record.lead.industry}.`,
      `Location: ${location ?? 'not supplied'}.`,
      `Source: ${record.lead.source}.`,
    ],
    assumptions: [
      'The homepage is a conceptual direction, not a representation of confirmed facilities or services.',
      'CSS-generated visual fields stand in for authorized client-owned or licensed imagery.',
      'All conversion copy and business details require client confirmation before presentation or publication.',
    ],
    manualReviewRequired: true,
  };
}

export function generateDemoHtml(brief: VisualBrief, profile: NicheProfile): string {
  const business = escapeHtml(brief.businessName);
  const location = escapeHtml(brief.location ?? '[LOCATION]');
  const category = titleCase(brief.category);
  const colors = profile.colorRoles;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Conceptual homepage demo for ${business}. Business details require confirmation.">
  <title>${business} — Conceptual Homepage</title>
  <style>
    :root{--canvas:${colors.canvas};--surface:${colors.surface};--ink:${colors.ink};--muted:${colors.muted};--primary:${colors.primary};--accent:${colors.accent};--radius:24px;--shadow:0 24px 70px rgba(23,51,58,.13)}
    *{box-sizing:border-box}html{scroll-behavior:smooth;overflow-x:hidden}body{margin:0;background:var(--canvas);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.6;overflow-x:hidden}a{color:inherit}a:focus-visible,button:focus-visible{outline:3px solid var(--accent);outline-offset:4px}.shell{width:min(1180px,calc(100% - 32px));margin-inline:auto}.nav{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:22px 0}.brand{font-weight:850;letter-spacing:-.03em;text-decoration:none}.nav-links{display:flex;align-items:center;gap:24px}.nav-links a{text-decoration:none;font-weight:700;font-size:.92rem}.button{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;border-radius:999px;background:var(--primary);color:#fff;text-decoration:none;font-weight:800;border:2px solid var(--primary);transition:transform .2s ease,box-shadow .2s ease}.button:hover{transform:translateY(-2px);box-shadow:0 12px 25px rgba(12,107,104,.24)}.button.secondary{background:transparent;color:var(--ink);border-color:rgba(23,51,58,.22)}.hero{display:grid;gap:36px;padding:52px 0 76px;align-items:center}.eyebrow{display:inline-flex;align-items:center;gap:8px;text-transform:uppercase;letter-spacing:.16em;font-size:.72rem;font-weight:900;color:var(--primary)}.eyebrow:before{content:"";width:30px;height:2px;background:var(--accent)}h1,h2,h3{font-family:Georgia,"Times New Roman",serif;line-height:1.04;letter-spacing:-.045em;margin:0}h1{font-size:clamp(3.1rem,13vw,6.8rem);max-width:10ch}h2{font-size:clamp(2.25rem,8vw,4.3rem);max-width:13ch}h3{font-size:1.55rem}.lede{font-size:clamp(1.05rem,2.5vw,1.3rem);max-width:58ch;color:var(--muted)}.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}.hero-art{position:relative;min-height:430px;border-radius:var(--radius);background:linear-gradient(145deg,var(--primary),#0b414b 56%,var(--accent));overflow:hidden;box-shadow:var(--shadow);isolation:isolate}.sun{position:absolute;width:210px;height:210px;border-radius:50%;background:#ffd9a1;right:-24px;top:-24px;opacity:.92}.wave{position:absolute;border:2px solid rgba(255,255,255,.55);border-radius:50%;width:520px;height:230px;left:-110px;bottom:-70px;transform:rotate(-9deg)}.wave.two{width:580px;height:270px;left:-60px;bottom:-120px;opacity:.5}.board{position:absolute;width:72px;height:310px;border-radius:48%;background:#f9ead0;right:23%;top:22%;transform:rotate(18deg);box-shadow:inset -12px 0 rgba(239,142,75,.2)}.art-label{position:absolute;left:24px;bottom:22px;max-width:240px;color:#fff;font-size:.85rem;background:rgba(10,41,48,.62);padding:12px 14px;border-radius:14px;backdrop-filter:blur(8px)}section{padding:80px 0}.intro{display:grid;gap:28px;align-items:end}.intro p{max-width:55ch;color:var(--muted);font-size:1.1rem}.cards{display:grid;gap:16px;margin-top:36px}.card{background:var(--surface);padding:26px;border-radius:var(--radius);border:1px solid rgba(23,51,58,.1);box-shadow:0 12px 35px rgba(23,51,58,.05)}.card-number{color:var(--accent);font-weight:900;font-size:.8rem;letter-spacing:.12em}.card p{color:var(--muted)}.showcase{display:grid;grid-template-columns:1.2fr .8fr;grid-template-rows:220px 220px;gap:16px;margin-top:38px}.visual{position:relative;overflow:hidden;border-radius:var(--radius);background:linear-gradient(135deg,var(--primary),var(--accent));min-width:0}.visual:first-child{grid-row:span 2}.visual:nth-child(2){background:linear-gradient(135deg,#edc898,#1d7b77)}.visual:nth-child(3){background:linear-gradient(135deg,#17333a,#87b9af)}.visual:before,.visual:after{content:"";position:absolute;border-radius:50%;border:1px solid rgba(255,255,255,.65)}.visual:before{width:260px;height:260px;right:-90px;top:-80px}.visual:after{width:180px;height:180px;left:-50px;bottom:-80px}.visual span{position:absolute;left:18px;bottom:16px;color:#fff;background:rgba(0,0,0,.38);padding:8px 11px;border-radius:10px;font-size:.8rem}.difference{display:grid;gap:18px}.difference-item{display:grid;grid-template-columns:48px 1fr;gap:14px;padding:20px 0;border-bottom:1px solid rgba(23,51,58,.14)}.marker{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:var(--accent);font-weight:900}.conversion{background:var(--ink);color:var(--canvas);border-radius:var(--radius);padding:clamp(30px,7vw,72px);display:grid;gap:28px;align-items:center}.conversion p{color:#cbd7d8;max-width:55ch}.notice{font-size:.78rem;color:var(--muted);margin-top:16px}footer{padding:36px 0 54px}.footer-row{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;border-top:1px solid rgba(23,51,58,.15);padding-top:28px}.footer-row p{margin:0;color:var(--muted);max-width:52ch}
    @media(min-width:760px){.hero{grid-template-columns:1.08fr .92fr}.intro{grid-template-columns:1fr 1fr}.cards{grid-template-columns:repeat(3,1fr)}.difference{grid-template-columns:1fr 1fr}.conversion{grid-template-columns:1.15fr .85fr}.conversion .actions{justify-content:flex-end}.hero-art{min-height:600px}}
    @media(max-width:680px){.nav-links a:not(.button){display:none}.showcase{grid-template-columns:1fr;grid-template-rows:320px 180px 180px}.visual:first-child{grid-row:auto}.footer-row{flex-direction:column}.hero{padding-top:28px}section{padding:58px 0}}
    @media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
  </style>
</head>
<body>
  <header class="shell">
    <nav class="nav" aria-label="Primary navigation">
      <a class="brand" href="#top">${business}</a>
      <div class="nav-links"><a href="#experience">Experience</a><a href="#approach">Approach</a><a class="button" data-primary-cta href="#contact">Contact the team</a></div>
    </nav>
  </header>
  <main id="top">
    <section class="hero shell" aria-labelledby="hero-title">
      <div>
        <span class="eyebrow">${escapeHtml(category)} · ${location}</span>
        <h1 id="hero-title">Find your rhythm by the coast.</h1>
        <p class="lede">A considered ${escapeHtml(label(brief.category))} experience in ${location}. Exact services, facilities, schedules, and availability require confirmation.</p>
        <div class="actions"><a class="button" data-primary-cta href="#contact">Contact the team</a><a class="button secondary" href="#experience">Explore the concept</a></div>
        <p class="notice">Conceptual demo copy — business details require confirmation.</p>
      </div>
      <div class="hero-art" role="img" aria-label="Conceptual coastal visual placeholder; replace only with an authorized accurate image">
        <div class="sun"></div><div class="wave"></div><div class="wave two"></div><div class="board"></div>
        <span class="art-label">Conceptual visual placeholder · no external image used</span>
      </div>
    </section>
    <section id="experience" class="shell">
      <div class="intro"><div><span class="eyebrow">The proposed experience</span><h2>A clear path from curiosity to contact.</h2></div><p>The demo proposes an original, focused homepage that introduces the business, frames the visitor journey, and makes the next action visible without inventing business claims.</p></div>
      <div class="cards">
        <article class="card"><span class="card-number">01 · ORIENTATION</span><h3>Arrive with clarity</h3><p>Location and category establish context while operational details remain clearly marked for confirmation.</p></article>
        <article class="card"><span class="card-number">02 · DISCOVERY</span><h3>Explore our services</h3><p>Replace this editable placeholder with a verified service or experience list supplied by the business.</p></article>
        <article class="card"><span class="card-number">03 · CONNECTION</span><h3>Contact the team</h3><p>A direct primary action is ready for a verified contact destination before any public use.</p></article>
      </div>
    </section>
    <section class="shell">
      <span class="eyebrow">Visual direction</span><h2>Coastal energy, shaped with restraint.</h2>
      <div class="showcase">
        <div class="visual"><span>Authorized hero imagery placeholder</span></div>
        <div class="visual"><span>Experience imagery placeholder</span></div>
        <div class="visual"><span>Location imagery placeholder</span></div>
      </div>
    </section>
    <section id="approach" class="shell">
      <div class="intro"><div><span class="eyebrow">Why this direction</span><h2>Designed around trust, pace, and a useful next step.</h2></div><p>The current concept uses only supplied category and location context. It avoids unverified claims and creates clear places for real business facts and authorized assets.</p></div>
      <div class="difference">
        <div class="difference-item"><span class="marker">1</span><div><h3>Immediate context</h3><p>Visitors can understand the category and general location without searching across multiple channels.</p></div></div>
        <div class="difference-item"><span class="marker">2</span><div><h3>Original visual system</h3><p>System fonts, CSS shapes, and a niche profile create a distinct direction without copying another brand.</p></div></div>
        <div class="difference-item"><span class="marker">3</span><div><h3>Editable evidence boundaries</h3><p>Unknown services and operating details remain visible placeholders until confirmed.</p></div></div>
        <div class="difference-item"><span class="marker">4</span><div><h3>Responsive conversion path</h3><p>The primary contact action remains accessible across desktop and mobile layouts.</p></div></div>
      </div>
    </section>
    <section id="contact" class="shell">
      <div class="conversion"><div><span class="eyebrow">Next step</span><h2>Bring the real story into focus.</h2><p>Confirm the business details, provide authorized brand assets, and connect this concept to a verified contact route before presentation or publication.</p></div><div class="actions"><a class="button" data-primary-cta href="mailto:confirm-contact@example.invalid">Contact the team</a></div></div>
      <p class="notice">The email target is intentionally non-deliverable and must be replaced only after verification.</p>
    </section>
  </main>
  <footer class="shell"><div class="footer-row"><strong>${business}</strong><p>${location} · Conceptual ${escapeHtml(label(brief.category))} homepage. Business details require confirmation. Manual review required.</p></div></footer>
  <script>document.documentElement.dataset.demoReady="true";</script>
</body>
</html>
`;
}

export function applyDeterministicCorrection(html: string, failures: string[]): string {
  let corrected = html;
  if (failures.includes('navigation') && !/<nav[\s>]/i.test(corrected)) {
    corrected = corrected.replace('<body>', '<body><nav aria-label="Primary navigation"><a href="#contact">Contact</a></nav>');
  }
  if (failures.includes('footer') && !/<footer[\s>]/i.test(corrected)) {
    corrected = corrected.replace('</body>', '<footer>Manual review required.</footer></body>');
  }
  if (failures.includes('oneH1') && !/<h1[\s>]/i.test(corrected)) {
    corrected = corrected.replace('<main', '<h1>Conceptual homepage</h1><main');
  }
  if (failures.some((failure) => failure.includes('HorizontalOverflow'))) {
    corrected = corrected.replace('</style>', 'html,body{max-width:100%;overflow-x:hidden}img,svg,video{max-width:100%}</style>');
  }
  return corrected;
}

function label(value: string): string {
  return value.replace(/_/g, ' ');
}

function titleCase(value: string): string {
  return label(value).replace(/\b\w/g, (character) => character.toUpperCase());
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character] ?? character);
}
