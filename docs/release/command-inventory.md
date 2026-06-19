# Studio v1 Command Inventory

Generated: 2026-06-19T01:58:13.280Z

## Core Commands

| Command | Status | Script |
| --- | --- | --- |
| npm run runner:plan | ACTIVE | node --import tsx src/autonomousRunner/generateRunnerPlan.ts |
| npm run runner:summary | DEPRECATED CANDIDATE | node --import tsx src/autonomousRunner/generateRunnerSummary.ts |
| npm run runner:health | ACTIVE | node --import tsx src/autonomousRunner/generateRunnerHealth.ts |
| npm run runner:launchd | ACTIVE | node --import tsx src/autonomousRunner/generateLaunchdConfig.ts |
| npm run runner:test | ACTIVE | node --import tsx src/autonomousRunner/generateRunnerSummary.ts --test |
| npm run consistency:scan | ACTIVE | node --import tsx src/commercialConsistency/scanCommercialReferences.ts |
| npm run consistency:dashboard | ACTIVE | node --import tsx src/commercialConsistency/scanDashboardReferences.ts |
| npm run consistency:mobile | ACTIVE | node --import tsx src/commercialConsistency/scanMobileReferences.ts |
| npm run consistency:runner | ACTIVE | node --import tsx src/commercialConsistency/scanRunnerReferences.ts |
| npm run consistency:outputs | ACTIVE | node --import tsx src/commercialConsistency/scanGeneratedOutputs.ts |
| npm run consistency:sources | ACTIVE | node --import tsx src/commercialConsistency/scanSourceOfTruthUsage.ts |
| npm run consistency:report | ACTIVE | node --import tsx src/commercialConsistency/generateConsistencyReport.ts |
| npm run consistency:repair | ACTIVE | node --import tsx src/commercialConsistency/generateRepairRecommendations.ts |
| npm run release:notes | ACTIVE | node --import tsx src/releaseManager/generateReleaseNotes.ts |
| npm run release:version | ACTIVE | node --import tsx src/releaseManager/generateVersionReport.ts |
| npm run release:commands | ACTIVE | node --import tsx src/releaseManager/generateCommandInventory.ts |
| npm run release:validate | ACTIVE | node --import tsx src/releaseManager/generateValidationReport.ts |
| npm run release:operations | ACTIVE | node --import tsx src/releaseManager/generateOperationsRunbook.ts |
| npm run release:revenue-mode | ACTIVE | node --import tsx src/releaseManager/generateRevenueModeRunbook.ts |
| npm run release:manifest | ACTIVE | node --import tsx src/releaseManager/generateStudioManifest.ts |
| npm run release:summary | ACTIVE | node --import tsx src/releaseManager/generateReleaseSummary.ts |
| npm run dashboard:generate | ACTIVE | node --import tsx src/dashboard/generateDashboard.ts |
| npm run dashboard:build | ACTIVE | node --import tsx src/dashboard/generateDashboard.ts --build |
| npm run dashboard:preview | DEPRECATED CANDIDATE | node --import tsx src/dashboard/generateDashboard.ts --preview |
| npm run dashboard:mobile | ACTIVE | node --import tsx src/dashboard/generateDashboard.ts --mobile |
| npm run dashboard:dev | ACTIVE | tsx apps/dashboard-viewer/src/server.ts |
| npm run dashboard:check | ACTIVE | tsx apps/dashboard-viewer/src/server.ts --check |
| npm run mobile:center | DEPRECATED CANDIDATE | node --import tsx src/mobileCommandCenter/generateMobileCenter.ts |
| npm run mobile:review | DEPRECATED CANDIDATE | node --import tsx src/mobileCommandCenter/generateMobileReview.ts |
| npm run mobile:today | ACTIVE | node --import tsx src/mobileCommandCenter/generateTodayView.ts |
| npm run mobile:revenue | ACTIVE | node --import tsx src/mobileCommandCenter/generateRevenueView.ts |
| npm run mobile:pipeline | ACTIVE | node --import tsx src/mobileCommandCenter/generatePipelineView.ts |
| npm run mobile:actions | ACTIVE | node --import tsx src/mobileCommandCenter/generateActionCenter.ts |
| npm run mobile:summary | DEPRECATED CANDIDATE | node --import tsx src/mobileCommandCenter/generateMobileSummary.ts |
| npm run mobile:queue | ACTIVE | node --import tsx src/mobileCommandCenter/generateMobileQueue.ts |
| npm run studio:health | ACTIVE | node --import tsx src/studioHealth/generateHealthSummary.ts |
| npm run studio:doctor | ACTIVE | node --import tsx src/studioHealth/generateHealthSummary.ts |
| npm run studio:repair | ACTIVE | node --import tsx src/studioHealth/generateRepairPlan.ts |
| npm run studio:cleanup | ACTIVE | node --import tsx src/studioHealth/generateCleanupPlan.ts |
| npm run studio:backup | ACTIVE | node --import tsx src/studioHealth/generateBackupPlan.ts |
| npm run studio:summary | DEPRECATED CANDIDATE | node --import tsx src/studioConsolidation/generateStudioSummary.ts |
| npm run studio:release-check | ACTIVE | node --import tsx src/studioConsolidation/generateReleaseCheck.ts |
| npm run studio:hardening | ACTIVE | node --import tsx src/studioHardening/generateHardeningReport.ts |
| npm run studio:monday-checklist | ACTIVE | node --import tsx src/studioHardening/generateMondayLaunchChecklist.ts |
| npm run studio:command-audit | ACTIVE | node --import tsx src/studioHardening/generateCommandAudit.ts |
| npm run studio:output-audit | ACTIVE | node --import tsx src/studioHardening/generateOutputAudit.ts |
| npm run studio:snapshot | ACTIVE | node --import tsx src/studioSnapshot/generateStudioSnapshot.ts |
| npm run studio:architecture | ACTIVE | node --import tsx src/studioSnapshot/generateArchitectureSummary.ts |
| npm run studio:inventory | ACTIVE | node --import tsx src/studioSnapshot/generateInventoryReport.ts |
| npm run studio:rebuild-guide | ACTIVE | node --import tsx src/studioSnapshot/generateRebuildGuide.ts |
| npm run studio:recovery-check | ACTIVE | node --import tsx src/studioSnapshot/generateRecoveryCheck.ts |
| npm run studio:launch-status | ACTIVE | node --import tsx src/operatorUx/generateLaunchStatus.ts |
| npm run studio:cockpit | ACTIVE | node --import tsx src/operatorUx/generateOperatorCockpit.ts |
| npm run studio:quick-actions | ACTIVE | node --import tsx src/operatorUx/generateQuickActions.ts |
| npm run studio:highlights | ACTIVE | node --import tsx src/operatorUx/generateSystemHighlights.ts |

