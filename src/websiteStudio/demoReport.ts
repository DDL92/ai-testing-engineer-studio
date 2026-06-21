import type { LeadPack, NicheProfile, SiteAudit, VisualBrief } from './demoTypes';
import type { WebsiteLeadRecord } from './types';

export function renderCommercialComparison(
  record: WebsiteLeadRecord,
  pack: LeadPack,
  brief: VisualBrief,
  audit: SiteAudit,
): string {
  const confirmedFindings = Object.entries(audit.checks)
    .filter(([, check]) => check.status === 'PASS' || check.status === 'FAIL')
    .map(([name, check]) => `- ${name}: ${check.status} — ${check.detail}`);

  return `# Commercial Comparison: ${record.lead.companyName}

## Business summary

- Category: ${record.lead.industry}
- Location: ${record.location ?? 'Requires confirmation'}
- Qualification: ${record.analysis.decision} (${record.analysis.score}/100)
- Current recorded presence: ${record.analysis.presence}

## Existing evidence

${bullets(pack.verifiedOpportunitySignals, 'No additional verified opportunity signals were recorded.')}

## Confirmed current-site findings

${confirmedFindings.length > 0 ? confirmedFindings.join('\n') : '- A current website audit was not applicable or was skipped; findings were not verifiable.'}

## Unknowns and limitations

${bullets([...record.analysis.evidenceGaps, ...audit.evidenceLimitations])}

## Proposed homepage direction

The demo proposes a ${brief.visualMood} direction with ${brief.typographyDirection}. It uses original CSS-generated visual treatment and clearly labeled editable placeholders.

## Major demo improvements

- A focused responsive homepage may improve clarity compared with a social-only or unverified web presence.
- Semantic navigation, one clear H1, visible focus states, and reduced-motion support are included.
- A primary contact path is prominent, but the final destination requires confirmation.
- No reviews, prices, facilities, schedules, certifications, or performance results were invented.

## Conversion opportunity

The demo proposes a direct path from category and location context to a verified contact action. Any conversion benefit requires confirmation through real content and measurement.

## Recommended offer

- Primary offer: ${pack.recommendedPrimaryOffer}
- Existing price range: ${pack.priceRange}
- Recurring maintenance angle: ${pack.recurringMaintenanceAngle}

## Screenshots

- Desktop: screenshots/desktop.png
- Mobile: screenshots/mobile.png

## Manual verification checklist

${bullets([
  ...pack.manualVerificationChecklist,
  'Confirm every placeholder and conceptual visual before presenting the demo.',
  'Replace the non-deliverable contact target with a verified client-approved destination.',
  'Confirm that any future imagery accurately represents the real business or is clearly conceptual.',
])}

## Recommended next action

Request verified business facts and authorized brand assets, then manually review the conceptual demo before deciding whether to present it or schedule discovery.

> Manual review required. No outreach was generated or sent, and no client website was modified.
`;
}

export function renderAssetPrompts(record: WebsiteLeadRecord, profile: NicheProfile): string {
  const category = record.lead.industry.replace(/_/g, ' ');
  const location = record.location ?? '[LOCATION — confirm before use]';
  const shared = `- subject: A conceptual ${category} moment without identifiable people or unverified facilities
- environment: ${location}, represented generically until the real setting is confirmed
- composition: Generous negative space for accessible website copy and CTA placement
- camera: Natural documentary perspective, realistic proportions, no dramatic distortion
- lighting: Warm natural light with controlled contrast
- brand mood: ${profile.visualMood}
- realism/style: Photorealistic editorial image, clearly conceptual until verified
- website placement:`;
  const exclusions = `- exclusions: Logos, trademarks, named people, celebrity likenesses, invented facilities, unsupported services, text, watermarks, copyrighted characters`;

  return `# Editable Asset Prompts

Use only after confirming that the generated visual accurately represents the client’s real business or is clearly presented as conceptual imagery.

## 1. Hero image prompt

${shared} Full-width homepage hero with subject weighted away from the text area
${exclusions}

## 2. Optional hero video prompt

${shared} Muted looping hero background; 6–8 seconds of gentle environmental movement with a stable opening frame for a poster fallback
${exclusions}, rapid cuts, flashing light, audio-dependent storytelling

## 3. Supporting image prompt — experience

${shared} Services or experiences section, horizontal crop with a clear focal point
${exclusions}

## 4. Supporting image prompt — place

${shared} Visual showcase, wide environmental crop that does not imply specific facilities
${exclusions}

These prompts are not executed automatically. Any generated or licensed asset requires manual review and authorization.
`;
}

function bullets(values: string[], fallback = 'None recorded.'): string {
  return values.length > 0 ? values.map((value) => `- ${value}`).join('\n') : `- ${fallback}`;
}
