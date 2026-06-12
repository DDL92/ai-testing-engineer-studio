# Pain Research: Wodify

## Evidence Status

- Source scope: existing approved lead data and local Studio notes only.
- Status: Not enough evidence yet for verified customer complaints.
- Research Required: Yes.
- No review quotes, customer findings, incidents, vulnerabilities, or claims are generated.

## Complaints

### Complaint Signal

- Complaint: Local lead notes flag checkout, payment, mobile, scheduling, and regression workflows as areas to review.
- Category: checkout
- Frequency: unknown
- Business Impact: Potential revenue or member experience friction if checkout, payment, or mobile paths are unreliable.
- Confidence: low
- Status: Not enough evidence yet
- Research Required: Yes
- Source: data/leads.json local painPoints and fitNotes

### Complaint Signal

- Complaint: Local lead notes flag mobile flow review as an area to review.
- Category: mobile
- Frequency: unknown
- Business Impact: Potential member experience friction if mobile workflows regress.
- Confidence: low
- Status: Not enough evidence yet
- Research Required: Yes
- Source: data/leads.json local painPoints

## Patterns

- Potential workflow cluster: class scheduling, payments, athlete/member workflows, mobile.
- Potential release-confidence angle from local regression testing opportunity notes.

## QA Risks

### QA Risk

- Risk: Payment and checkout regression risk
- Category: payment-risk
- Why: Checkout and payment workflows are listed as local QA opportunity signals.

### QA Risk

- Risk: Mobile workflow regression risk
- Category: mobile-risk
- Why: Mobile flow review is listed as a local QA opportunity signal.

### QA Risk

- Risk: Scheduling workflow regression risk
- Category: booking-risk
- Why: Local lead notes include class scheduling as a possible review area.

## Automation Opportunities

### Playwright Opportunity

- Opportunity: Payment and checkout smoke suite
- Coverage:
  - checkout entry
  - payment path
  - confirmation state
  - error handling
  - basic regression coverage

### Playwright Opportunity

- Opportunity: Mobile scheduling smoke suite
- Coverage:
  - mobile viewport scheduling path
  - class selection
  - member workflow handoff
  - confirmation state

## Audit Angles

### QA Audit Angle

- Focus: Payment, scheduling, and mobile reliability
- Review:
  - checkout journey
  - payment workflow
  - class scheduling path
  - mobile member workflow
  - release confidence

## Outreach Angles

### Engineering

- Conversation: How does the team maintain confidence around checkout, payment, scheduling, and mobile releases?

### Product

- Conversation: How do you measure friction in mobile member and scheduling workflows?

### Operations

- Conversation: How much support volume comes from checkout, payment, scheduling, or mobile workflow issues?

## Safety Notes

- This is customer pain intelligence, not a security scanner or vulnerability scanner.
- Local-only: no scraping, browser automation, APIs, credentials, external databases, or paid services.
- Do not present potential pain signals as verified customer complaints without manual evidence.
- Do not invent review quotes, customer findings, incidents, vulnerabilities, or platform failures.
- Human approval is required before using any audit angle or outreach angle externally.