## Revenue Commands

| Command | Status | Script |
| --- | --- | --- |
| npm run lead:add | ACTIVE | tsx src/leads/addLeadCli.ts |
| npm run lead:discover | ACTIVE | node --import tsx src/discovery/generateDiscoveryReport.ts |
| npm run lead:discover:assistant | ACTIVE | tsx src/leadDiscoveryAutomation/generateLeadDiscoveryAssistant.ts |
| npm run lead:candidate-queue | ACTIVE | tsx src/leadDiscoveryAutomation/generateLeadCandidateQueue.ts |
| npm run lead:intake:approved | ACTIVE | tsx src/leadIntake/generateApprovedCandidates.ts |
| npm run lead:intake:batch | ACTIVE | tsx src/leadIntake/generateLeadAddBatch.ts |
| npm run lead:score | ACTIVE | tsx apps/lead-operator/src/cli/index.ts score |
| npm run lead:pack | ACTIVE | node --import tsx src/leadPack/generateLeadPack.ts |
| npm run lead:research | ACTIVE | node --import tsx src/leadResearch/generateLeadResearch.ts |
| npm run lead:channels | ACTIVE | node --import tsx src/channelResearch/generateLeadChannels.ts |
| npm run lead:channel-plan | ACTIVE | node --import tsx src/channelResearch/generateChannelPlan.ts |
| npm run lead:intelligence | ACTIVE | node --import tsx src/leadIntelligence/generateLeadIntelligence.ts |
| npm run lead:ranking | ACTIVE | node --import tsx src/leadIntelligence/generateLeadRanking.ts |
| npm run lead:opportunities | ACTIVE | node --import tsx src/leadIntelligence/generateLeadOpportunities.ts |
| npm run lead:next-actions | ACTIVE | node --import tsx src/leadIntelligence/generateNextActions.ts |
| npm run lead:daily-discovery | ACTIVE | node --import tsx src/dailyLeadDiscovery/runDailyDiscovery.ts |
| npm run lead:daily-ranking | ACTIVE | node --import tsx src/dailyLeadDiscovery/rankDailyLeads.ts |
| npm run lead:daily-summary | DEPRECATED CANDIDATE | node --import tsx src/dailyLeadDiscovery/generateDailyLeadSummary.ts |
| npm run lead:rotation | ACTIVE | node --import tsx src/leadRotation/rotateLeadCandidates.ts |
| npm run lead:rotation-ranking | ACTIVE | node --import tsx src/leadRotation/generateCommercialRanking.ts |
| npm run lead:rotation-summary | DEPRECATED CANDIDATE | node --import tsx src/leadRotation/generateRotationSummary.ts |
| npm run lead:commercial-ranking | ACTIVE | node --import tsx src/leadRotation/generateCommercialRanking.ts |
| npm run lead:proposal | ACTIVE | tsx apps/lead-operator/src/cli/index.ts proposal |
| npm run lead:followup | ACTIVE | tsx apps/lead-operator/src/cli/index.ts followup |
| npm run lead:daily | ACTIVE | tsx apps/lead-operator/src/cli/index.ts daily |
| npm run lead:find | ACTIVE | tsx apps/lead-operator/src/cli/index.ts find |
| npm run lead:auto | ACTIVE | tsx apps/lead-operator/src/cli/index.ts auto |
| npm run lead:update | ACTIVE | tsx apps/lead-operator/src/cli/index.ts update |
| npm run lead:audit | ACTIVE | tsx apps/lead-operator/src/cli/index.ts audit |
| npm run lead:enrich | ACTIVE | tsx apps/lead-operator/src/cli/index.ts enrich |
| npm run lead:sent | ACTIVE | tsx apps/lead-operator/src/cli/index.ts sent |
| npm run lead:followups:due | ACTIVE | tsx apps/lead-operator/src/cli/index.ts followups:due |
| npm run lead:pipeline | ACTIVE | tsx apps/lead-operator/src/cli/index.ts pipeline |
| npm run lead:review | DEPRECATED CANDIDATE | tsx apps/lead-operator/src/cli/index.ts review |
| npm run lead:convert | ACTIVE | tsx apps/lead-operator/src/cli/index.ts convert |
| npm run lead:close | ACTIVE | tsx apps/lead-operator/src/cli/index.ts close |
| npm run revenue:morning | ACTIVE | node --import tsx src/revenueMode/generateMorningBrief.ts |
| npm run revenue:today | ACTIVE | node --import tsx src/revenueMode/generateTodayActions.ts |
| npm run revenue:goals | ACTIVE | node --import tsx src/revenueMode/generateRevenueGoals.ts |
| npm run revenue:queue | ACTIVE | node --import tsx src/revenueMode/generateActionQueue.ts |
| npm run revenue:followups | ACTIVE | node --import tsx src/revenueMode/generateFollowUpQueue.ts |
| npm run revenue:review | ACTIVE | node --import tsx src/revenueMode/generatePriorityReview.ts |
| npm run revenue:eod | ACTIVE | node --import tsx src/revenueMode/generateEndOfDayReview.ts |
| npm run revenue:weekly | ACTIVE | node --import tsx src/revenueMode/generateWeeklyReview.ts |
| npm run revenue:summary | ACTIVE | node --import tsx src/revenueMode/generateRevenueModeSummary.ts |
| npm run lead:optimize | ACTIVE | tsx apps/lead-operator/src/cli/index.ts lead:optimize |
| npm run revenue:visibility | ACTIVE | tsx src/dashboard/generateRevenueVisibility.ts |
| npm run revenue:command-center | ACTIVE | node --import tsx src/revenueCommandCenter/generateRevenueCommandCenter.ts |
| npm run revenue:forecast | ACTIVE | node --import tsx src/revenueCommandCenter/generateRevenueForecast.ts |
| npm run finance:monthly | ACTIVE | node --import tsx src/financeTracking/monthlyFinance.ts |
| npm run finance:dashboard | ACTIVE | node --import tsx src/financeTracking/financeDashboard.ts |
| npm run finance:forecast | ACTIVE | node --import tsx src/financeTracking/financeForecast.ts |
| npm run followup:queue | ACTIVE | node --import tsx src/followUpEngine/generateFollowUpQueue.ts |
| npm run followup:daily | ACTIVE | node --import tsx src/followUpEngine/generateDailyFollowUpPlan.ts |
| npm run followup:priorities | DEPRECATED CANDIDATE | node --import tsx src/followUpEngine/generateFollowUpPriorities.ts |
| npm run followup:review | DEPRECATED CANDIDATE | node --import tsx src/followUpEngine/generateFollowUpReview.ts |
| npm run revenue:daily | ACTIVE | node --import tsx src/dailyRevenueOperator/generateRevenueDaily.ts |
| npm run revenue:next-actions | ACTIVE | node --import tsx src/dailyRevenueOperator/generateRevenueNextActions.ts |
| npm run revenue:validate | ACTIVE | node --import tsx src/firstRevenueValidation/generateRevenueValidation.ts |
| npm run revenue:targets | ACTIVE | node --import tsx src/revenueActivation/generateRevenueTargets.ts |
| npm run revenue:pipeline | ACTIVE | node --import tsx src/revenueActivation/generateRevenuePipeline.ts |
| npm run revenue:focus | ACTIVE | node --import tsx src/revenueActivation/generateRevenueFocus.ts |
| npm run revenue:score | ACTIVE | node --import tsx src/revenueActivation/generateRevenueScore.ts |
| npm run revenue:top-lead | ACTIVE | node --import tsx src/revenueIntelligence/generateTopLead.ts |
| npm run revenue:decision | ACTIVE | node --import tsx src/revenueIntelligence/generateRevenueDecision.ts |
| npm run revenue:recommendation | ACTIVE | node --import tsx src/revenueIntelligence/generateUnifiedRecommendation.ts |
| npm run revenue:priority | ACTIVE | node --import tsx src/revenueIntelligence/generateLeadExecutionPriority.ts |
| npm run outcome:add | ACTIVE | node --import tsx src/outcomeTracking/addOutcome.ts |
| npm run outcome:dashboard | ACTIVE | node --import tsx src/outcomeTracking/generateOutcomeDashboard.ts |
| npm run outcome:review | DEPRECATED CANDIDATE | node --import tsx src/outcomeTracking/generateOutcomeReview.ts |
| npm run learning:record | ACTIVE | node --import tsx src/outcomeLearning/recordOutcome.ts |
| npm run learning:analyze | ACTIVE | node --import tsx src/outcomeLearning/analyzeOutcomes.ts |
| npm run learning:outcome | ACTIVE | node --import tsx src/revenueLearning/recordCommercialOutcome.ts |
| npm run learning:summary | DEPRECATED CANDIDATE | node --import tsx src/revenueLearning/generateCalibrationSummary.ts |
| npm run learning:leads | ACTIVE | node --import tsx src/revenueLearning/generateLeadPerformance.ts |
| npm run learning:offers | ACTIVE | node --import tsx src/revenueLearning/generateOfferPerformance.ts |
| npm run learning:channels | ACTIVE | node --import tsx src/revenueLearning/generateChannelPerformance.ts |
| npm run learning:industries | ACTIVE | node --import tsx src/revenueLearning/generateIndustryPerformance.ts |
| npm run learning:pricing | ACTIVE | node --import tsx src/revenueLearning/generatePricingPerformance.ts |
| npm run learning:recommendations | ACTIVE | node --import tsx src/revenueLearning/generateRecommendationEngine.ts |
| npm run adaptive:weights | ACTIVE | node --import tsx src/adaptiveRevenue/generateHistoricalWeights.ts |
| npm run adaptive:leads | ACTIVE | node --import tsx src/adaptiveRevenue/generateAdaptiveLeadScores.ts |
| npm run adaptive:offers | ACTIVE | node --import tsx src/adaptiveRevenue/generateAdaptiveOfferScores.ts |
| npm run adaptive:categories | ACTIVE | node --import tsx src/adaptiveRevenue/generateAdaptiveCategoryScores.ts |
| npm run adaptive:recommendations | ACTIVE | node --import tsx src/adaptiveRevenue/generateAdaptiveRecommendations.ts |
| npm run winloss:analysis | ACTIVE | node --import tsx src/winLossEngine/generateWinLossAnalysis.ts |
| npm run winloss:patterns | ACTIVE | node --import tsx src/winLossEngine/generatePatternAnalysis.ts |
| npm run winloss:insights | ACTIVE | node --import tsx src/winLossEngine/generateOpportunityInsights.ts |
| npm run winloss:strategy | ACTIVE | node --import tsx src/winLossEngine/generateStrategyRecommendations.ts |

