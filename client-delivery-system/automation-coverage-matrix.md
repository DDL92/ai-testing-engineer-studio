# Automation Coverage Matrix

| Feature | Risk | Manual Coverage | Automation Coverage | Priority | Recommended Test Type | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Login flow | High | Yes, checked manually before release | No automated coverage | P0 | UI smoke with POM | Proposed |
| Dashboard load | High | Yes, checked after login | No automated coverage | P0 | UI smoke assertion | Proposed |
| API health check | High | Partial, usually checked only during incidents | No automated coverage | P0 | API health test | Proposed |
| Checkout/core action | High | Yes | No | P0 | UI + API | Proposed |
| AI response quality | Medium | No | No | P1 | AI regression | Proposed |

## Status Options

- Proposed
- In progress
- Automated
- Blocked
- Not recommended
