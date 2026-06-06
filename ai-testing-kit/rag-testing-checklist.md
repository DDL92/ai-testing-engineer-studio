# RAG Testing Checklist

## Retrieval Relevance

- Retrieved chunks directly answer the question.
- Top result is relevant.
- Irrelevant chunks are minimized.
- Similar documents are ranked correctly.

## Citation Accuracy

- Citations point to real sources.
- Cited source supports the claim.
- Multiple claims have matching sources.
- No citation is fabricated.

## Missing Context Behavior

- Assistant says when context is missing.
- Does not invent unsupported facts.
- Suggests next step or required source.
- Keeps answer concise.

## Conflicting Context

- Identifies conflict.
- Avoids pretending certainty.
- Prioritizes trusted or newest source when rules exist.
- Asks for clarification when needed.

## Freshness

- Uses the latest indexed source.
- Flags stale or outdated documents.
- Handles versioned documents correctly.
- Includes date-sensitive warnings when relevant.

## Chunk Quality

- Chunks are coherent.
- Chunks include enough surrounding context.
- Metadata is useful.
- Duplicates are controlled.

## Source Attribution

- Source title is visible.
- Source URL or ID is captured.
- Answer separates cited facts from inference.
- Unsupported claims are minimized.

## Hallucination Risk

- Unsupported claims are tracked.
- High-risk answers are reviewed manually.
- Regression prompts cover known hallucinations.
- Scoring is consistent across releases.

