const state = {
  data: null,
};

const text = (value) => String(value ?? '');

async function loadDashboard() {
  try {
    const response = await fetch('dashboard.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Dashboard data unavailable: ${response.status}`);
    state.data = await response.json();
    render(state.data);
  } catch (error) {
    renderError(error);
  }
}

function render(data) {
  setText('dashboardStatus', data.mode === 'read-only' ? 'Read Only' : 'Review');
  setText('lastUpdate', compactDate(data.generatedAt));
  setText('totalLeads', data.leads.totalLeads);

  renderCommercialUx(data.commercialUx);
  renderActions(data.today.topActions);
  renderRevenue(data.revenue);
  renderRevenueActivation(data.revenueActivation);
  renderLeadIntelligence(data.leadIntelligence);
  renderDailyLeadDiscovery(data.dailyLeadDiscovery);
  renderWebDiscovery(data.webDiscovery);
  renderLeadQualification(data.leadQualification);
  renderAutonomousRunner(data.autonomousRunner);
  renderRevenueIntelligence(data.revenueIntelligence);
  renderOperatorMode(data.operatorMode);
  renderMobileCommandCenterSummary(data.mobileCommandCenterSummary);
  renderArchitecture(data.architecture);
  renderTesting(data.testing);
  renderWebIntelligence(data.webIntelligence);
  renderEvidenceEngine(data.evidenceEngine);
  renderEvidencePro(data.evidencePro);
  renderClientDelivery(data.clientDelivery);
  renderAutomationDelivery(data.automationDelivery);
  renderDeliveryAssets(data.deliveryAssets);
  renderRetainerOperations(data.retainerOperations);
  renderRevenueLearning(data.revenueLearning);
  renderRevenueMode(data.revenueMode);
  renderCommercialConsistency(data.commercialConsistency);
  renderArchive(data.archive);
  renderReleaseV1(data.release);
  renderStudioDoctor(data.studioDoctor);
  renderExecutionPack(data.executionPack);
  renderOutcomeTracking(data.outcomeTracking);
  renderFollowUpEngine(data.followUpEngine);
  renderWinLossIntelligence(data.winLossIntelligence);
  renderStudioSnapshot(data.studioSnapshot);
  renderStudio(data.studio);
  renderLeads(data.leads.highestOpportunityScores);
  renderOutreach(data.outreach);
  renderAudits(data.audits);
  renderProposals(data.proposals);
  renderMobileCenters(data.mobileCommandCenter);
  renderHealth(data.systemHealth);
}

function renderCommercialUx(commercial) {
  if (!commercial) {
    setText('heroTarget', 'Not loaded');
    setText('heroOffer', 'Not loaded');
    setText('heroValue', 'Not loaded');
    setText('heroPriority', 'Not loaded');
    setText('heroDecision', 'Not loaded');
    setText('heroNextAction', 'Commercial UX data not loaded.');
    return;
  }

  setText('heroTarget', commercial.target);
  setText('heroOffer', commercial.offer);
  setText('heroValue', commercial.potentialValue);
  setText('heroPriority', commercial.priority);
  setText('heroDecision', commercial.decision);
  setText('heroNextAction', commercial.nextAction);
}

function renderActions(actions) {
  const container = byId('topActions');
  container.innerHTML = actions.map((action) => `
    <article class="action-card">
      <div class="card-head">
        <span class="priority">${escapeHtml(action.priority)}</span>
        <h3>${escapeHtml(action.title)}</h3>
      </div>
      <p>${escapeHtml(action.estimatedImpact)}</p>
      <p>${escapeHtml(action.nextStep)}</p>
    </article>
  `).join('');
}

function renderRevenue(revenue) {
  const items = [
    ['Best Audit', revenue.bestAuditOpportunity],
    ['Best Starter Pack', revenue.bestStarterPackOpportunity],
    ['Best Retainer', revenue.bestRetainerOpportunity],
  ];
  byId('revenueCards').innerHTML = items.map(([label, value]) => miniCard(label, value)).join('');
}

function renderRevenueActivation(activation) {
  if (!activation) {
    byId('activationCards').innerHTML = miniCard('Revenue Activation', 'Not loaded');
    return;
  }

  byId('activationCards').innerHTML = [
    miniCard('Revenue Activation', activation.revenueActivation),
    miniCard('First Client Goal', activation.firstClientGoal),
    miniCard('First Retainer Goal', activation.firstRetainerGoal),
    miniCard('Top Revenue Target', `${activation.topRevenueTarget} (${activation.topActivationScore}/100)`),
    miniCard('Top Revenue Action', activation.topRevenueAction),
  ].join('');
}

function renderLeadIntelligence(intelligence) {
  if (!intelligence) {
    byId('leadIntelligenceCards').innerHTML = miniCard('Best Lead', 'Not loaded');
    return;
  }

  byId('leadIntelligenceCards').innerHTML = [
    miniCard('Best Lead', intelligence.bestLead),
    miniCard('Best Offer', intelligence.bestOffer),
    miniCard('Highest Opportunity Score', `${intelligence.highestOpportunityScore}/100`),
    miniCard('Fastest Revenue Path', intelligence.fastestRevenuePath),
    miniCard('Recommended Next Action', intelligence.recommendedNextAction),
  ].join('');
}

function renderDailyLeadDiscovery(discovery) {
  if (!discovery) {
    byId('dailyLeadDiscoveryCards').innerHTML = miniCard('New Leads Today', 'Not loaded');
    return;
  }

  byId('dailyLeadDiscoveryCards').innerHTML = [
    miniCard('New Leads Today', discovery.newLeadsToday),
    miniCard('Top New Lead', discovery.topNewLead),
    miniCard('Top 5 Leads', discovery.topFiveLeads),
    miniCard('Best Offer', discovery.bestOffer),
    miniCard('Recommended Next Action', discovery.recommendedNextAction),
  ].join('');
}

function renderWebDiscovery(discovery) {
  if (!discovery) {
    byId('webDiscoveryCards').innerHTML = miniCard('New Web Leads', 'Not loaded');
    return;
  }

  byId('webDiscoveryCards').innerHTML = [
    miniCard('New Leads Today', discovery.newLeadsToday),
    miniCard('New Pain Signals', discovery.newPainSignals),
    miniCard('Top Opportunity', discovery.topOpportunity),
    miniCard('Best New Lead', discovery.bestNewLead),
    miniCard('Lead Source', discovery.leadSource),
    miniCard('Discovery Date', discovery.discoveryDate),
    miniCard('New Web Leads', discovery.newWebLeads),
    miniCard('Top Web Lead', discovery.topWebLead),
    miniCard('Top Pain Signal', discovery.topPainSignal),
    miniCard('Best New QA Opportunity', discovery.bestNewQaOpportunity),
    miniCard('Recommended Research Action', discovery.recommendedResearchAction),
  ].join('');
}

function renderLeadQualification(qualification) {
  if (!qualification) {
    byId('leadQualificationCards').innerHTML = miniCard('Best Qualified Lead', 'Not loaded');
    return;
  }

  byId('leadQualificationCards').innerHTML = [
    miniCard('Best Qualified Lead', qualification.bestQualifiedLead),
    miniCard('Best Category', qualification.bestCategory),
    miniCard('Highest QA Opportunity', qualification.highestQaOpportunity),
    miniCard('Recommended Offer', qualification.recommendedOffer),
    miniCard('Qualified Leads Count', qualification.qualifiedLeadsCount),
  ].join('');
}

function renderAutonomousRunner(runner) {
  if (!runner) {
    byId('autonomousRunnerCards').innerHTML = miniCard('Autonomous Runner Status', 'Not loaded');
    return;
  }

  byId('autonomousRunnerCards').innerHTML = [
    miniCard('Autonomous Runner Status', runner.autonomousRunnerStatus),
    miniCard('Last Successful Run', runner.lastSuccessfulRun),
    miniCard('Next Scheduled Run', runner.nextScheduledRun),
    miniCard('Runner Health', runner.runnerHealth),
    miniCard('Daily Refresh Status', runner.dailyRefreshStatus),
  ].join('');
}

function renderRevenueIntelligence(intelligence) {
  if (!intelligence) {
    byId('revenueIntelligenceCards').innerHTML = miniCard('Revenue Intelligence Status', 'Not loaded');
    return;
  }

  byId('revenueIntelligenceCards').innerHTML = [
    miniCard('Revenue Intelligence Status', intelligence.revenueIntelligenceStatus),
    miniCard('Commercial Lead', intelligence.currentTopLead),
    miniCard('Actionable Lead', intelligence.actionableLead),
    miniCard('Commercial Readiness', intelligence.commercialReadiness),
    miniCard('Evidence Blockers', intelligence.evidenceBlockers),
    miniCard('Rotation Status', intelligence.rotationStatus),
    miniCard('Revenue Target', intelligence.revenueTarget),
    miniCard('Recommended Offer', intelligence.recommendedOffer),
    miniCard('Execution Priority', intelligence.executionPriority),
  ].join('');
}

function renderOperatorMode(operatorMode) {
  if (!operatorMode) {
    byId('operatorModeCards').innerHTML = miniCard('Top Lead', 'Not loaded');
    return;
  }

  byId('operatorModeCards').innerHTML = [
    miniCard('Top Lead', operatorMode.topLead),
    miniCard('Top Offer', operatorMode.topOffer),
    miniCard('Top Action', operatorMode.topAction),
    miniCard('Studio Status', operatorMode.studioStatus),
    miniCard('Today At A Glance', operatorMode.todayAtAGlance),
  ].join('');
}

function renderMobileCommandCenterSummary(mobile) {
  if (!mobile) {
    byId('mobileCommandCenterCards').innerHTML = miniCard('Top Lead', 'Not loaded');
    return;
  }

  byId('mobileCommandCenterCards').innerHTML = [
    miniCard('Top Lead', mobile.topLead),
    miniCard('Top Offer', mobile.topOffer),
    miniCard('Top Action', mobile.topAction),
    miniCard('Follow Ups Waiting', mobile.followUpsWaiting),
    miniCard('Open Opportunities', mobile.openOpportunities),
    miniCard('Studio Status', mobile.studioStatus),
    miniCard('Runtime Health', mobile.runtimeHealth),
    miniCard('Architecture Status', mobile.architectureStatus),
    miniCard('Revenue Status', mobile.revenueStatus),
    miniCard('Today At A Glance', mobile.todayAtAGlance),
  ].join('');
}

function renderWebIntelligence(intelligence) {
  if (!intelligence) {
    byId('webIntelligenceCards').innerHTML = miniCard('Intelligence Quality', 'Not loaded');
    return;
  }

  byId('webIntelligenceCards').innerHTML = [
    miniCard('Intelligence Quality', intelligence.intelligenceQuality),
    miniCard('Evidence Confidence', intelligence.evidenceConfidence),
    miniCard('Company Confidence', intelligence.companyConfidence),
    miniCard('False Positive Risk', intelligence.falsePositiveRisk),
    miniCard('Accepted Evidence', intelligence.acceptedEvidence),
    miniCard('Suspicious Evidence', intelligence.suspiciousEvidence),
    miniCard('Rejected Evidence', intelligence.rejectedEvidence),
  ].join('');
}

function renderEvidenceEngine(evidence) {
  if (!evidence) {
    byId('evidenceEngineCards').innerHTML = miniCard('Evidence Status', 'Not loaded');
    return;
  }

  byId('evidenceEngineCards').innerHTML = [
    miniCard('Evidence Status', evidence.evidenceStatus),
    miniCard('Lighthouse Status', evidence.lighthouseStatus),
    miniCard('Screenshot Status', evidence.screenshotStatus),
    miniCard('Readiness Status', evidence.readinessStatus),
    miniCard('Page Status', evidence.pageStatus),
    miniCard('Flow Status', evidence.flowStatus),
    miniCard('Commercial Readiness', evidence.commercialReadiness),
  ].join('');
}

function renderClientDelivery(clientDelivery) {
  if (!clientDelivery) {
    byId('clientDeliveryCards').innerHTML = miniCard('Client Status', 'Not loaded');
    return;
  }

  byId('clientDeliveryCards').innerHTML = [
    miniCard('Client', clientDelivery.clientName),
    miniCard('Client Status', clientDelivery.clientStatus),
    miniCard('Selected Package', clientDelivery.selectedPackage),
    miniCard('Delivery Readiness', clientDelivery.deliveryReadiness),
    miniCard('Delivery Status', clientDelivery.deliveryStatus),
    miniCard('Next Delivery Action', clientDelivery.nextDeliveryAction),
  ].join('');
}

function renderEvidencePro(evidence) {
  if (!evidence) {
    byId('evidenceProCards').innerHTML = miniCard('Evidence Package Status', 'Not loaded');
    return;
  }

  byId('evidenceProCards').innerHTML = [
    miniCard('Evidence Package Status', evidence.evidencePackageStatus),
    miniCard('Performance Status', evidence.performanceStatus),
    miniCard('Trace Status', evidence.traceStatus),
    miniCard('Video Status', evidence.videoStatus),
  ].join('');
}

function renderAutomationDelivery(automation) {
  if (!automation) {
    byId('automationDeliveryCards').innerHTML = miniCard('Automation Status', 'Not loaded');
    return;
  }

  byId('automationDeliveryCards').innerHTML = [
    miniCard('Automation Status', automation.automationStatus),
    miniCard('Critical Flows', automation.criticalFlowCount),
    miniCard('Delivery Assets', automation.deliveryAssets),
    miniCard('Framework Status', automation.frameworkStatus),
    miniCard('Client Handoff Status', automation.clientHandoffStatus),
    miniCard('Delivery Status', automation.deliveryStatus),
  ].join('');
}

function renderRetainerOperations(retainer) {
  if (!retainer) {
    byId('retainerOperationsCards').innerHTML = miniCard('Retainer Status', 'Not loaded');
    return;
  }

  byId('retainerOperationsCards').innerHTML = [
    miniCard('Retainer Status', retainer.retainerStatus),
    miniCard('Client Health', retainer.clientHealth),
    miniCard('Coverage Status', retainer.coverageStatus),
    miniCard('Maintenance Status', retainer.maintenanceStatus),
    miniCard('Renewal Status', retainer.renewalStatus),
    miniCard('Expansion Opportunities', retainer.expansionOpportunities),
  ].join('');
}

function renderDeliveryAssets(assets) {
  if (!assets) {
    byId('deliveryAssetsCards').innerHTML = miniCard('Delivery Assets Status', 'Not loaded');
    return;
  }

  byId('deliveryAssetsCards').innerHTML = [
    miniCard('Delivery Assets Status', assets.deliveryAssetsStatus),
    miniCard('Executive Report Status', assets.executiveReportStatus),
    miniCard('Coverage Matrix Status', assets.coverageMatrixStatus),
    miniCard('Timeline Status', assets.timelineStatus),
    miniCard('Onboarding Status', assets.onboardingStatus),
    miniCard('Bundle Status', assets.bundleStatus),
  ].join('');
}

function renderRevenueLearning(learning) {
  if (!learning) {
    byId('revenueLearningCards').innerHTML = miniCard('Revenue Learning Status', 'Not loaded');
    return;
  }

  byId('revenueLearningCards').innerHTML = [
    miniCard('Revenue Learning Status', learning.revenueLearningStatus),
    miniCard('Outcomes Recorded', learning.outcomesRecorded),
    miniCard('Best Channel', learning.bestChannel),
    miniCard('Best Offer', learning.bestOffer),
    miniCard('Best Industry', learning.bestIndustry),
    miniCard('Calibration Status', learning.calibrationStatus),
    miniCard('Recommendation Confidence', learning.recommendationConfidence),
  ].join('');
}

function renderRevenueMode(revenueMode) {
  if (!revenueMode) {
    byId('revenueModeCards').innerHTML = miniCard('Revenue Mode Status', 'Not loaded');
    return;
  }

  byId('revenueModeCards').innerHTML = [
    miniCard('Revenue Mode Status', revenueMode.revenueModeStatus),
    miniCard('Morning Brief', revenueMode.morningBrief),
    miniCard("Today's Top Action", revenueMode.todaysTopAction),
    miniCard('Revenue Goal', revenueMode.revenueGoal),
    miniCard('Priority Queue', revenueMode.priorityQueue),
    miniCard('Follow Ups Waiting', revenueMode.followUpsWaiting),
    miniCard('Biggest Bottleneck', revenueMode.biggestBottleneck),
    miniCard('Tomorrow Focus', revenueMode.tomorrowFocus),
  ].join('');
}

function renderCommercialConsistency(consistency) {
  if (!consistency) {
    byId('commercialConsistencyCards').innerHTML = miniCard('Commercial Consistency Status', 'Not loaded');
    return;
  }

  byId('commercialConsistencyCards').innerHTML = [
    miniCard('Commercial Consistency Status', consistency.commercialConsistencyStatus),
    miniCard('Legacy References', consistency.legacyReferences),
    miniCard('Source Of Truth Status', consistency.sourceOfTruthStatus),
    miniCard('Conflicting References', consistency.conflictingReferences),
    miniCard('Repair Recommendations', consistency.repairRecommendations),
  ].join('');
}

function renderArchive(archive) {
  if (!archive) {
    byId('archiveCards').innerHTML = miniCard('Archive Status', 'Not loaded');
    return;
  }

  byId('archiveCards').innerHTML = [
    miniCard('Archive Status', archive.archiveStatus),
    miniCard('Historical Artifacts', archive.historicalArtifacts),
    miniCard('Portfolio Assets', archive.portfolioAssets),
    miniCard('Temporary Assets', archive.temporaryAssets),
    miniCard('Retention Status', archive.retentionStatus),
    miniCard('Archive Score', archive.archiveScore),
  ].join('');
}

function renderReleaseV1(release) {
  if (!release) {
    byId('releaseV1Cards').innerHTML = miniCard('Release Status', 'Not loaded');
    return;
  }

  byId('releaseV1Cards').innerHTML = [
    miniCard('Studio Version', release.studioVersion),
    miniCard('Release Status', release.releaseStatus),
    miniCard('Revenue Mode Status', release.revenueModeStatus),
    miniCard('Validation Status', release.validationStatus),
  ].join('');
}

function renderStudioDoctor(doctor) {
  if (!doctor) {
    byId('studioDoctorCards').innerHTML = miniCard('Doctor Status', 'Not loaded');
    return;
  }

  byId('studioDoctorCards').innerHTML = [
    miniCard('Studio Health', doctor.studioHealth),
    miniCard('Command Health', doctor.commandHealth),
    miniCard('Runtime Health', doctor.runtimeHealth),
    miniCard('Evidence Health', doctor.evidenceHealth),
    miniCard('Doctor Status', doctor.doctorStatus),
    miniCard('Repair Recommendations', doctor.repairRecommendations),
  ].join('');
}

function renderTesting(testing) {
  if (!testing) {
    byId('testingCards').innerHTML = miniCard('Testing Status', 'Not loaded');
    return;
  }

  byId('testingCards').innerHTML = [
    miniCard('Testing Status', testing.testingStatus),
    miniCard('Coverage Status', testing.coverageStatus),
    miniCard('Quality Gate Status', testing.qualityGateStatus),
    miniCard('CI Status', testing.ciStatus),
    miniCard('Skipped Tests', testing.skippedTests),
    miniCard('Missing Categories', testing.missingCategories),
  ].join('');
}

function renderArchitecture(architecture) {
  if (!architecture) {
    byId('architectureCards').innerHTML = miniCard('Architecture Status', 'Not loaded');
    return;
  }

  byId('architectureCards').innerHTML = [
    miniCard('Architecture Status', architecture.architectureStatus),
    miniCard('Command Health', `${architecture.commandHealth} (${architecture.commandsAudited} commands)`),
    miniCard('Runtime Health', `${architecture.runtimeHealth} (${architecture.runtimeFiles} files)`),
    miniCard('Consolidation Progress', architecture.consolidationProgress),
    miniCard('Duplicate Commands', architecture.duplicateCommandGroups),
    miniCard('Legacy Commands', architecture.legacyCommands),
    miniCard('Candidate Deprecations', architecture.candidateDeprecations),
    miniCard('Duplicate Runtime Candidates', architecture.duplicateRuntimeCandidates),
    miniCard('Source Of Truth Authorities', architecture.sourceOfTruthAuthorities),
  ].join('');
}

function renderExecutionPack(execution) {
  if (!execution) {
    byId('executionCards').innerHTML = miniCard('First Revenue Status', 'Not loaded');
    return;
  }

  byId('executionCards').innerHTML = [
    miniCard('First Revenue Status', execution.firstRevenueStatus),
    miniCard('Go / No Go', execution.goNoGo),
    miniCard('Remaining Blockers', execution.remainingBlockers),
    miniCard('Next Manual Action', execution.nextManualAction),
    miniCard('Estimated Value', execution.estimatedRevenueValue),
    miniCard('Confidence', `${execution.estimatedConfidenceScore}/100`),
  ].join('');
}

function renderOutcomeTracking(outcomes) {
  if (!outcomes) {
    byId('outcomeTrackingCards').innerHTML = miniCard('Outcome Tracking', 'No outcomes recorded yet.');
    return;
  }

  byId('outcomeTrackingCards').innerHTML = [
    miniCard('Outcome Tracking', outcomes.status),
    miniCard('Messages Sent', outcomes.messagesSent),
    miniCard('Replies', outcomes.replies),
    miniCard('Meetings', outcomes.meetings),
    miniCard('Proposals', outcomes.proposals),
    miniCard('Wins', outcomes.wins),
    miniCard('Losses', outcomes.losses),
    miniCard('Reply Rate', outcomes.replyRate),
    miniCard('Next Manual Message', outcomes.nextManualMessage),
  ].join('');
}

function renderFollowUpEngine(followUps) {
  if (!followUps) {
    byId('followUpOperatingCards').innerHTML = miniCard('Follow-Up Queue', 'Not loaded');
    return;
  }

  byId('followUpOperatingCards').innerHTML = [
    miniCard('Follow-Up Queue', followUps.followUpQueue),
    miniCard("Today's Follow-Ups", followUps.todaysFollowUps),
    miniCard('Waiting Responses', followUps.waitingResponses),
    miniCard('Open Opportunities', followUps.openOpportunities),
    miniCard('Next Best Action', followUps.nextBestAction),
  ].join('');
}

function renderWinLossIntelligence(winLoss) {
  if (!winLoss) {
    byId('winLossCards').innerHTML = miniCard('Win Rate', 'Insufficient outcome history.');
    return;
  }

  byId('winLossCards').innerHTML = [
    miniCard('Win Rate', winLoss.winRate),
    miniCard('Reply Rate', winLoss.replyRate),
    miniCard('Best Offer', winLoss.bestOffer),
    miniCard('Best Segment', winLoss.bestSegment),
    miniCard('Top Learning', winLoss.topLearning),
    miniCard('Top Recommendation', winLoss.topRecommendation),
  ].join('');
}

function renderStudioSnapshot(snapshot) {
  if (!snapshot) {
    byId('snapshotCards').innerHTML = miniCard('Snapshot Status', 'Missing');
    return;
  }

  byId('snapshotCards').innerHTML = [
    miniCard('Studio Version', snapshot.studioVersion),
    miniCard('Snapshot Status', snapshot.snapshotStatus),
    miniCard('Recovery Status', snapshot.recoveryStatus),
    miniCard('Last Snapshot', snapshot.lastSnapshot),
  ].join('');
}

function renderStudio(studio) {
  if (!studio) {
    byId('studioCards').innerHTML = miniCard('Studio Health', 'Not loaded');
    byId('releaseCards').innerHTML = miniCard('Release Readiness', 'Not loaded');
    return;
  }

  byId('studioCards').innerHTML = [
    miniCard('Studio Health', studio.studioHealth),
    miniCard('System Status', studio.systemStatus),
    miniCard('Current MRR', `$${Number(studio.currentMrr || 0).toLocaleString('en-US')}`),
    miniCard('Warnings', studio.warnings),
  ].join('');

  byId('releaseCards').innerHTML = [
    miniCard('Release Readiness', studio.releaseReadiness),
    miniCard('Critical Issues', studio.criticalIssues),
    miniCard('Ready For Outreach', studio.readyForOutreach),
    miniCard('Ready For Audit Sales', studio.readyForAuditSales),
    miniCard('Ready For Retainers', studio.readyForRetainers),
    miniCard('Ready For Client Delivery', studio.readyForClientDelivery),
  ].join('');
}

function renderLeads(leads) {
  byId('leadCards').innerHTML = leads.map((lead) => miniCard(`${lead.companyName} (${lead.score}/100)`, lead.detail)).join('');
}

function renderOutreach(outreach) {
  const items = [
    ['Invitations', outreach.invitationsSent],
    ['Messages', outreach.messagesSent],
    ['Connected', outreach.connected],
    ['Replies', outreach.replies],
    ['Due', outreach.followUpsDue],
  ];
  byId('outreachStats').innerHTML = items.map(([label, value]) => stat(label, value)).join('');
}

function renderAudits(audits) {
  const items = [
    ['Reports', audits.auditReportsGenerated],
    ['Unified', audits.unifiedAudits],
    ['Evidence', audits.evidenceAvailable],
  ];
  byId('auditStats').innerHTML = items.map(([label, value]) => stat(label, value)).join('');
}

function renderProposals(proposals) {
  const ready = proposals.proposalReady.length ? proposals.proposalReady.join(', ') : 'None';
  const review = proposals.needsReview.length ? proposals.needsReview.slice(0, 3).join(' | ') : 'None';
  const retainers = proposals.retainerCandidates.length ? proposals.retainerCandidates.join(' | ') : 'None';
  byId('proposalCards').innerHTML = [
    miniCard('Proposal Ready', ready),
    miniCard('Needs Review', review),
    miniCard('Retainer Candidates', retainers),
  ].join('');
}

function renderHealth(health) {
  byId('healthCards').innerHTML = [
    miniCard('Last Update', compactDate(health.lastUpdate)),
    miniCard('Lead Research', health.leadResearchStatus),
    miniCard('Evidence', health.evidenceStatus),
    miniCard('Proposal', health.proposalStatus),
    miniCard('Dashboard', health.dashboardStatus),
  ].join('');
}

function renderMobileCenters(center) {
  if (!center) return;

  const reviewItems = [
    ['Audits Ready', center.reviewCenter.auditsReady],
    ['Proposals Ready', center.reviewCenter.proposalsReady],
    ['Evidence Ready', center.reviewCenter.evidenceReady],
    ['Follow-Ups Ready', center.reviewCenter.followUpsReady],
  ];
  byId('reviewCenterStats').innerHTML = reviewItems.map(([label, value]) => stat(label, value)).join('');

  byId('revenueCenterCards').innerHTML = [
    miniCard('Best Audit Opportunity', center.revenueCenter.bestAuditOpportunity),
    miniCard('Best Starter Pack', center.revenueCenter.bestStarterPackOpportunity),
    miniCard('Best Retainer', center.revenueCenter.bestRetainerOpportunity),
    miniCard('Highest Priority', center.revenueCenter.highestRevenuePriority),
  ].join('');

  byId('mobileActionQueue').innerHTML = center.actionQueue.map((action) => `
    <article class="mini-card touch-card">
      <span class="tag">Priority ${escapeHtml(action.priority)}</span>
      <h3>${escapeHtml(action.title)}</h3>
      <p><strong>Reason:</strong> ${escapeHtml(action.whyItMatters)}</p>
      <p><strong>Impact:</strong> ${escapeHtml(action.estimatedImpact)}</p>
      <p><strong>Recommended Action:</strong> ${escapeHtml(action.nextStep)}</p>
    </article>
  `).join('');

  byId('auditCenterCards').innerHTML = [
    miniCard('Audit Reports Available', center.auditCenter.auditReportsAvailable),
    miniCard('Unified Audits Available', center.auditCenter.unifiedAuditsAvailable),
    miniCard('Evidence Available', center.auditCenter.evidenceAvailable),
    miniCard('Audit Readiness', center.auditCenter.auditReadiness),
    linkCard('Audit Report Links', center.auditCenter.links),
  ].join('');

  byId('proposalCenterCards').innerHTML = [
    linkCard('Proposal PDFs', center.proposalCenter.proposalPdfs),
    miniCard('Proposal Status', center.proposalCenter.proposalStatus.join(' | ') || 'None'),
    miniCard('Retainer Candidates', center.proposalCenter.retainerCandidates.join(' | ') || 'None'),
  ].join('');

  byId('followUpCenterCards').innerHTML = [
    miniCard('Follow-Ups Due', center.followUpCenter.followUpsDue),
    miniCard('Outreach Status', center.followUpCenter.outreachStatus),
    miniCard('Contact Status', center.followUpCenter.contactStatus),
    linkCard('Tracking Links', center.followUpCenter.links),
  ].join('');
}

function renderError(error) {
  setText('dashboardStatus', 'Data Missing');
  byId('topActions').innerHTML = `
    <article class="action-card">
      <div class="card-head">
        <span class="priority">!</span>
        <h3>Dashboard data not loaded</h3>
      </div>
      <p>${escapeHtml(error.message)}</p>
    </article>
  `;
}

function stat(label, value) {
  return `<div class="stat"><span class="metric-label">${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function miniCard(label, value) {
  return `<article class="mini-card"><span class="tag">${escapeHtml(label)}</span><p>${escapeHtml(value)}</p></article>`;
}

function linkCard(label, links) {
  const body = links && links.length
    ? `<div class="link-list">${links.map((link) => `<a class="touch-link" href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join('')}</div>`
    : '<p>None available</p>';
  return `<article class="mini-card"><span class="tag">${escapeHtml(label)}</span>${body}</article>`;
}

function compactDate(value) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return text(value);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = text(value);
}

function byId(id) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element: ${id}`);
  return element;
}

function escapeHtml(value) {
  return text(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

loadDashboard();
