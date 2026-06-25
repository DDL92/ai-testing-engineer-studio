# Generated Files Policy

## What Should Be Committed

- Source code under `src/`.
- Documentation under `docs/`.
- Safe configuration examples such as `.env.example`.
- Small deterministic fixtures intentionally used by tests.
- Package metadata such as `package.json` and `package-lock.json`.

## What Should Not Be Committed

- `.env` and `.env.local`.
- `runtime/`.
- `test-results/`.
- `playwright-report/`.
- `output/evidence/`.
- Generated dashboards, reports, screenshots, traces, videos, and local operator outputs unless intentionally reviewed for a release artifact.
- `data/autonomous-runner/runner-state.json`.
- `data/messages/message-drafts.json`.
- Any credentials, tokens, private client data, or sensitive screenshots.

## Inspect Before Commit

```bash
git status
git diff --stat
```

Review every modified file before committing. Generated files often change during validation commands.

## Revert Runtime Or Generated Files

Use this only for local generated changes that should not be committed:

```bash
git restore <file>
```

Do not restore user-authored source or docs changes unless you intentionally want to discard them.
