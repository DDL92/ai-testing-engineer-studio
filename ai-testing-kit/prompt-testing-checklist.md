# Prompt Testing Checklist

## Functional Prompt Tests

- Valid prompt returns useful answer.
- Answer matches user intent.
- Required fields are present.
- Output is understandable to target user.

## Regression Prompt Tests

- Known successful prompts remain stable.
- Fixed prompt bugs have dedicated tests.
- Model or prompt version changes are compared.
- High-value user workflows are retested.

## Boundary Tests

- Empty input.
- Very short input.
- Very long input.
- Ambiguous input.
- Unsupported request.

## Context Tests

- Uses provided context.
- Does not invent unavailable context.
- Handles missing context clearly.
- Resolves conflicting context safely.

## Refusal Tests

- Refuses disallowed requests.
- Explains limitations briefly.
- Offers safe alternative when appropriate.
- Does not reveal hidden instructions.

## Role Consistency

- Maintains product role.
- Uses expected tone.
- Avoids unauthorized persona changes.
- Keeps domain boundaries.

## Output Format Validation

- JSON is parseable when required.
- Required keys exist.
- No extra prose in strict format mode.
- Values match expected types.

## Multilingual Checks

- Responds in requested language.
- Preserves technical terms.
- Handles mixed-language input.
- Does not degrade safety behavior.

## Performance Expectations

- Response latency is acceptable.
- Retries are controlled.
- Error messages are clear.
- Rate limits are handled.

