import fs = require('fs');
import path = require('path');
import { WebsiteLeadRecord } from './types';

export function writeWebsiteLeadPack(record: WebsiteLeadRecord): { jsonPath: string; markdownPath: string } {
  const outputDir = path.join(process.cwd(), 'output', 'website-studio', 'leads', record.lead.id);
  const jsonPath = path.join(outputDir, 'lead-pack.json');
  const markdownPath = path.join(outputDir, 'lead-pack.md');
  const pack = buildPack(record);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify(pack, null, 2)}\n`, 'utf8');
  fs.writeFileSync(markdownPath, renderPack(pack), 'utf8');
  return { jsonPath, markdownPath };
}

function buildPack(record: WebsiteLeadRecord) {
  return {
    generatedAt: new Date().toISOString(),
    leadId: record.lead.id,
    businessSummary: {
      businessName: record.lead.companyName,
      category: record.lead.industry,
      location: record.location,
      source: record.lead.source,
      notes: record.lead.fitNotes || null,
    },
    publicContactInformation: record.publicContact,
    websiteInspectionEvidence: record.inspection,
    canonicalWebsiteUrl: record.canonicalWebsiteUrl ?? record.lead.website,
    legacyWebsiteUrl: record.legacyWebsiteUrl ?? null,
    migrationDetected: record.migrationDetected ?? false,
    migrationEvidence: record.migrationEvidence ?? [],
    verifiedOpportunitySignals: record.analysis.opportunitySignals,
    score: record.analysis.score,
    scoreBreakdown: record.analysis.scoreBreakdown,
    decision: record.analysis.decision,
    recommendedPrimaryOffer: record.analysis.primaryOffer.name,
    priceRange: record.analysis.primaryOffer.priceRange,
    recurringMaintenanceAngle: record.analysis.recurringFollowUp,
    strongestPersonalizedSalesAngle: record.analysis.personalizedSalesAngle,
    evidenceGaps: record.analysis.evidenceGaps,
    manualVerificationChecklist: [
      'Confirm whether the business has a current official website.',
      'Verify supplied public contact details before any use.',
      'Inspect the current website manually when one is available.',
      'Confirm the strongest opportunity signal before preparing sales material.',
      'Do not contact the business without human approval.',
    ],
    exactNextAction: record.analysis.nextAction,
    manualReviewRequired: true,
  };
}

function renderPack(pack: ReturnType<typeof buildPack>): string {
  return `# Website Lead Pack: ${pack.businessSummary.businessName}

## Business Summary

- Lead ID: ${pack.leadId}
- Category: ${pack.businessSummary.category}
- Location: ${pack.businessSummary.location ?? 'Unknown'}
- Source: ${pack.businessSummary.source}
- Notes: ${pack.businessSummary.notes ?? 'Unknown'}

## Public Contact Information

- Email: ${pack.publicContactInformation.email ?? 'Unknown'}
- Phone: ${pack.publicContactInformation.phone ?? 'Unknown'}
- Instagram: ${pack.publicContactInformation.instagramUrl ?? 'Unknown'}
- Facebook: ${pack.publicContactInformation.facebookUrl ?? 'Unknown'}

## Website Inspection Evidence

- Legacy URL: ${pack.legacyWebsiteUrl ?? 'Not applicable'}
- Canonical URL: ${pack.canonicalWebsiteUrl ?? 'Unknown'}
- Migration detected: ${pack.migrationDetected ? 'true' : 'false'}
- Migration evidence: ${pack.migrationEvidence.join('; ') || 'None'}

\`\`\`json
${JSON.stringify(pack.websiteInspectionEvidence, null, 2)}
\`\`\`

## Verified Opportunity Signals

${bullets(pack.verifiedOpportunitySignals, 'No confirmed opportunity signal; manual review required.')}

## Qualification

- Score: ${pack.score}/100
- Decision: ${pack.decision}
- Primary offer: ${pack.recommendedPrimaryOffer}
- Price range: ${pack.priceRange}
- Possible recurring follow-up: ${pack.recurringMaintenanceAngle}

## Strongest Personalized Sales Angle

${pack.strongestPersonalizedSalesAngle}

## Evidence Gaps

${bullets(pack.evidenceGaps)}

## Manual Verification Checklist

${bullets(pack.manualVerificationChecklist)}

## Exact Next Action

${pack.exactNextAction}

Manual review required: **yes**. No outreach was generated or sent.
`;
}

function bullets(values: string[], fallback = 'None recorded.'): string {
  return values.length > 0 ? values.map((value) => `- ${value}`).join('\n') : `- ${fallback}`;
}