## Delivery Commands

| Command | Status | Script |
| --- | --- | --- |
| npm run client:prep | ACTIVE | tsx src/clientWorkflow/generateClientPrep.ts |
| npm run client:convert | ACTIVE | node --import tsx src/clientConversion/convertLeadToClient.ts |
| npm run client:status | ACTIVE | node --import tsx src/clientConversion/generateClientStatus.ts |
| npm run client:package | ACTIVE | node --import tsx src/clientConversion/generatePackageSelection.ts |
| npm run client:onboard | ACTIVE | node --import tsx src/clientDelivery/clientOnboard.ts |
| npm run client:ops | ACTIVE | node --import tsx src/clientOps/generateClientOps.ts |
| npm run client:next-actions | ACTIVE | tsx src/clientOps/generateClientNextActions.ts |
| npm run client:delivery | ACTIVE | tsx src/clientDelivery/generateClientDelivery.ts |
| npm run delivery:plan | ACTIVE | node --import tsx src/deliveryRouter/generateDeliveryPlan.ts |
| npm run delivery:checklist | ACTIVE | node --import tsx src/deliveryRouter/generateDeliveryChecklist.ts |
| npm run automation:plan | ACTIVE | node --import tsx src/automationDelivery/generateAutomationPlan.ts |
| npm run automation:flows | ACTIVE | node --import tsx src/automationDelivery/generateCriticalFlows.ts |
| npm run automation:test-cases | ACTIVE | node --import tsx src/automationDelivery/generateTestCases.ts |
| npm run automation:framework | ACTIVE | node --import tsx src/automationDelivery/generateFrameworkStructure.ts |
| npm run automation:specs | ACTIVE | node --import tsx src/automationDelivery/generatePlaywrightSpecs.ts |
| npm run automation:fixtures | ACTIVE | node --import tsx src/automationDelivery/generateFixturePlan.ts |
| npm run automation:ci | ACTIVE | node --import tsx src/automationDelivery/generateCiRecommendations.ts |
| npm run automation:reporting | ACTIVE | node --import tsx src/automationDelivery/generateReportingPlan.ts |
| npm run automation:handoff | ACTIVE | node --import tsx src/automationDelivery/generateClientHandoff.ts |
| npm run assets:executive | ACTIVE | node --import tsx src/deliveryAssets/generateExecutiveReport.ts |
| npm run assets:risk | ACTIVE | node --import tsx src/deliveryAssets/generateRiskMatrix.ts |
| npm run assets:coverage | ACTIVE | node --import tsx src/deliveryAssets/generateCoverageMatrix.ts |
| npm run assets:timeline | ACTIVE | node --import tsx src/deliveryAssets/generateDeliveryTimeline.ts |
| npm run assets:blueprint | ACTIVE | node --import tsx src/deliveryAssets/generateImplementationBlueprint.ts |
| npm run assets:onboarding | ACTIVE | node --import tsx src/deliveryAssets/generateOnboardingChecklist.ts |
| npm run assets:bundle | ACTIVE | node --import tsx src/deliveryAssets/generateAssetBundle.ts |
| npm run assets:summary | DEPRECATED CANDIDATE | node --import tsx src/deliveryAssets/generateDeliverySummary.ts |
| npm run retainer:plan | ACTIVE | node --import tsx src/retainerOperations/generateRetainerPlan.ts |
| npm run retainer:roadmap | ACTIVE | node --import tsx src/retainerOperations/generateMonthlyRoadmap.ts |
| npm run retainer:coverage | ACTIVE | node --import tsx src/retainerOperations/generateCoverageRoadmap.ts |
| npm run retainer:maintenance | ACTIVE | node --import tsx src/retainerOperations/generateMaintenancePlan.ts |
| npm run retainer:weekly-report | ACTIVE | node --import tsx src/retainerOperations/generateWeeklyReport.ts |
| npm run retainer:monthly-report | ACTIVE | node --import tsx src/retainerOperations/generateMonthlyReport.ts |
| npm run retainer:health | ACTIVE | node --import tsx src/retainerOperations/generateClientHealth.ts |
| npm run retainer:renewal | ACTIVE | node --import tsx src/retainerOperations/generateRenewalPlan.ts |
| npm run retainer:expansion | ACTIVE | node --import tsx src/retainerOperations/generateExpansionOpportunities.ts |
| npm run retainer:metrics | ACTIVE | node --import tsx src/retainerOperations/generateOperationalMetrics.ts |
| npm run client:evidence | ACTIVE | tsx src/clientDelivery/generateEvidenceLog.ts |
| npm run client:weekly-report | ACTIVE | node --import tsx src/clientDelivery/weeklyReport.ts |
| npm run client:monthly-report | ACTIVE | node --import tsx src/clientDelivery/monthlyReport.ts |
| npm run client:renewal-check | ACTIVE | node --import tsx src/clientDelivery/renewalCheck.ts |
| npm run client:delivery-report | ACTIVE | tsx src/clientReporting/generateDeliveryReport.ts |
| npm run client:update-draft | ACTIVE | tsx src/clientReporting/generateClientUpdateDraft.ts |
| npm run renewal:tracker | ACTIVE | node --import tsx src/renewals/generateRenewalTracker.ts |
| npm run renewal:review | DEPRECATED CANDIDATE | tsx src/renewals/generateClientHealth.ts |
| npm run client:report | ACTIVE | tsx src/clientReports/generateClientReport.ts |

