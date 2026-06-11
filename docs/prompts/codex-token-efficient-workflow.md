# Codex Token Efficient Workflow

## Purpose

Codex should be used to build and improve the local operating system, not to run every daily business action. The goal is to keep token usage low by creating small, reliable modules that Daniel can run locally through npm scripts, markdown templates, JSON/CSV files, and repeatable checklists.

Lower token usage matters because this project is designed to be local-first and low-cost. Codex should help create durable business machinery for QA Automation services, then daily work should be handled by the machine with minimal Codex involvement.

Core rule:

Codex builds or improves the machine; the machine runs daily work.

## Rules For Small Scoped Tasks

Each Codex task should be limited to one clear outcome.

Good task scopes:

- Create one documentation file.
- Add one npm script.
- Build one local generator.
- Improve one report template.
- Add one Playwright Page Object and one related spec.
- Update one workflow command.

Avoid broad task scopes:

- Rebuild the whole app.
- Refactor unrelated folders.
- Add dashboards, CRM logic, and reports in the same task.
- Install tools before confirming they are required.
- Mix documentation, runtime code, tests, and generated outputs unless explicitly requested.

## How To Structure Future Codex Prompts

Future prompts should be written like a small implementation ticket. They should tell Codex exactly what business outcome is needed, what files are allowed, what files are off limits, which commands to run, and how the work will be accepted.

The prompt should include:

- The business goal.
- The exact module or document to create.
- The allowed edit scope.
- The commands to run after the change.
- The safety constraints.
- The expected final summary.

Do not rely on Codex to infer broad product direction when a narrow task is enough.

## How To Define File Scope

Every task should define files Codex may edit and files Codex must not edit.

Use precise paths where possible:

```md
Files allowed to edit:
- docs/roadmap/next-sprint.md
- docs/prompts/codex-task-template.md

Files not allowed to edit:
- package.json
- apps/**
- data/**
- .env
```

When creating a new module, allow only the smallest required folder. For example:

```md
Files allowed to edit:
- apps/lead-operator/src/tracker/**
- docs/business/lead-tracker.md
- package.json
```

If package scripts are not needed, do not allow `package.json`.

## When Codex Should Stop And Ask For Review

Codex should stop and ask for review when:

- The task requires credentials, tokens, API keys, private client data, or production system access.
- The task would send messages, proposals, emails, DMs, or comments to real people.
- The task would modify production client systems.
- The requested change conflicts with the local-first, low-cost strategy.
- The implementation requires installing a new dependency not listed in the prompt.
- The task requires adding SaaS, paid services, MCP servers, Browserbase, Stagehand, Ruflo, Supabase, CRM integrations, or complex agents.
- The required file scope is unclear and a wrong assumption could affect runtime logic.
- Existing unrelated user changes would need to be overwritten.

## How To Avoid Unrelated Refactors

Codex should not clean up nearby code unless the cleanup is required for the requested task.

Use this discipline:

- Read the relevant files first.
- Make the smallest change that satisfies the acceptance criteria.
- Preserve existing names, folder structure, and conventions.
- Do not rename files unless requested.
- Do not change formatting across unrelated files.
- Do not rewrite working scripts to match a preferred style.
- Do not change generated outputs unless the task explicitly requires it.

## Prefer Local Scripts Over Repeated Codex Usage

If a workflow will be repeated, Codex should create or improve a local command instead of performing the work manually each time.

Preferred pattern:

1. Codex creates a small local script, template, or command.
2. Daniel reviews and approves the behavior.
3. Daniel runs the command locally during daily operations.
4. Codex is used later only to improve the machine.

Examples:

- Use `npm run day:plan` instead of asking Codex to create a daily plan from scratch every day.
- Use `npm run lead:pack` instead of asking Codex to manually research and format leads repeatedly.
- Use `npm run audit:site` instead of asking Codex to manually coordinate Playwright and Lighthouse evidence.
- Use `npm run client:report` instead of asking Codex to rewrite recurring retainer updates by hand.

## Recommended Codex Task Format

Use this structure for future tasks:

```md
Goal:
Describe the exact outcome.

Context:
Explain the business reason and current state.

Files allowed to edit:
- path/to/file.md
- path/to/folder/**

Files not allowed to edit:
- .env
- package-lock.json
- apps/unrelated/**

Commands to run:
- git status --short
- npm run typecheck

Acceptance criteria:
- Specific result 1
- Specific result 2
- Specific result 3

Safety constraints:
- Do not install packages.
- Do not use real client credentials.
- Do not automate outreach sending.
- Human approval remains required before client communication.
```

## Operating Principle

Codex should increase the leverage of the local system. It should create small, reviewable building blocks that make Daniel faster without creating dependency on constant AI usage.

Daily business operations should move toward local commands, templates, checklists, and evidence-based reports. Codex should be reserved for scoped improvements, debugging, documentation, and new module creation.
