import childProcess = require('child_process');
import fs = require('fs');
import path = require('path');
import { ProposalPackage } from './types';

export function generateProposalPdf(proposal: ProposalPackage, outputPath: string): void {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const tmpDir = path.join(process.cwd(), 'tmp', 'pdfs');
  fs.mkdirSync(tmpDir, { recursive: true });
  const payloadPath = path.join(tmpDir, `${proposal.companyId}-proposal.json`);

  fs.writeFileSync(payloadPath, JSON.stringify(toPdfPayload(proposal), null, 2), 'utf8');

  const result = childProcess.spawnSync('python3', ['-c', pythonScript, payloadPath, outputPath], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10,
  });

  fs.rmSync(payloadPath, { force: true });

  if (result.status !== 0) {
    throw new Error(`Proposal PDF generation failed: ${result.stderr || result.stdout}`);
  }
}

function toPdfPayload(proposal: ProposalPackage): Record<string, unknown> {
  return {
    companyName: proposal.companyName,
    generatedDate: new Date(proposal.generatedAt).toISOString().slice(0, 10),
    preparedBy: proposal.preparedBy,
    preparedFor: proposal.preparedFor,
    summary: [
      ['Company', proposal.companyName],
      ['Opportunity Score', `${proposal.opportunityScore}/100`],
      ['Evidence Readiness', `${proposal.evidenceReadiness}/100`],
      ['Recommended Engagement', proposal.recommendedEngagement],
      ['Recommended Next Action', proposal.recommendedNextAction],
    ],
    businessContext: [
      ['Industry', proposal.businessContext.industry],
      ['Product Type', proposal.businessContext.productType],
      ['Observed Opportunity Areas', proposal.businessContext.observedOpportunityAreas.join(', ')],
      ['Potential Risk Areas', proposal.businessContext.potentialRiskAreas.join(', ')],
    ],
    scope: proposal.scopeOfWork,
    engagementOptions: proposal.engagementOptions,
    retainerPath: proposal.retainerPath,
    clientSuccessCriteria: proposal.clientSuccessCriteria,
    approvalChecklist: proposal.approvalChecklist,
    disclaimer: proposal.disclaimer,
  };
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
    name="ProposalCoverTitle",
    parent=styles["Title"],
    fontName="Helvetica-Bold",
    fontSize=27,
    leading=31,
    alignment=TA_CENTER,
    textColor=colors.HexColor("#1b2430"),
    spaceAfter=12,
))
styles.add(ParagraphStyle(
    name="ProposalCoverSubtitle",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=16,
    leading=20,
    alignment=TA_CENTER,
    textColor=colors.HexColor("#586174"),
    spaceAfter=18,
))
styles.add(ParagraphStyle(
    name="ProposalSection",
    parent=styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=14,
    leading=18,
    textColor=colors.HexColor("#1769aa"),
    spaceBefore=10,
    spaceAfter=7,
))
styles.add(ParagraphStyle(
    name="ProposalBody",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=9,
    leading=12,
    textColor=colors.HexColor("#1b2430"),
))
styles.add(ParagraphStyle(
    name="ProposalSmall",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=8,
    leading=10,
    textColor=colors.HexColor("#586174"),
))
styles.add(ParagraphStyle(
    name="ProposalBullet",
    parent=styles["ProposalBody"],
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

def p(text, style="ProposalBody"):
    return Paragraph(escape(str(text)), styles[style])

def bullet(text):
    return Paragraph("- " + escape(str(text)), styles["ProposalBullet"])

def section(title):
    return [Spacer(1, 6), p(title, "ProposalSection")]

def kv_table(rows):
    table_rows = [[p(label), p(value)] for label, value in rows]
    table = Table(table_rows, colWidths=[1.95 * inch, 5.0 * inch], hAlign="LEFT")
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
story.append(Spacer(1, 1.35 * inch))
story.append(p(data["companyName"], "ProposalCoverTitle"))
story.append(p("QA Automation Proposal", "ProposalCoverSubtitle"))
story.append(Spacer(1, 0.25 * inch))
story.append(kv_table([
    ["Prepared By", data["preparedBy"]],
    ["Prepared For", data["preparedFor"]],
    ["Date", data["generatedDate"]],
    ["Review Status", "Manual review required"],
]))
story.append(Spacer(1, 0.45 * inch))
story.append(p("This proposal package is generated from local evidence and must be reviewed before any external use.", "ProposalSmall"))
story.append(PageBreak())

story.extend(section("Executive Summary"))
story.append(kv_table(data["summary"]))

story.extend(section("Business Context"))
story.append(kv_table(data["businessContext"]))

story.extend(section("Scope of Work"))
story.append(p("Objectives"))
story.extend(list_items(data["scope"]["objectives"]))
story.append(p("In Scope"))
story.extend(list_items(data["scope"]["inScope"]))
story.append(p("Out of Scope"))
story.extend(list_items(data["scope"]["outOfScope"]))
story.append(p("Deliverables"))
story.extend(list_items(data["scope"]["deliverables"]))

story.extend(section("Engagement Options"))
for option in data["engagementOptions"]:
    block = [
        p(option["label"] + ": " + option["name"]),
        p("Best for: " + option["bestFor"]),
        p("Recommended: " + ("Yes" if option["recommended"] else "No"), "ProposalSmall"),
    ] + list_items(option["deliverables"]) + [Spacer(1, 7)]
    story.append(KeepTogether(block))

story.extend(section("Retainer Path"))
story.extend(list_items(data["retainerPath"]))

story.extend(section("Client Success Criteria"))
story.extend(list_items(data["clientSuccessCriteria"]))

story.extend(section("Approval Checklist"))
story.extend(list_items(data["approvalChecklist"]))

story.extend(section("Disclaimer"))
story.extend(list_items(data["disclaimer"]))

def footer(canvas, document):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#586174"))
    canvas.drawString(document.leftMargin, 0.32 * inch, "AI Testing Engineer Studio - QA Automation Proposal")
    canvas.drawRightString(letter[0] - document.rightMargin, 0.32 * inch, f"Page {document.page}")
    canvas.restoreState()

doc.build(story, onFirstPage=footer, onLaterPages=footer)
`;