## Evidence Commands

| Command | Status | Script |
| --- | --- | --- |
| npm run audit:sample | ACTIVE | tsx apps/qa-audit-runner/src/cli/index.ts --url https://example.com |
| npm run audit:site | ACTIVE | tsx src/audit/auditSite.ts |
| npm run audit:generate | ACTIVE | node --import tsx src/auditPackEngine/generateAuditPack.ts |
| npm run audit:portfolio | DEPRECATED CANDIDATE | node --import tsx src/auditPackEngine/generateAuditPortfolio.ts |
| npm run audit:unified | ACTIVE | node --import tsx src/unifiedAuditGenerator/generateUnifiedAudit.ts |
| npm run audit:unified-summary | DEPRECATED CANDIDATE | node --import tsx src/unifiedAuditGenerator/generateUnifiedAuditSummary.ts |
| npm run audit:pdf | ACTIVE | node --import tsx src/clientAuditReports/generateClientAuditReport.ts |
| npm run audit:pdf-portfolio | DEPRECATED CANDIDATE | node --import tsx src/clientAuditReports/generateClientAuditPortfolio.ts |
| npm run audit:top-lead:evidence | ACTIVE | node --import tsx src/topLeadAudit/generateTopLeadEvidence.ts |
| npm run audit:top-lead | ACTIVE | node --import tsx src/topLeadAudit/generateTopLeadAudit.ts |
| npm run audit:top-lead:summary | DEPRECATED CANDIDATE | node --import tsx src/topLeadAudit/generateTopLeadExecutiveSummary.ts |
| npm run audit:top-lead:proposal | ACTIVE | node --import tsx src/topLeadAudit/generateTopLeadProposal.ts |
| npm run audit:top-lead:execution-pack | ACTIVE | node --import tsx src/topLeadAudit/generateTopLeadExecutionPack.ts |
| npm run evidence:collect | ACTIVE | node --import tsx src/evidenceEngine/generateEvidence.ts |
| npm run evidence:portfolio | DEPRECATED CANDIDATE | node --import tsx src/evidenceEngine/generateEvidencePortfolio.ts |
| npm run evidence:page | ACTIVE | node --import tsx src/evidenceEngine/collectPageEvidence.ts |
| npm run evidence:flows | ACTIVE | node --import tsx src/evidenceEngine/collectFlowEvidence.ts |
| npm run evidence:console | ACTIVE | node --import tsx src/evidenceEngine/collectConsoleEvidence.ts |
| npm run evidence:network | ACTIVE | node --import tsx src/evidenceEngine/collectNetworkEvidence.ts |
| npm run evidence:screenshots | ACTIVE | node --import tsx src/evidenceEngine/collectScreenshotEvidence.ts |
| npm run evidence:lighthouse | ACTIVE | node --import tsx src/evidenceEngine/collectLighthouseEvidence.ts |
| npm run evidence:summary | DEPRECATED CANDIDATE | node --import tsx src/evidenceEngine/generateEvidenceSummary.ts |
| npm run evidence:decision | ACTIVE | node --import tsx src/evidenceEngine/generateReadinessDecision.ts |
| npm run evidence:capture-plan | ACTIVE | node --import tsx src/evidenceCaptureFramework/generateCapturePlan.ts |
| npm run evidence:roadmap | ACTIVE | node --import tsx src/evidenceCaptureFramework/generateEvidenceRoadmap.ts |
| npm run evidence:playwright-plan | ACTIVE | node --import tsx src/playwrightEvidenceFramework/generatePlaywrightPlan.ts |
| npm run evidence:playwright-readiness | DEPRECATED CANDIDATE | node --import tsx src/playwrightEvidenceFramework/generatePlaywrightReadiness.ts |
| npm run evidence:playwright-run | ACTIVE | node --import tsx src/playwrightEvidenceRunner/runPlaywrightEvidence.ts |
| npm run evidence:playwright-summary | DEPRECATED CANDIDATE | node --import tsx src/playwrightEvidenceRunner/generatePlaywrightSummary.ts |
| npm run evidence:lighthouse:legacy | LEGACY | node --import tsx src/lighthouseEvidence/runLighthouseEvidence.ts |
| npm run evidence:lighthouse-summary | DEPRECATED CANDIDATE | node --import tsx src/lighthouseEvidence/generateLighthouseSummary.ts |
| npm run evidence:har | ACTIVE | node --import tsx src/evidencePro/collectHarEvidence.ts |
| npm run evidence:trace | ACTIVE | node --import tsx src/evidencePro/collectTraceEvidence.ts |
| npm run evidence:video | ACTIVE | node --import tsx src/evidencePro/collectVideoEvidence.ts |
| npm run evidence:performance | ACTIVE | node --import tsx src/evidencePro/collectPerformanceMetrics.ts |
| npm run evidence:weight | ACTIVE | node --import tsx src/evidencePro/collectPageWeightMetrics.ts |
| npm run evidence:dependencies | ACTIVE | node --import tsx src/evidencePro/collectDependencySignals.ts |
| npm run evidence:errors | ACTIVE | node --import tsx src/evidencePro/collectGroupedErrors.ts |
| npm run evidence:package | ACTIVE | node --import tsx src/evidencePro/generateEvidencePackage.ts |
| npm run evidence:executive | ACTIVE | node --import tsx src/evidencePro/generateExecutiveEvidenceSummary.ts |
| npm run audit:pack | ACTIVE | tsx src/auditPack/generateAuditPack.ts |
| npm run intelligence:companies | ACTIVE | node --import tsx src/webIntelligence/generateCompanyMatching.ts |
| npm run intelligence:evidence | ACTIVE | node --import tsx src/webIntelligence/generateEvidenceValidation.ts |
| npm run intelligence:confidence | ACTIVE | node --import tsx src/webIntelligence/generateConfidenceScores.ts |
| npm run intelligence:duplicates | ACTIVE | node --import tsx src/webIntelligence/generateDuplicateResolution.ts |
| npm run intelligence:false-positives | ACTIVE | node --import tsx src/webIntelligence/generateFalsePositiveAnalysis.ts |
| npm run intelligence:quality-report | ACTIVE | node --import tsx src/webIntelligence/generateQualityReport.ts |

