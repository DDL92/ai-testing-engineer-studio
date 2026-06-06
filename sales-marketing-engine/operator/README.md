# AI Sales Operator

AI Sales Operator is a local, human-approved sales operations layer for AI Testing Engineer Studio. It reads simple CSV and Markdown inputs, qualifies leads, prepares messages, drafts proposals, creates content, and summarizes pipeline activity.

It does not send messages, scrape websites, apply to jobs, call external APIs, or automate LinkedIn/Upwork actions. Every generated message, proposal, follow-up, and content item must be reviewed manually before use.

## What It Does

- Organizes raw leads.
- Scores and prioritizes prospects.
- Generates daily sales briefs.
- Drafts personalized messages.
- Builds proposal queues from job posts.
- Finds follow-ups due.
- Creates daily content packs.
- Summarizes pipeline value.
- Produces weekly business reviews.

## What It Does Not Do

- No automated sending.
- No LinkedIn bots.
- No Upwork auto-applier.
- No aggressive scraping.
- No paid tools.
- No external APIs.
- No production credential handling.

## Why Approval Queue Exists

The `approval-queue` folder contains drafts that are ready for human review. Nothing in this system should be sent or posted until you inspect it, personalize it, and confirm it is appropriate for the platform and lead.

## Daily Workflow

1. Edit `input/raw-leads.csv` with new leads.
2. Add notes in `input/daily-notes.md`.
3. Run `npm run operator:daily`.
4. Review:
   - `generated/daily-sales-brief.md`
   - `approval-queue/messages-ready-to-send.md`
   - `approval-queue/follow-ups-ready-to-send.md`
   - `approval-queue/proposals-ready-to-send.md`
   - `approval-queue/content-ready-to-post.md`
5. Manually send or post only approved items.
6. Update lead statuses and follow-up dates.

## Weekly Workflow

1. Update `sales-marketing-engine/weekly-sales-dashboard/sales-metrics-tracker.csv` if available.
2. Run `npm run operator:weekly`.
3. Review:
   - `generated/weekly-business-review.md`
   - `generated/pipeline-summary.md`
   - `generated/follow-ups-due.md`
4. Decide what to stop, improve, and double down on next week.

## Commands

```bash
npm run operator:qualify
npm run operator:brief
npm run operator:messages
npm run operator:proposals
npm run operator:followups
npm run operator:content
npm run operator:pipeline
npm run operator:daily
npm run operator:weekly
```

## Files To Edit

- `input/raw-leads.csv`
- `input/job-posts/*.md`
- `input/content-topics.md`
- `input/daily-notes.md`
- `templates/*.md` when wording needs improvement

## Files To Review

- `generated/*.md`
- `approval-queue/*.md`

## Safety Rules

- Review before sending anything.
- Personalize every message.
- Stop after respectful follow-up limits.
- Do not use production credentials in any file.
- Do not paste private client data into public commits.

## Revenue Goal

The operator supports a path to $3k-$5k/month by focusing daily activity on qualified leads, low-risk audits, framework upsells, AI testing audits, and monthly retainers.

