# Workflow Audit

Generated: 2026-06-12T15:48:17.132Z

| Stage | Status | Evidence | Missing |
| --- | --- | --- | --- |
| Lead | implemented | src/leads/addLeadCli.ts<br>data/leads.json<br>npm run lead:add |  |
| Research | implemented | src/research/generateResearchPack.ts<br>output/research<br>npm run lead:research |  |
| Audit | implemented | src/auditPack/generateAuditPack.ts<br>src/audit/auditSite.ts<br>output/audit-packs<br>npm run audit:pack<br>npm run audit:site |  |
| Outreach | implemented | src/outreachPack/generateOutreachPack.ts<br>src/outreachExecution/generateOutreachExecutionPack.ts<br>output/outreach-execution/outreach-execution-pack.md<br>npm run outreach:pack<br>npm run outreach:execute-pack |  |
| Proposal | implemented | src/proposalCenter/generateProposalCenter.ts<br>src/sow/generateSow.ts<br>output/proposal-center/proposal-command-center.md<br>npm run proposal:center<br>npm run sow:generate |  |
| Discovery Call | implemented | src/firstAuditWorkflow/generateFirstAuditWorkflow.ts<br>output/first-audit-workflow/discovery-call-prep.md<br>npm run first-audit:workflow |  |
| Audit Sale | implemented | output/first-audit-workflow/audit-scope-confirmation.md<br>output/first-audit-workflow/audit-kickoff-plan.md<br>npm run first-audit:kickoff |  |
| Delivery | implemented | src/clientDelivery/generateClientDelivery.ts<br>output/client-delivery/demo-retainer-client/delivery-plan.md<br>npm run client:delivery |  |
| Retainer | implemented | src/clientReporting/generateDeliveryReport.ts<br>output/client-reporting/demo-retainer-client/monthly-report.md<br>npm run client:delivery-report |  |
| Renewal | implemented | src/renewals/generateRenewalTracker.ts<br>output/renewals/renewal-pipeline.md<br>npm run renewal:tracker |  |

## Lifecycle
Lead -> Research -> Audit -> Outreach -> Proposal -> Discovery Call -> Audit Sale -> Delivery -> Retainer -> Renewal