## Health Commands

| Command | Status | Script |
| --- | --- | --- |
| npm run system:check | ACTIVE | tsx src/systemCheck/systemReadinessCheck.ts |
| npm run security:audit | ACTIVE | node --import tsx src/securityBoundary/generateSecurityAudit.ts |
| npm run security:private-data | ACTIVE | node --import tsx src/securityBoundary/generatePrivateDataInventory.ts |
| npm run security:portfolio-plan | DEPRECATED CANDIDATE | node --import tsx src/securityBoundary/generatePublicPortfolioPlan.ts |
| npm run security:dashboard-check | ACTIVE | node --import tsx src/securityBoundary/generateDashboardServerSecurityCheck.ts |
| npm run architecture:audit | ACTIVE | node --import tsx src/studioArchitecture/generateArchitectureAudit.ts |
| npm run architecture:commands | ACTIVE | node --import tsx src/studioArchitecture/generateCommandInventory.ts |
| npm run architecture:runtime | ACTIVE | node --import tsx src/studioArchitecture/generateRuntimeInventory.ts |
| npm run architecture:consolidation | ACTIVE | node --import tsx src/studioArchitecture/generateConsolidationPlan.ts |
| npm run architecture:operating-layer | ACTIVE | node --import tsx src/studioArchitecture/generateStudioOperatingLayer.ts |
| npm run testing:report | ACTIVE | node --import tsx src/testing/generateTestingReport.ts |
| npm run testing:coverage | ACTIVE | node --import tsx src/testing/generateCoveragePlan.ts |
| npm run testing:gates | ACTIVE | node --import tsx src/testing/generateQualityGateReport.ts |
| npm run os:dashboard | LEGACY | node --import tsx src/operatorDashboard/generateOperatorDashboard.ts |
| npm run os:today | LEGACY | node --import tsx src/operatorDashboard/generateTodayView.ts |
| npm run os:audit | LEGACY | node --import tsx src/osStabilization/generateSystemAudit.ts |
| npm run os:health | LEGACY | node --import tsx src/osStabilization/generateSystemHealth.ts |
| npm run os:release-check | LEGACY | node --import tsx src/releaseCandidate/generateReleaseCheck.ts |
| npm run os:v1-report | LEGACY | node --import tsx src/releaseCandidate/generateV1Report.ts |

