# All Commands

Generated: 2026-06-13T20:49:50.724Z

| Command | Module | Description | Expected Outputs | Script |
| --- | --- | --- | --- | --- |
| npm run actions:cockpit | General | Project command from package.json. | Varies | tsx apps/lead-operator/src/cli/index.ts actions:cockpit |
| npm run audit | General | Project command from package.json. | Varies | tsx apps/qa-audit-runner/src/cli/index.ts |
| npm run audit:generate | Audit Engine | Generate local report output. | Varies | node --import tsx src/auditPackEngine/generateAuditPack.ts |
| npm run audit:pack | Audit Engine | Project command from package.json. | Varies | tsx src/auditPack/generateAuditPack.ts |
| npm run audit:pdf | Audit Engine | Project command from package.json. | Varies | node --import tsx src/clientAuditReports/generateClientAuditReport.ts |
| npm run audit:pdf-portfolio | Audit Engine | Project command from package.json. | Varies | node --import tsx src/clientAuditReports/generateClientAuditPortfolio.ts |
| npm run audit:portfolio | Audit Engine | Project command from package.json. | Varies | node --import tsx src/auditPackEngine/generateAuditPortfolio.ts |
| npm run audit:sample | Audit Engine | Project command from package.json. | Varies | tsx apps/qa-audit-runner/src/cli/index.ts --url https://example.com |
| npm run audit:site | Audit Engine | Project command from package.json. | Varies | tsx src/audit/auditSite.ts |
| npm run audit:unified | Audit Engine | Project command from package.json. | Varies | node --import tsx src/unifiedAuditGenerator/generateUnifiedAudit.ts |
| npm run audit:unified-summary | Audit Engine | Summarize local module state. | Varies | node --import tsx src/unifiedAuditGenerator/generateUnifiedAuditSummary.ts |
| npm run business:daily | General | Project command from package.json. | Varies | npm run lead:daily |
| npm run business:weekly | General | Project command from package.json. | Varies | tsx apps/lead-operator/src/cli/index.ts business:weekly |
| npm run client-readiness:pack | General | Project command from package.json. | Varies | node --import tsx src/clientReadiness/generateClientReadinessPack.ts |
| npm run client:delivery | General | Project command from package.json. | Varies | tsx src/clientDelivery/generateClientDelivery.ts |
| npm run client:delivery-report | General | Project command from package.json. | Varies | tsx src/clientReporting/generateDeliveryReport.ts |
| npm run client:evidence | General | Project command from package.json. | Varies | tsx src/clientDelivery/generateEvidenceLog.ts |
| npm run client:monthly-report | General | Project command from package.json. | Varies | node --import tsx src/clientDelivery/monthlyReport.ts |
| npm run client:next-actions | General | Project command from package.json. | Varies | tsx src/clientOps/generateClientNextActions.ts |
| npm run client:onboard | General | Project command from package.json. | Varies | node --import tsx src/clientDelivery/clientOnboard.ts |
| npm run client:ops | General | Project command from package.json. | Varies | node --import tsx src/clientOps/generateClientOps.ts |
| npm run client:prep | General | Project command from package.json. | Varies | tsx src/clientWorkflow/generateClientPrep.ts |
| npm run client:renewal-check | General | Project command from package.json. | Varies | node --import tsx src/clientDelivery/renewalCheck.ts |
| npm run client:report | General | Project command from package.json. | Varies | tsx src/clientReports/generateClientReport.ts |
| npm run client:update-draft | General | Project command from package.json. | Varies | tsx src/clientReporting/generateClientUpdateDraft.ts |
| npm run client:weekly-report | General | Project command from package.json. | Varies | node --import tsx src/clientDelivery/weeklyReport.ts |
| npm run cockpit | General | Project command from package.json. | Varies | node --import tsx src/cockpit/generateCockpit.ts |
| npm run cockpit:approve | General | Project command from package.json. | Varies | node --import tsx src/actionCockpit/generateApprovalQueue.ts |
| npm run cockpit:daily | General | Project command from package.json. | Varies | node --import tsx src/actionCockpit/generateActionCockpit.ts |
| npm run commercial:summary | General | Summarize local module state. | Varies | node --import tsx src/commercialMode/commercialModeFilter.ts |
| npm run contact:decision | Contact Research | Project command from package.json. | Varies | node --import tsx src/outreachReview/generateContactDecision.ts |
| npm run contact:review | Contact Research | Generate local review output. | Varies | tsx src/contactReview/generateContactReview.ts |
| npm run contact:update | Contact Research | Project command from package.json. | Varies | tsx src/contactReview/updateContactReview.ts |
| npm run content:from-audits | General | Project command from package.json. | Varies | tsx src/content/generateContentFromAudits.ts |
| npm run dashboard | Dashboard | Generate dashboard or dashboard report. | output/dashboard, dashboard/dashboard.json | node --import tsx src/dashboard/generateDashboard.ts |
| npm run dashboard:build | Dashboard | Generate dashboard or dashboard report. | output/dashboard, dashboard/dashboard.json | node --import tsx src/dashboard/generateDashboard.ts --build |
| npm run dashboard:check | Dashboard | Generate dashboard or dashboard report. | output/dashboard, dashboard/dashboard.json | tsx apps/dashboard-viewer/src/server.ts --check |
| npm run dashboard:dev | Dashboard | Generate dashboard or dashboard report. | output/dashboard, dashboard/dashboard.json | tsx apps/dashboard-viewer/src/server.ts |
| npm run dashboard:generate | Dashboard | Generate local report output. | output/dashboard, dashboard/dashboard.json | node --import tsx src/dashboard/generateDashboard.ts |
| npm run dashboard:mobile | Dashboard | Generate dashboard or dashboard report. | output/dashboard, dashboard/dashboard.json | node --import tsx src/dashboard/generateDashboard.ts --mobile |
| npm run dashboard:preview | Dashboard | Generate dashboard or dashboard report. | output/dashboard, dashboard/dashboard.json | node --import tsx src/dashboard/generateDashboard.ts --preview |
| npm run day:plan | General | Project command from package.json. | Varies | node --import tsx src/dailyRevenueLoop/generateDayPlan.ts |
| npm run day:summary | General | Summarize local module state. | Varies | node --import tsx src/dailyRevenueLoop/generateDaySummary.ts |
| npm run evidence:capture-plan | Evidence Engine | Project command from package.json. | Varies | node --import tsx src/evidenceCaptureFramework/generateCapturePlan.ts |
| npm run evidence:collect | Evidence Engine | Project command from package.json. | Varies | node --import tsx src/evidenceEngine/generateEvidence.ts |
| npm run evidence:lighthouse | Evidence Engine | Project command from package.json. | Varies | node --import tsx src/lighthouseEvidence/runLighthouseEvidence.ts |
| npm run evidence:lighthouse-summary | Evidence Engine | Summarize local module state. | Varies | node --import tsx src/lighthouseEvidence/generateLighthouseSummary.ts |
| npm run evidence:playwright-plan | Evidence Engine | Project command from package.json. | Varies | node --import tsx src/playwrightEvidenceFramework/generatePlaywrightPlan.ts |
| npm run evidence:playwright-readiness | Evidence Engine | Project command from package.json. | Varies | node --import tsx src/playwrightEvidenceFramework/generatePlaywrightReadiness.ts |
| npm run evidence:playwright-run | Evidence Engine | Project command from package.json. | Varies | node --import tsx src/playwrightEvidenceRunner/runPlaywrightEvidence.ts |
| npm run evidence:playwright-summary | Evidence Engine | Summarize local module state. | Varies | node --import tsx src/playwrightEvidenceRunner/generatePlaywrightSummary.ts |
| npm run evidence:portfolio | Evidence Engine | Project command from package.json. | Varies | node --import tsx src/evidenceEngine/generateEvidencePortfolio.ts |
| npm run evidence:roadmap | Evidence Engine | Project command from package.json. | Varies | node --import tsx src/evidenceCaptureFramework/generateEvidenceRoadmap.ts |
| npm run execute:decision-board | Execution Pack | Project command from package.json. | Varies | node --import tsx src/executionPack/generateDecisionBoard.ts |
| npm run execute:first-client | Execution Pack | Project command from package.json. | Varies | node --import tsx src/executionPack/generateFirstRevenueChecklist.ts |
| npm run execute:outreach-review | Execution Pack | Generate local review output. | Varies | node --import tsx src/executionPack/generateOutreachReview.ts |
| npm run executive:portfolio | Executive Layer | Project command from package.json. | Varies | node --import tsx src/executiveLayer/generateExecutivePortfolio.ts |
| npm run executive:risk | Executive Layer | Project command from package.json. | Varies | node --import tsx src/executiveLayer/generateBusinessRisk.ts |
| npm run executive:roadmap | Executive Layer | Project command from package.json. | Varies | node --import tsx src/executiveLayer/generatePriorityRoadmap.ts |
| npm run executive:summary | Executive Layer | Summarize local module state. | Varies | node --import tsx src/executiveLayer/generateExecutiveSummary.ts |
| npm run finance:dashboard | Finance Tracking | Generate dashboard or dashboard report. | output/finance | node --import tsx src/financeTracking/financeDashboard.ts |
| npm run finance:forecast | Finance Tracking | Project command from package.json. | output/finance | node --import tsx src/financeTracking/financeForecast.ts |
| npm run finance:monthly | Finance Tracking | Project command from package.json. | output/finance | node --import tsx src/financeTracking/monthlyFinance.ts |
| npm run first-audit:kickoff | General | Project command from package.json. | Varies | tsx src/firstAuditWorkflow/generateAuditKickoff.ts |
| npm run first-audit:sales-pack | General | Project command from package.json. | Varies | tsx src/clientReadiness/generateFirstAuditSalesPack.ts |
| npm run first-audit:workflow | General | Project command from package.json. | Varies | node --import tsx src/firstAuditWorkflow/generateFirstAuditWorkflow.ts |
| npm run first-client:path | General | Project command from package.json. | Varies | node --import tsx src/firstRevenueValidation/generateFirstClientPath.ts |
| npm run followup:daily | Follow-Up OS | Project command from package.json. | output/followups | node --import tsx src/followUpEngine/generateDailyFollowUpPlan.ts |
| npm run followup:priorities | Follow-Up OS | Project command from package.json. | output/followups | node --import tsx src/followUpEngine/generateFollowUpPriorities.ts |
| npm run followup:queue | Follow-Up OS | Generate local queue output. | output/followups | node --import tsx src/followUpEngine/generateFollowUpQueue.ts |
| npm run followup:review | Follow-Up OS | Generate local review output. | output/followups | node --import tsx src/followUpEngine/generateFollowUpReview.ts |
| npm run lead:add | Lead Research | Project command from package.json. | Varies | tsx src/leads/addLeadCli.ts |
| npm run lead:audit | Lead Research | Project command from package.json. | Varies | tsx apps/lead-operator/src/cli/index.ts audit |
| npm run lead:auto | Lead Research | Project command from package.json. | Varies | tsx apps/lead-operator/src/cli/index.ts auto |
| npm run lead:candidate-queue | Lead Research | Generate local queue output. | Varies | tsx src/leadDiscoveryAutomation/generateLeadCandidateQueue.ts |
| npm run lead:channel-plan | Lead Research | Project command from package.json. | Varies | node --import tsx src/channelResearch/generateChannelPlan.ts |
| npm run lead:channels | Lead Research | Project command from package.json. | Varies | node --import tsx src/channelResearch/generateLeadChannels.ts |
| npm run lead:close | Lead Research | Project command from package.json. | Varies | tsx apps/lead-operator/src/cli/index.ts close |
| npm run lead:convert | Lead Research | Project command from package.json. | Varies | tsx apps/lead-operator/src/cli/index.ts convert |
| npm run lead:daily | Lead Research | Project command from package.json. | Varies | tsx apps/lead-operator/src/cli/index.ts daily |
| npm run lead:discover | Lead Research | Project command from package.json. | Varies | node --import tsx src/discovery/generateDiscoveryReport.ts |
| npm run lead:discover:assistant | Lead Research | Project command from package.json. | Varies | tsx src/leadDiscoveryAutomation/generateLeadDiscoveryAssistant.ts |
| npm run lead:enrich | Lead Research | Project command from package.json. | Varies | tsx apps/lead-operator/src/cli/index.ts enrich |
| npm run lead:find | Lead Research | Project command from package.json. | Varies | tsx apps/lead-operator/src/cli/index.ts find |
| npm run lead:followup | Lead Research | Project command from package.json. | Varies | tsx apps/lead-operator/src/cli/index.ts followup |
| npm run lead:followups:due | Lead Research | Project command from package.json. | Varies | tsx apps/lead-operator/src/cli/index.ts followups:due |
| npm run lead:intake:approved | Lead Research | Project command from package.json. | Varies | tsx src/leadIntake/generateApprovedCandidates.ts |
| npm run lead:intake:batch | Lead Research | Project command from package.json. | Varies | tsx src/leadIntake/generateLeadAddBatch.ts |
| npm run lead:optimize | Lead Research | Project command from package.json. | Varies | tsx apps/lead-operator/src/cli/index.ts lead:optimize |
| npm run lead:pack | Lead Research | Project command from package.json. | Varies | node --import tsx src/leadPack/generateLeadPack.ts |
| npm run lead:pipeline | Lead Research | Project command from package.json. | Varies | tsx apps/lead-operator/src/cli/index.ts pipeline |
| npm run lead:proposal | Lead Research | Project command from package.json. | Varies | tsx apps/lead-operator/src/cli/index.ts proposal |
| npm run lead:research | Lead Research | Project command from package.json. | Varies | node --import tsx src/leadResearch/generateLeadResearch.ts |
| npm run lead:review | Lead Research | Generate local review output. | Varies | tsx apps/lead-operator/src/cli/index.ts review |
| npm run lead:score | Lead Research | Project command from package.json. | Varies | tsx apps/lead-operator/src/cli/index.ts score |
| npm run lead:sent | Lead Research | Project command from package.json. | Varies | tsx apps/lead-operator/src/cli/index.ts sent |
| npm run lead:update | Lead Research | Project command from package.json. | Varies | tsx apps/lead-operator/src/cli/index.ts update |
| npm run leads:seed | General | Project command from package.json. | Varies | tsx src/leads/seedLeads.ts |
| npm run mac:daily | General | Project command from package.json. | Varies | node --import tsx src/macAutomation/generateMacDaily.ts |
| npm run mac:summary | General | Summarize local module state. | Varies | node --import tsx src/macAutomation/generateMacSummary.ts |
| npm run message:optimize | General | Project command from package.json. | output/messages | tsx apps/lead-operator/src/cli/index.ts message:optimize |
| npm run message:pack | General | Project command from package.json. | output/messages | node --import tsx src/messageReview/generateMessagePack.ts |
| npm run message:queue | General | Generate local queue output. | output/messages | tsx apps/lead-operator/src/cli/index.ts message:queue |
| npm run message:review | General | Generate local review output. | output/messages | node --import tsx src/messageReview/generateMessageReview.ts |
| npm run message:sent | General | Project command from package.json. | output/messages | tsx apps/lead-operator/src/cli/index.ts message:sent |
| npm run metrics:revenue | General | Project command from package.json. | Varies | tsx src/metrics/generateRevenueSummary.ts |
| npm run mobile:center | Mobile Command Center | Project command from package.json. | Varies | node --import tsx src/mobileCommandCenter/generateMobileCenter.ts |
| npm run mobile:queue | Mobile Command Center | Generate local queue output. | Varies | node --import tsx src/mobileCommandCenter/generateMobileQueue.ts |
| npm run mobile:review | Mobile Command Center | Generate local review output. | Varies | node --import tsx src/mobileCommandCenter/generateMobileReview.ts |
| npm run mobile:summary | Mobile Command Center | Summarize local module state. | Varies | node --import tsx src/mobileCommandCenter/generateMobileSummary.ts |
| npm run operator:brief | General | Project command from package.json. | Varies | tsx sales-marketing-engine/operator/scripts/generateDailySalesBrief.ts |
| npm run operator:content | General | Project command from package.json. | Varies | tsx sales-marketing-engine/operator/scripts/generateContentPack.ts |
| npm run operator:daily | General | Project command from package.json. | Varies | node --import tsx src/operator/generateDailyOperator.ts |
| npm run operator:followups | General | Project command from package.json. | Varies | tsx sales-marketing-engine/operator/scripts/generateFollowUpsDue.ts |
| npm run operator:messages | General | Project command from package.json. | Varies | tsx sales-marketing-engine/operator/scripts/generateMessagesToSend.ts |
| npm run operator:pipeline | General | Project command from package.json. | Varies | tsx sales-marketing-engine/operator/scripts/generatePipelineSummary.ts |
| npm run operator:proposals | General | Project command from package.json. | Varies | tsx sales-marketing-engine/operator/scripts/generateProposalQueue.ts |
| npm run operator:qualify | General | Project command from package.json. | Varies | tsx sales-marketing-engine/operator/scripts/qualifyLeads.ts |
| npm run operator:weekly | General | Project command from package.json. | Varies | tsx sales-marketing-engine/operator/scripts/runWeeklyOperator.ts |
| npm run opportunity:generate | Opportunity Engine | Generate local report output. | Varies | node --import tsx src/opportunityEngine/generateOpportunity.ts |
| npm run opportunity:summary | Opportunity Engine | Summarize local module state. | Varies | node --import tsx src/opportunityEngine/generateOpportunitySummary.ts |
| npm run os:audit | General | Project command from package.json. | Varies | node --import tsx src/osStabilization/generateSystemAudit.ts |
| npm run os:dashboard | General | Generate dashboard or dashboard report. | Varies | node --import tsx src/operatorDashboard/generateOperatorDashboard.ts |
| npm run os:health | General | Project command from package.json. | Varies | node --import tsx src/osStabilization/generateSystemHealth.ts |
| npm run os:release-check | General | Project command from package.json. | Varies | node --import tsx src/releaseCandidate/generateReleaseCheck.ts |
| npm run os:today | General | Project command from package.json. | Varies | node --import tsx src/operatorDashboard/generateTodayView.ts |
| npm run os:v1-report | General | Project command from package.json. | Varies | node --import tsx src/releaseCandidate/generateV1Report.ts |
| npm run outcome:add | Outcome Tracking | Project command from package.json. | output/outcomes, data/outcomes | node --import tsx src/outcomeTracking/addOutcome.ts |
| npm run outcome:dashboard | Outcome Tracking | Generate dashboard or dashboard report. | output/outcomes, data/outcomes | node --import tsx src/outcomeTracking/generateOutcomeDashboard.ts |
| npm run outcome:review | Outcome Tracking | Generate local review output. | output/outcomes, data/outcomes | node --import tsx src/outcomeTracking/generateOutcomeReview.ts |
| npm run outreach:execute-pack | Outreach | Project command from package.json. | Varies | tsx src/outreachExecution/generateOutreachExecutionPack.ts |
| npm run outreach:first-audit-path | Outreach | Project command from package.json. | Varies | tsx src/outreachOperating/generateFirstAuditPath.ts |
| npm run outreach:follow-up-plan | Outreach | Project command from package.json. | Varies | tsx src/outreachExecution/generateFollowUpPlan.ts |
| npm run outreach:operating-pack | Outreach | Project command from package.json. | Varies | tsx src/outreachOperating/generateOutreachOperatingPack.ts |
| npm run outreach:pack | Outreach | Project command from package.json. | Varies | tsx src/outreachPack/generateOutreachPack.ts |
| npm run outreach:queue | Outreach | Generate local queue output. | Varies | tsx src/outreachQueue/generateOutreachQueue.ts |
| npm run outreach:review | Outreach | Generate local review output. | Varies | node --import tsx src/outreachReview/generateOutreachReview.ts |
| npm run outreach:status | Outreach | Project command from package.json. | Varies | node --import tsx src/outreachTracking/generateOutreachStatus.ts |
| npm run pain:research | General | Project command from package.json. | Varies | node --import tsx src/painIntelligence/generatePainResearch.ts |
| npm run pain:summary | General | Summarize local module state. | Varies | node --import tsx src/painIntelligence/generatePainSummary.ts |
| npm run pipeline:next-actions | General | Project command from package.json. | Varies | tsx src/pipelinePrioritization/generatePipelineNextActions.ts |
| npm run pipeline:opportunities | General | Project command from package.json. | Varies | tsx src/pipeline/generateOpportunityTracker.ts |
| npm run pipeline:prioritize | General | Project command from package.json. | Varies | node --import tsx src/pipelinePrioritization/generatePipelinePrioritization.ts |
| npm run proposal:center | Proposal Engine | Project command from package.json. | Varies | node --import tsx src/proposalCenter/generateProposalCenter.ts |
| npm run renewal:review | General | Generate local review output. | Varies | tsx src/renewals/generateClientHealth.ts |
| npm run renewal:tracker | General | Project command from package.json. | Varies | node --import tsx src/renewals/generateRenewalTracker.ts |
| npm run report | General | Project command from package.json. | Varies | playwright show-report |
| npm run revenue:command-center | Revenue | Project command from package.json. | output/revenue | node --import tsx src/revenueCommandCenter/generateRevenueCommandCenter.ts |
| npm run revenue:daily | Revenue | Project command from package.json. | output/revenue | node --import tsx src/dailyRevenueOperator/generateRevenueDaily.ts |
| npm run revenue:focus | Revenue | Project command from package.json. | output/revenue | node --import tsx src/revenueActivation/generateRevenueFocus.ts |
| npm run revenue:forecast | Revenue | Project command from package.json. | output/revenue | node --import tsx src/revenueCommandCenter/generateRevenueForecast.ts |
| npm run revenue:next-actions | Revenue | Project command from package.json. | output/revenue | node --import tsx src/dailyRevenueOperator/generateRevenueNextActions.ts |
| npm run revenue:pipeline | Revenue | Project command from package.json. | output/revenue | node --import tsx src/revenueActivation/generateRevenuePipeline.ts |
| npm run revenue:score | Revenue | Project command from package.json. | output/revenue | node --import tsx src/revenueActivation/generateRevenueScore.ts |
| npm run revenue:summary | Revenue | Summarize local module state. | output/revenue | tsx apps/lead-operator/src/cli/index.ts revenue:summary |
| npm run revenue:targets | Revenue | Project command from package.json. | output/revenue | node --import tsx src/revenueActivation/generateRevenueTargets.ts |
| npm run revenue:validate | Revenue | Project command from package.json. | output/revenue | node --import tsx src/firstRevenueValidation/generateRevenueValidation.ts |
| npm run revenue:visibility | Revenue | Project command from package.json. | output/revenue | tsx src/dashboard/generateRevenueVisibility.ts |
| npm run site:intelligence | General | Project command from package.json. | Varies | node --import tsx src/siteIntelligence/generateSiteIntelligence.ts |
| npm run site:summary | General | Summarize local module state. | Varies | node --import tsx src/siteIntelligence/generateSiteSummary.ts |
| npm run sources:report | General | Project command from package.json. | Varies | tsx apps/lead-operator/src/cli/index.ts sources:report |
| npm run sow:center | Proposal Engine | Project command from package.json. | Varies | tsx src/proposalCenter/generateSowCenter.ts |
| npm run sow:generate | Proposal Engine | Generate local report output. | Varies | node --import tsx src/proposalEngine/generateProposal.ts |
| npm run sow:portfolio | Proposal Engine | Project command from package.json. | Varies | node --import tsx src/proposalEngine/generatePortfolio.ts |
| npm run studio:architecture | Studio Operations | Project command from package.json. | output/studio-snapshot, output/studio, output/hardening | node --import tsx src/studioSnapshot/generateArchitectureSummary.ts |
| npm run studio:command-audit | Studio Operations | Project command from package.json. | output/studio-snapshot, output/studio, output/hardening | node --import tsx src/studioHardening/generateCommandAudit.ts |
| npm run studio:hardening | Studio Operations | Project command from package.json. | output/studio-snapshot, output/studio, output/hardening | node --import tsx src/studioHardening/generateHardeningReport.ts |
| npm run studio:health | Studio Operations | Project command from package.json. | output/studio-snapshot, output/studio, output/hardening | node --import tsx src/studioConsolidation/generateStudioHealth.ts |
| npm run studio:inventory | Studio Operations | Inventory local commands, data, and outputs. | output/studio-snapshot, output/studio, output/hardening | node --import tsx src/studioSnapshot/generateInventoryReport.ts |
| npm run studio:monday-checklist | Studio Operations | Project command from package.json. | output/studio-snapshot, output/studio, output/hardening | node --import tsx src/studioHardening/generateMondayLaunchChecklist.ts |
| npm run studio:output-audit | Studio Operations | Project command from package.json. | output/studio-snapshot, output/studio, output/hardening | node --import tsx src/studioHardening/generateOutputAudit.ts |
| npm run studio:rebuild-guide | Studio Operations | Generate rebuild and disaster recovery instructions. | output/studio-snapshot, output/studio, output/hardening | node --import tsx src/studioSnapshot/generateRebuildGuide.ts |
| npm run studio:recovery-check | Studio Operations | Check recovery readiness. | output/studio-snapshot, output/studio, output/hardening | node --import tsx src/studioSnapshot/generateRecoveryCheck.ts |
| npm run studio:release-check | Studio Operations | Project command from package.json. | output/studio-snapshot, output/studio, output/hardening | node --import tsx src/studioConsolidation/generateReleaseCheck.ts |
| npm run studio:snapshot | Studio Operations | Generate or support Studio snapshot documentation. | output/studio-snapshot, output/studio, output/hardening | node --import tsx src/studioSnapshot/generateStudioSnapshot.ts |
| npm run studio:summary | Studio Operations | Summarize local module state. | output/studio-snapshot, output/studio, output/hardening | node --import tsx src/studioConsolidation/generateStudioSummary.ts |
| npm run success:monthly | General | Project command from package.json. | Varies | tsx src/operator/generateMonthlySuccess.ts |
| npm run success:weekly | General | Project command from package.json. | Varies | tsx src/operator/generateWeeklySuccess.ts |
| npm run system:check | General | Project command from package.json. | Varies | tsx src/systemCheck/systemReadinessCheck.ts |
| npm run test | General | Project command from package.json. | Varies | playwright test |
| npm run test:ai | General | Project command from package.json. | Varies | playwright test playwright-framework/tests/ai |
| npm run test:api | General | Project command from package.json. | Varies | playwright test playwright-framework/tests/api |
| npm run test:chromium | General | Project command from package.json. | Varies | playwright test --project=chromium |
| npm run test:debug | General | Project command from package.json. | Varies | playwright test --debug |
| npm run test:headed | General | Project command from package.json. | Varies | playwright test --headed |
| npm run test:ui | General | Project command from package.json. | Varies | playwright test playwright-framework/tests/ui |
| npm run typecheck | General | Project command from package.json. | Varies | tsc --noEmit |
| npm run validate:business | General | Project command from package.json. | Varies | tsx apps/lead-operator/src/cli/validateBusiness.ts |
| npm run week:review | General | Generate local review output. | Varies | node --import tsx src/dailyRevenueLoop/generateWeekReview.ts |
| npm run winloss:analysis | Win/Loss Intelligence | Project command from package.json. | output/winloss | node --import tsx src/winLossEngine/generateWinLossAnalysis.ts |
| npm run winloss:insights | Win/Loss Intelligence | Project command from package.json. | output/winloss | node --import tsx src/winLossEngine/generateOpportunityInsights.ts |
| npm run winloss:patterns | Win/Loss Intelligence | Project command from package.json. | output/winloss | node --import tsx src/winLossEngine/generatePatternAnalysis.ts |
| npm run winloss:strategy | Win/Loss Intelligence | Project command from package.json. | output/winloss | node --import tsx src/winLossEngine/generateStrategyRecommendations.ts |
