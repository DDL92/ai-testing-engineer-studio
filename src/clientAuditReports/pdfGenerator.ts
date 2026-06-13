import childProcess = require('child_process');
import fs = require('fs');
import path = require('path');
import { ClientAuditReport } from './types';

export function generateClientAuditPdf(report: ClientAuditReport, outputPath: string): void {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const tmpDir = path.join(process.cwd(), 'tmp', 'pdfs');
  fs.mkdirSync(tmpDir, { recursive: true });
  const payloadPath = path.join(tmpDir, `${report.companyId}-qa-audit-report.json`);

  fs.writeFileSync(payloadPath, JSON.stringify(toPdfPayload(report), null, 2), 'utf8');

  const result = childProcess.spawnSync('python3', ['-c', pythonScript, payloadPath, outputPath], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10,
  });

  fs.rmSync(payloadPath, { force: true });

  if (result.status !== 0) {
    throw new Error(`PDF generation failed: ${result.stderr || result.stdout}`);
  }
}

function toPdfPayload(report: ClientAuditReport): Record<string, unknown> {
  return {
    companyName: report.companyName,
    generatedDate: new Date(report.generatedAt).toISOString().slice(0, 10),
    preparedBy: report.preparedBy,
    preparedFor: report.preparedFor,
    summary: [
      ['Company', report.companyName],
      ['Opportunity Score', `${report.opportunityScore}/100`],
      ['Evidence Readiness', `${report.evidenceReadiness}/100`],
      ['Recommended Service', report.recommendedService],
      ['Recommended Next Action', report.recommendedNextAction],
    ],
    lighthouse: [
      ['Performance', scoreLabel(report.lighthouseEvidence?.performance ?? null)],
      ['Accessibility', scoreLabel(report.lighthouseEvidence?.accessibility ?? null)],
      ['Best Practices', scoreLabel(report.lighthouseEvidence?.bestPractices ?? null)],
      ['SEO', scoreLabel(report.lighthouseEvidence?.seo ?? null)],
    ],
    playwright: [
      ['Pages Reviewed', String(report.playwrightEvidence?.pagesReviewed ?? 'Not Available')],
      ['Screenshots Captured', String(report.playwrightEvidence?.screenshotsCaptured ?? 'Not Available')],
      ['Console Observations', String(report.playwrightEvidence?.consoleObservations ?? 'Not Available')],
      ['Observed Public Flows', report.playwrightEvidence?.observedPublicFlows.join(', ') ?? 'Not Available'],
    ],
    opportunities: report.potentialOpportunities,
    coverage: {
      smoke: report.recommendedCoverage.smokeSuite,
      regression: report.recommendedCoverage.regressionSuite,
      critical: report.recommendedCoverage.criticalPathCoverage,
    },
    recommendedService: report.recommendedService,
    upgradePath: report.upgradePath,
    discoveryQuestions: report.discoveryQuestions,
    disclaimer: report.disclaimer,
  };
}

function scoreLabel(score: number | null): string {
  if (score === null) return 'Not Available';
  return `${Math.round(score * 100)}/100`;
}