## Archive Commands

| Command | Status | Script |
| --- | --- | --- |
| npm run archive:scan | ACTIVE | node --import tsx src/archiveManager/scanHistoricalArtifacts.ts |
| npm run archive:portfolio | ACTIVE | node --import tsx src/archiveManager/scanPortfolioArtifacts.ts |
| npm run archive:reports | ACTIVE | node --import tsx src/archiveManager/scanGeneratedReports.ts |
| npm run archive:temp | ACTIVE | node --import tsx src/archiveManager/scanTemporaryArtifacts.ts |
| npm run archive:examples | ACTIVE | node --import tsx src/archiveManager/scanExamples.ts |
| npm run archive:plan | ACTIVE | node --import tsx src/archiveManager/generateArchivePlan.ts |
| npm run archive:retention | ACTIVE | node --import tsx src/archiveManager/generateRetentionPolicy.ts |
| npm run archive:summary | ACTIVE | node --import tsx src/archiveManager/generateArchiveSummary.ts |

## Other Commands

| Command | Status | Script |
| --- | --- | --- |
| npm run test | ACTIVE | playwright test |
| npm run test:chromium | ACTIVE | playwright test --project=chromium |
| npm run test:ui | ACTIVE | playwright test playwright-framework/tests/ui |
| npm run test:api | ACTIVE | playwright test playwright-framework/tests/api |
| npm run test:ai | ACTIVE | playwright test playwright-framework/tests/ai |
| npm run test:headed | ACTIVE | playwright test --headed |
| npm run test:debug | ACTIVE | playwright test --debug |
| npm run report | ACTIVE | playwright show-report |
| npm run typecheck | ACTIVE | tsc --noEmit |
| npm run operator:qualify | LEGACY | tsx sales-marketing-engine/operator/scripts/qualifyLeads.ts |
| npm run operator:brief | LEGACY | tsx sales-marketing-engine/operator/scripts/generateDailySalesBrief.ts |
| npm run operator:messages | LEGACY | tsx sales-marketing-engine/operator/scripts/generateMessagesToSend.ts |
| npm run operator:proposals | LEGACY | tsx sales-marketing-engine/operator/scripts/generateProposalQueue.ts |
| npm run operator:followups | LEGACY | tsx sales-marketing-engine/operator/scripts/generateFollowUpsDue.ts |
| npm run operator:content | LEGACY | tsx sales-marketing-engine/operator/scripts/generateContentPack.ts |
| npm run operator:pipeline | LEGACY | tsx sales-marketing-engine/operator/scripts/generatePipelineSummary.ts |
| npm run operator:weekly | LEGACY | tsx sales-marketing-engine/operator/scripts/runWeeklyOperator.ts |
| npm run operator:daily | LEGACY | node --import tsx src/operator/generateDailyOperator.ts |
| npm run audit | ACTIVE | tsx apps/qa-audit-runner/src/cli/index.ts |
| npm run leads:seed | ACTIVE | tsx src/leads/seedLeads.ts |
| npm run day:plan | ACTIVE | node --import tsx src/dailyRevenueLoop/generateDayPlan.ts |
| npm run day:summary | DEPRECATED CANDIDATE | node --import tsx src/dailyRevenueLoop/generateDaySummary.ts |
| npm run week:review | DEPRECATED CANDIDATE | node --import tsx src/dailyRevenueLoop/generateWeekReview.ts |
| npm run web:lead-queries | ACTIVE | node --import tsx src/webLeadDiscovery/generateSearchQueries.ts |
| npm run web:lead-discovery | ACTIVE | node --import tsx src/webLeadDiscovery/runWebLeadDiscovery.ts |
| npm run web:lead-ranking | ACTIVE | node --import tsx src/webLeadDiscovery/rankWebDiscoveredLeads.ts |
| npm run web:pain-queries | ACTIVE | node --import tsx src/webPainMining/generatePainQueries.ts |
| npm run web:pain-mining | ACTIVE | node --import tsx src/webPainMining/runPainMining.ts |
| npm run web:pain-summary | DEPRECATED CANDIDATE | node --import tsx src/webPainMining/generatePainMiningSummary.ts |
| npm run web:lead-normalize | ACTIVE | node --import tsx src/webLeadQualification/generateNormalizedLeads.ts |
| npm run web:lead-classify | ACTIVE | node --import tsx src/webLeadQualification/generateLeadClassification.ts |
| npm run web:lead-qualify | ACTIVE | node --import tsx src/webLeadQualification/generateLeadQualification.ts |
| npm run web:qa-opportunity | ACTIVE | node --import tsx src/webLeadQualification/generateQaOpportunityScore.ts |
| npm run web:qualified-ranking | ACTIVE | node --import tsx src/webLeadQualification/generateQualifiedRanking.ts |
| npm run pain:research | ACTIVE | node --import tsx src/painIntelligence/generatePainResearch.ts |
| npm run pain:summary | DEPRECATED CANDIDATE | node --import tsx src/painIntelligence/generatePainSummary.ts |
| npm run site:intelligence | ACTIVE | node --import tsx src/siteIntelligence/generateSiteIntelligence.ts |
| npm run site:summary | DEPRECATED CANDIDATE | node --import tsx src/siteIntelligence/generateSiteSummary.ts |
| npm run opportunity:generate | ACTIVE | node --import tsx src/opportunityEngine/generateOpportunity.ts |
| npm run opportunity:summary | DEPRECATED CANDIDATE | node --import tsx src/opportunityEngine/generateOpportunitySummary.ts |
| npm run outreach:pack | ACTIVE | tsx src/outreachPack/generateOutreachPack.ts |
| npm run outreach:operating-pack | ACTIVE | tsx src/outreachOperating/generateOutreachOperatingPack.ts |
| npm run outreach:first-audit-path | ACTIVE | tsx src/outreachOperating/generateFirstAuditPath.ts |
| npm run contact:review | DEPRECATED CANDIDATE | tsx src/contactReview/generateContactReview.ts |
| npm run contact:update | ACTIVE | tsx src/contactReview/updateContactReview.ts |
| npm run pipeline:opportunities | ACTIVE | tsx src/pipeline/generateOpportunityTracker.ts |
| npm run pipeline:prioritize | ACTIVE | node --import tsx src/pipelinePrioritization/generatePipelinePrioritization.ts |
| npm run pipeline:next-actions | ACTIVE | tsx src/pipelinePrioritization/generatePipelineNextActions.ts |
| npm run commercial:summary | DEPRECATED CANDIDATE | node --import tsx src/commercialMode/commercialModeFilter.ts |
| npm run success:weekly | ACTIVE | tsx src/operator/generateWeeklySuccess.ts |
| npm run success:monthly | ACTIVE | tsx src/operator/generateMonthlySuccess.ts |
| npm run sow:generate | ACTIVE | node --import tsx src/proposalEngine/generateProposal.ts |
| npm run sow:portfolio | DEPRECATED CANDIDATE | node --import tsx src/proposalEngine/generatePortfolio.ts |
| npm run metrics:revenue | ACTIVE | tsx src/metrics/generateRevenueSummary.ts |
| npm run mac:daily | LEGACY | node --import tsx src/macAutomation/generateMacDaily.ts |
| npm run mac:summary | LEGACY | node --import tsx src/macAutomation/generateMacSummary.ts |
| npm run mac:lead-discovery-setup | LEGACY | node --import tsx src/dailyLeadDiscovery/generateMacLeadDiscoverySetup.ts |
| npm run cockpit | ACTIVE | node --import tsx src/cockpit/generateCockpit.ts |
| npm run content:from-audits | ACTIVE | tsx src/content/generateContentFromAudits.ts |
| npm run outreach:queue | ACTIVE | tsx src/outreachQueue/generateOutreachQueue.ts |
| npm run actions:cockpit | ACTIVE | tsx apps/lead-operator/src/cli/index.ts actions:cockpit |
| npm run message:optimize | ACTIVE | tsx apps/lead-operator/src/cli/index.ts message:optimize |
| npm run message:queue | ACTIVE | tsx apps/lead-operator/src/cli/index.ts message:queue |
| npm run message:review | DEPRECATED CANDIDATE | node --import tsx src/messageReview/generateMessageReview.ts |
| npm run message:pack | ACTIVE | node --import tsx src/messageReview/generateMessagePack.ts |
| npm run message:sent | ACTIVE | tsx apps/lead-operator/src/cli/index.ts message:sent |
| npm run sources:report | ACTIVE | tsx apps/lead-operator/src/cli/index.ts sources:report |
| npm run business:daily | ACTIVE | npm run lead:daily |
| npm run business:weekly | ACTIVE | tsx apps/lead-operator/src/cli/index.ts business:weekly |
| npm run dashboard | ACTIVE | node --import tsx src/dashboard/generateDashboard.ts |
| npm run client-readiness:pack | DEPRECATED CANDIDATE | node --import tsx src/clientReadiness/generateClientReadinessPack.ts |
| npm run first-audit:sales-pack | ACTIVE | tsx src/clientReadiness/generateFirstAuditSalesPack.ts |
| npm run proposal:center | DEPRECATED CANDIDATE | node --import tsx src/proposalCenter/generateProposalCenter.ts |
| npm run sow:center | DEPRECATED CANDIDATE | tsx src/proposalCenter/generateSowCenter.ts |
| npm run outreach:execute-pack | ACTIVE | tsx src/outreachExecution/generateOutreachExecutionPack.ts |
| npm run outreach:follow-up-plan | ACTIVE | tsx src/outreachExecution/generateFollowUpPlan.ts |
| npm run outreach:review | DEPRECATED CANDIDATE | node --import tsx src/outreachReview/generateOutreachReview.ts |
| npm run outreach:status | ACTIVE | node --import tsx src/outreachTracking/generateOutreachStatus.ts |
| npm run contact:decision | ACTIVE | node --import tsx src/outreachReview/generateContactDecision.ts |
| npm run first-audit:workflow | ACTIVE | node --import tsx src/firstAuditWorkflow/generateFirstAuditWorkflow.ts |
| npm run first-audit:kickoff | ACTIVE | tsx src/firstAuditWorkflow/generateAuditKickoff.ts |
| npm run first-client:path | ACTIVE | node --import tsx src/firstRevenueValidation/generateFirstClientPath.ts |
| npm run cockpit:daily | ACTIVE | node --import tsx src/actionCockpit/generateActionCockpit.ts |
| npm run cockpit:approve | ACTIVE | node --import tsx src/actionCockpit/generateApprovalQueue.ts |
| npm run executive:summary | DEPRECATED CANDIDATE | node --import tsx src/executiveLayer/generateExecutiveSummary.ts |
| npm run executive:portfolio | DEPRECATED CANDIDATE | node --import tsx src/executiveLayer/generateExecutivePortfolio.ts |
| npm run executive:risk | ACTIVE | node --import tsx src/executiveLayer/generateBusinessRisk.ts |
| npm run executive:roadmap | ACTIVE | node --import tsx src/executiveLayer/generatePriorityRoadmap.ts |
| npm run execute:first-client | ACTIVE | node --import tsx src/executionPack/generateFirstRevenueChecklist.ts |
| npm run execute:decision-board | ACTIVE | node --import tsx src/executionPack/generateDecisionBoard.ts |
| npm run execute:outreach-review | DEPRECATED CANDIDATE | node --import tsx src/executionPack/generateOutreachReview.ts |
| npm run ux:today | LEGACY | node --import tsx src/commercialUx/generateTodayFocus.ts |
| npm run ux:hero | LEGACY | node --import tsx src/commercialUx/generateRevenueHero.ts |
| npm run ux:priorities | LEGACY | node --import tsx src/commercialUx/generatePriorityCards.ts |
| npm run ux:operator | LEGACY | node --import tsx src/commercialUx/generateOperatorView.ts |
| npm run validate:business | ACTIVE | tsx apps/lead-operator/src/cli/validateBusiness.ts |


## Stability Boundary
- Studio v1 remains local-only and human-approved.
- Release Manager generates documentation and validation evidence only.
- No business workflow, command, data source, database, integration, or commercial rule is modified.
- No outreach, messages, meetings, invoices, payments, revenue, or outcomes are created.
