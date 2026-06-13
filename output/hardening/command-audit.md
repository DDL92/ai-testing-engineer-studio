# Command Audit

Generated: 2026-06-13T20:20:46.579Z

| Command | Status | Detail | Script |
| --- | --- | --- | --- |
| studio:health | Ready | Script target exists: src/studioConsolidation/generateStudioHealth.ts | node --import tsx src/studioConsolidation/generateStudioHealth.ts |
| studio:summary | Ready | Script target exists: src/studioConsolidation/generateStudioSummary.ts | node --import tsx src/studioConsolidation/generateStudioSummary.ts |
| studio:release-check | Ready | Script target exists: src/studioConsolidation/generateReleaseCheck.ts | node --import tsx src/studioConsolidation/generateReleaseCheck.ts |
| studio:hardening | Ready | Script target exists: src/studioHardening/generateHardeningReport.ts | node --import tsx src/studioHardening/generateHardeningReport.ts |
| studio:monday-checklist | Ready | Script target exists: src/studioHardening/generateMondayLaunchChecklist.ts | node --import tsx src/studioHardening/generateMondayLaunchChecklist.ts |
| studio:command-audit | Ready | Script target exists: src/studioHardening/generateCommandAudit.ts | node --import tsx src/studioHardening/generateCommandAudit.ts |
| studio:output-audit | Ready | Script target exists: src/studioHardening/generateOutputAudit.ts | node --import tsx src/studioHardening/generateOutputAudit.ts |
| dashboard:generate | Ready | Script target exists: src/dashboard/generateDashboard.ts | node --import tsx src/dashboard/generateDashboard.ts |
| dashboard:mobile | Ready | Script target exists: src/dashboard/generateDashboard.ts | node --import tsx src/dashboard/generateDashboard.ts --mobile |
| revenue:focus | Ready | Script target exists: src/revenueActivation/generateRevenueFocus.ts | node --import tsx src/revenueActivation/generateRevenueFocus.ts |
| day:plan | Ready | Script target exists: src/dailyRevenueLoop/generateDayPlan.ts | node --import tsx src/dailyRevenueLoop/generateDayPlan.ts |
| execute:first-client | Ready | Script target exists: src/executionPack/generateFirstRevenueChecklist.ts | node --import tsx src/executionPack/generateFirstRevenueChecklist.ts |
| execute:decision-board | Ready | Script target exists: src/executionPack/generateDecisionBoard.ts | node --import tsx src/executionPack/generateDecisionBoard.ts |
| message:pack | Ready | Script target exists: src/messageReview/generateMessagePack.ts | node --import tsx src/messageReview/generateMessagePack.ts |
| message:review | Ready | Script target exists: src/messageReview/generateMessageReview.ts | node --import tsx src/messageReview/generateMessageReview.ts |
| outcome:add | Ready | Script target exists: src/outcomeTracking/addOutcome.ts | node --import tsx src/outcomeTracking/addOutcome.ts |
| outcome:dashboard | Ready | Script target exists: src/outcomeTracking/generateOutcomeDashboard.ts | node --import tsx src/outcomeTracking/generateOutcomeDashboard.ts |
| followup:queue | Ready | Script target exists: src/followUpEngine/generateFollowUpQueue.ts | node --import tsx src/followUpEngine/generateFollowUpQueue.ts |
| followup:daily | Ready | Script target exists: src/followUpEngine/generateDailyFollowUpPlan.ts | node --import tsx src/followUpEngine/generateDailyFollowUpPlan.ts |
| winloss:analysis | Ready | Script target exists: src/winLossEngine/generateWinLossAnalysis.ts | node --import tsx src/winLossEngine/generateWinLossAnalysis.ts |
| winloss:strategy | Ready | Script target exists: src/winLossEngine/generateStrategyRecommendations.ts | node --import tsx src/winLossEngine/generateStrategyRecommendations.ts |
| typecheck | Ready | Command is configured. | tsc --noEmit |
| test | Ready | Command is configured. | playwright test |

## Note
This audit verifies package script wiring and local source targets. Runtime validation is handled by the explicit validation commands.
