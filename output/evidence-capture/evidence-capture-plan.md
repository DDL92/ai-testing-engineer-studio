# Evidence Capture Plan

## Current State

- Existing Studio intelligence is local-first and Markdown/JSON-based.
- Evidence Collection Engine organizes existing contact, channel, pain, site, opportunity, and audit-pack outputs.
- No live evidence capture is implemented yet.
- Future evidence slots exist, but they are explicitly marked as not implemented.

## Future State

- Future evidence collectors write standardized evidence records.
- Supporting files are referenced from approved local storage paths.
- Audit, proposal, and retainer workflows can consume the same evidence format.
- Human approval gates remain required before client-facing use.

## Missing Components

- Controlled Playwright evidence runner.
- Screenshot metadata approval workflow.
- Lighthouse snapshot adapter.
- Accessibility evidence adapter.
- Performance evidence adapter.
- Manual QA observation entry workflow.
- Evidence file retention and review checklist.

## Recommended Next Sprint

- Sprint 60: Playwright Evidence Runner v1

## Readiness Summary

| Area | Readiness |
| --- | --- |
| Collection Readiness | Not Yet Implemented |
| Storage Readiness | Not Yet Implemented |
| Audit Readiness | Not Yet Implemented |
| Proposal Readiness | Not Yet Implemented |
| Retainer Readiness | Not Yet Implemented |

## Evidence Standard

| Field | Required | Notes |
| --- | --- | --- |
| Evidence Type | Yes | Must be one of the approved future evidence types. |
| Source | Yes | Must name the future collector or manual source. |
| Company | Yes | Must match a local company record. |
| URL | Yes | Must be recorded only when public or client-approved. |
| Timestamp | Yes | Must record when evidence was collected or reviewed. |
| Confidence | Yes | Must be Low, Medium, High, or Not Yet Implemented until real collection exists. |
| Description | Yes | Must describe reviewed evidence without inventing findings. |
| Supporting Files | Yes | Must reference local approved files only. |
| Approval Status | Yes | Must preserve Daniel approval before external use. |

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
