# AI Message Optimizer

The AI Message Optimizer improves outreach drafts while keeping Daniel in control. It never sends messages, never logs in to LinkedIn or Upwork, and writes every result to the local approval queue for review.

## Commands

Optimize an existing draft:

```bash
npm run message:optimize -- --file sales-marketing-engine/operator/approval-queue/<draft>.md --type linkedin_dm
```

Optimize by lead ID:

```bash
npm run lead:optimize -- --id <leadId> --type linkedin_dm
```

Supported message types:

- `linkedin_dm`
- `cold_email`
- `instagram_dm`
- `upwork_proposal`
- `follow_up`
- `audit_based_proposal`
- `objection_response`
- `closing_message`

## Optional AI Configuration

AI copy is disabled by default.

```bash
AI_COPY_ENABLED=false
AI_PROVIDER=deterministic
AI_COPY_MODEL=gpt-4o-mini
OPENAI_API_KEY=
```

To enable OpenAI-assisted copy locally:

```bash
AI_COPY_ENABLED=true
AI_PROVIDER=openai
OPENAI_API_KEY=<local secret>
```

If AI is disabled or the API key is missing, the optimizer uses deterministic fallback copy and the workflow continues.

Optimized drafts should be scanned into the Message Review Queue:

```bash
npm run message:queue
```

## Safety Rules

- Review before sending.
- Do not claim private app or dashboard testing unless scoped and credentialed.
- Do not say bugs were found unless an audit report supports it.
- Do not invent revenue impact, prior relationships, or client outcomes.
- Do not automate sending.

## Business Purpose

The optimizer helps Daniel move more qualified leads through the $3,000-$5,000/month pipeline by making manual outreach faster, clearer, and safer while preserving human approval.
