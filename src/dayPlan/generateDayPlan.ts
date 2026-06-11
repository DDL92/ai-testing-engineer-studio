import fs = require('fs');
import path = require('path');
import { renderFirst50ProgressLines, writeFirst50ProgressReport } from '../first50/first50Progress';
import { readLeads } from '../leads/leadStore';
import { buildTopDailyActions, isActionableLead } from './dayPlanRules';
import { DailyPlan, DailyPlanAction } from './types';

const outputPath = path.join(process.cwd(), 'output', 'day-plan.md');

function generateDayPlan(): void {
  const leads = readLeads();
  const date = new Date().toISOString().slice(0, 10);
  const actions = buildTopDailyActions(leads, 5);
  const activeLeads = leads.filter(isActionableLead);
  const first50Progress = writeFirst50ProgressReport(leads);
  const plan: DailyPlan = {
    date,
    summary: {
      date,
      totalLeads: leads.length,
      activeLeads: activeLeads.length,
      excludedLeads: leads.length - activeLeads.length,
      topActionCount: actions.length,
      highestScore: activeLeads.reduce((highest, lead) => Math.max(highest, lead.score), 0),
      first50Progress,
    },
    actions,
    safetyRules: [
      'Do not auto-send outreach.',
      'Daniel approves all client communication.',
      'Do not use real credentials or production client systems without explicit approval.',
      'Use local data only; no APIs, scraping, dashboards, or external services.',
    ],
    suggestedNextCommands: buildSuggestedNextCommands(actions, leads),
  };

  writePlan(plan);
  console.log(`Daily plan generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Top actions: ${actions.length}`);
  for (const action of actions) {
    console.log(`${action.priority}. ${action.companyName} - ${action.score}/10 - ${action.actionType}`);
  }
  console.log('No outreach was sent. Human approval is required before any contact.');
}

function writePlan(plan: DailyPlan): void {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, renderPlan(plan), 'utf8');
}

function renderPlan(plan: DailyPlan): string {
  const topActions = plan.actions.length > 0
    ? plan.actions.map(formatPriority).join('\n')
    : 'No actionable leads found. Seed or review leads before planning revenue actions.';

  const manualActions = plan.actions.length > 0
    ? plan.actions.map(formatManualAction).join('\n')
    : '- Add or review local leads before preparing outreach, audits, calls, or proposals.';

  return `# AI Studio OS Daily Plan

Date: ${plan.date}

## Summary

- Total leads: ${plan.summary.totalLeads}
- Active revenue leads: ${plan.summary.activeLeads}
- Excluded lost, paused, or not-fit leads: ${plan.summary.excludedLeads}
- ${renderFirst50ProgressLines(plan.summary.first50Progress).join('\n- ')}
- Top actions generated: ${plan.summary.topActionCount}
- Highest active score: ${plan.summary.highestScore}/10

## Top 5 Revenue Actions

${topActions}

## Manual Actions

${manualActions}

## Safety Rules

${plan.safetyRules.map((rule) => `- ${rule}`).join('\n')}

## Suggested Next Commands

${plan.suggestedNextCommands.map((command) => `- ${command}`).join('\n')}
`;
}

function formatPriority(action: DailyPlanAction): string {
  return `${action.priority}. ${action.companyName} - ${action.score}/10 - ${action.recommendedOffer} - ${action.actionType}`;
}

function formatManualAction(action: DailyPlanAction): string {
  return `- Priority ${action.priority}: ${action.suggestedManualAction} Reason: ${action.reason}.`;
}

function buildSuggestedNextCommands(actions: DailyPlanAction[], leads: ReturnType<typeof readLeads>): string[] {
  const commands = new Set<string>();

  for (const action of actions) {
    if (action.actionType === 'prepare-audit') {
      const lead = leads.find((candidate) => candidate.id === action.leadId);
      commands.add(`npm run audit:site -- --url ${lead?.website || 'https://example.com'}`);
    }

    if (action.actionType === 'review-lead' || action.actionType === 'prepare-message') {
      commands.add(`npm run lead:pack -- --id ${action.leadId}`);
    }

    if (action.actionType === 'prepare-call') {
      commands.add(`npm run call:prep -- --id ${action.leadId}`);
    }

    if (action.actionType === 'prepare-proposal' || action.actionType === 'follow-up') {
      commands.add(`npm run sow:generate -- --id ${action.leadId}`);
    }
  }

  commands.add('npm run leads:seed');
  return [...commands];
}

generateDayPlan();