const pythonScript = String.raw`
import json
import sys
from html import escape
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

payload_path = sys.argv[1]
output_path = sys.argv[2]

with open(payload_path, "r", encoding="utf-8") as handle:
    data = json.load(handle)

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="CoverTitle",
    parent=styles["Title"],
    fontName="Helvetica-Bold",
    fontSize=28,
    leading=32,
    alignment=TA_CENTER,
    textColor=colors.HexColor("#1b2430"),
    spaceAfter=12,
))
styles.add(ParagraphStyle(
    name="CoverSubtitle",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=16,
    leading=20,
    alignment=TA_CENTER,
    textColor=colors.HexColor("#586174"),
    spaceAfter=18,
))
styles.add(ParagraphStyle(
    name="SectionTitle",
    parent=styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=14,
    leading=18,
    textColor=colors.HexColor("#1769aa"),
    spaceBefore=10,
    spaceAfter=7,
))
styles.add(ParagraphStyle(
    name="Small",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=8,
    leading=10,
    textColor=colors.HexColor("#586174"),
))
styles.add(ParagraphStyle(
    name="Body",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=9,
    leading=12,
    textColor=colors.HexColor("#1b2430"),
))
styles.add(ParagraphStyle(
    name="AuditBullet",
    parent=styles["Body"],
    leftIndent=12,
    firstLineIndent=-7,
))

doc = SimpleDocTemplate(
    output_path,
    pagesize=letter,
    rightMargin=0.62 * inch,
    leftMargin=0.62 * inch,
    topMargin=0.6 * inch,
    bottomMargin=0.55 * inch,
)

def p(text, style="Body"):
    return Paragraph(escape(str(text)), styles[style])

def bullet(text):
    return Paragraph("- " + escape(str(text)), styles["AuditBullet"])

def section(title):
    return [Spacer(1, 6), p(title, "SectionTitle")]

def kv_table(rows):
    table_rows = [[p(label, "Body"), p(value, "Body")] for label, value in rows]
    table = Table(table_rows, colWidths=[1.85 * inch, 5.1 * inch], hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#e9f2fb")),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#143d63")),
        ("BOX", (0, 0), (-1, -1), 0.45, colors.HexColor("#d8dee8")),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#d8dee8")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return table

def list_items(items):
    if not items:
        return [bullet("Not available.")]
    return [bullet(item) for item in items]

story = []
story.append(Spacer(1, 1.45 * inch))
story.append(p(data["companyName"], "CoverTitle"))
story.append(p("QA Audit Report", "CoverSubtitle"))
story.append(Spacer(1, 0.25 * inch))
story.append(kv_table([
    ["Generated Date", data["generatedDate"]],
    ["Prepared By", data["preparedBy"]],
    ["Prepared For", data["preparedFor"]],
    ["Report Type", "Public evidence review"],
]))
story.append(Spacer(1, 0.45 * inch))
story.append(p("This document is intended for manual review before any external use.", "Small"))
story.append(PageBreak())

story.extend(section("Executive Summary"))
story.append(kv_table(data["summary"]))

story.extend(section("Lighthouse Evidence"))
story.append(kv_table(data["lighthouse"]))

story.extend(section("Playwright Evidence"))
story.append(kv_table(data["playwright"]))

story.extend(section("Potential Opportunities"))
for item in data["opportunities"][:10]:
    block = [
        p(item["type"], "Body"),
        p(item["description"], "Body"),
        p("Evidence: " + item["evidence"], "Body"),
        p("Confidence: " + item["confidence"], "Small"),
    ]
    story.append(KeepTogether(block + [Spacer(1, 7)]))

story.extend(section("Recommended Coverage"))
story.append(p("Smoke Coverage", "Body"))
story.extend(list_items(data["coverage"]["smoke"]))
story.append(p("Regression Coverage", "Body"))
story.extend(list_items(data["coverage"]["regression"]))
story.append(p("Critical Path Coverage", "Body"))
story.extend(list_items(data["coverage"]["critical"]))

story.extend(section("Recommended Engagement"))
story.append(bullet(data["recommendedService"]))
story.append(p("Upgrade Path", "Body"))
story.extend(list_items(data["upgradePath"]))

story.extend(section("Discovery Call Questions"))
for index, question in enumerate(data["discoveryQuestions"], start=1):
    story.append(p(f"{index}. {question}", "Body"))

story.extend(section("Disclaimer"))
for item in data["disclaimer"]:
    story.append(bullet(item))

def footer(canvas, document):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#586174"))
    canvas.drawString(document.leftMargin, 0.32 * inch, "AI Testing Engineer Studio - QA Audit Report")
    canvas.drawRightString(letter[0] - document.rightMargin, 0.32 * inch, f"Page {document.page}")
    canvas.restoreState()

doc.build(story, onFirstPage=footer, onLaterPages=footer)
`;
