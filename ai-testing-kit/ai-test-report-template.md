# AI Test Report Template

## Executive Summary

Scope:  
Overall risk:  
Release recommendation:

## Scope

- Feature:
- Environment:
- Model/prompt version:
- Test date:
- Evaluator:

## Test Matrix

| Area | Cases | Passed | Failed | Risk |
| --- | ---: | ---: | ---: | --- |
| Prompt quality |  |  |  |  |
| Defensive injection |  |  |  |  |
| RAG grounding |  |  |  |  |
| Format compliance |  |  |  |  |

## Findings

| ID | Finding | Severity | Evidence | Recommendation |
| --- | --- | --- | --- | --- |
| AI-001 |  |  |  |  |

## Risk

- High:
- Medium:
- Low:

## Recommendations

1. Add regression prompts for high-risk workflows.
2. Validate output contracts automatically.
3. Review failed safety and grounding cases before release.

## Regression Plan

- Run critical prompt suite before prompt/model changes.
- Track score changes.
- Convert production failures into regression tests.

## Next Steps

- Fix high-risk findings.
- Re-run focused tests.
- Add monitoring for AI output quality.

