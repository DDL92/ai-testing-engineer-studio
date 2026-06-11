import { execFileSync } from 'child_process';
import path = require('path');
import {
  buildMacDailyData,
  macDailyCommands,
  macDailyOutputPaths,
  writeExecutedReports,
  writeMacSummaryOutputs,
} from './macAutomationRules';
import { MacDailyCommand, MacDailyCommandResult } from './types';

function main(): void {
  const results = macDailyCommands.map(runLocalReportCommand);
  const generatedAt = new Date().toISOString();
  const data = buildMacDailyData(generatedAt);
  const outputPaths = writeMacSummaryOutputs(data);
  writeExecutedReports(results);

  console.log(`Mac daily summary generated: ${relative(outputPaths.summary)}`);
  console.log(`Executed reports generated: ${relative(outputPaths.executedReports)}`);
  console.log(`System health generated: ${relative(outputPaths.systemHealth)}`);
  console.log(`Action cockpit generated: ${relative(outputPaths.actionCockpit)}`);
  console.log(`Commercial leads: ${data.commercialLeads.length}`);
  console.log(`Demo leads: ${data.demoLeadCount}`);
  console.log(`Top opportunity: ${data.topCommercialOpportunities[0]?.lead.companyName ?? 'none'}`);
  console.log('No APIs, scraping, browsing, CRM, outreach automation, email, LinkedIn automation, payments, credentials, or external databases were used.');
  console.log('Human approval remains required before external action.');

  if (results.some((result) => result.status === 'failure')) {
    process.exitCode = 1;
  }
}

function runLocalReportCommand(command: MacDailyCommand): MacDailyCommandResult {
  const startedAt = new Date().toISOString();

  try {
    console.log(`Running ${command.command}...`);
    execFileSync('npm', ['run', command.script], {
      cwd: process.cwd(),
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 8,
      stdio: 'pipe',
    });

    return {
      ...command,
      status: 'success',
      startedAt,
      completedAt: new Date().toISOString(),
      generatedOutputs: existingOutputs(command.expectedOutputs),
    };
  } catch (error) {
    return {
      ...command,
      status: 'failure',
      startedAt,
      completedAt: new Date().toISOString(),
      generatedOutputs: existingOutputs(command.expectedOutputs),
      errorMessage: error instanceof Error ? firstLine(error.message) : 'Unknown command failure.',
    };
  }
}

function existingOutputs(outputs: string[]): string[] {
  const fs = require('fs') as typeof import('fs');
  return outputs.filter((output) => fs.existsSync(path.join(process.cwd(), output)));
}

function firstLine(value: string): string {
  return value.split('\n').map((line) => line.trim()).filter(Boolean)[0] ?? 'Command failed.';
}

function relative(filePath: string): string {
  return path.relative(process.cwd(), filePath);
}

if (require.main === module) {
  macDailyOutputPaths();
  main();
}
