# Evidence Storage Architecture

Future storage folders are documented only. This command does not generate evidence files inside these folders.

| Path | Purpose |
| --- | --- |
| data/evidence/playwright/ | Future reviewed Playwright evidence records. |
| data/evidence/lighthouse/ | Future reviewed Lighthouse evidence records. |
| data/evidence/screenshots/ | Future manually approved screenshot metadata. |
| data/evidence/accessibility/ | Future reviewed accessibility evidence records. |
| data/evidence/performance/ | Future reviewed performance evidence records. |
| data/evidence/manual/ | Future Daniel-approved manual QA observations. |

## Standard Evidence Record

- Evidence Type: Must be one of the approved future evidence types.
- Source: Must name the future collector or manual source.
- Company: Must match a local company record.
- URL: Must be recorded only when public or client-approved.
- Timestamp: Must record when evidence was collected or reviewed.
- Confidence: Must be Low, Medium, High, or Not Yet Implemented until real collection exists.
- Description: Must describe reviewed evidence without inventing findings.
- Supporting Files: Must reference local approved files only.
- Approval Status: Must preserve Daniel approval before external use.

## Safety Notes

- Do not run Playwright.
- Do not run Lighthouse.
- Do not capture screenshots.
- Do not perform accessibility scans.
- Do not perform performance scans.
- Do not use browser automation.
- Do not use APIs.
- Do not use credentials.
- Do not use external databases.
- Do not invent evidence, screenshots, metrics, results, findings, bugs, vulnerabilities, or incidents.
