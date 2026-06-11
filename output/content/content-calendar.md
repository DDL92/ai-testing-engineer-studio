# Content From Audits

## Source Audits

- example-com: output/audits/example-com/audit-report.md
  - Findings extracted: 5
  - Potential issue: no visible navigation landmark detected
  - Potential issue: no visible main content landmark detected
  - Potential issue: no visible footer detected
  - Automation opportunity: homepage smoke coverage
  - Automation opportunity: navigation and link visibility

## LinkedIn Drafts

### LinkedIn draft: small QA signals that deserve manual review

- Platform: linkedin
- Format: linkedin-post
- Source: output/audits/example-com/audit-report.md

A recent QA audit found a potential issue that is easy to overlook: key page landmarks were not detected during a passive homepage review.

That does not automatically mean the product is broken.
It means a QA engineer should manually review whether navigation, main content, and footer structure are visible, understandable, and stable enough for smoke coverage.

The useful testing question: "Can users and tests reliably find the main content after load?"

A useful smoke test would check:
- The page loads with a meaningful title
- Primary navigation is visible when expected
- Main content is present after load
- Important links are visible without clicking destructive flows

Small checks like these do not replace product QA, but they catch early signals before a release turns messy.

Manual review first. Automation second.

Safety notes:

- Use anonymized phrasing by default. Content should educate without naming or shaming companies.
- Do not invent metrics, audit findings, or compliance claims. Only local audit text should inform drafts.
- Human approval is required before publishing. Drafts may need client-safety and brand review.


## Instagram Carousel Outlines

### Instagram carousel outline: homepage smoke tests

- Platform: instagram
- Format: instagram-carousel
- Source: output/audits/example-com/audit-report.md

Brand direction: AI Testing Engineer, black / white / cyan, educational, no generated images.
Slide 1: Homepage QA checks most teams skip
Slide 2: A recent QA audit found a potential landmark visibility issue
Slide 3: Check 1 - no visible main content landmark detected
Slide 4: Check 2 - page title and visible content
Slide 5: Check 3 - navigation and important links
Slide 6: Automation idea - homepage smoke coverage
Slide 7: What not to automate first - login, payment, and form submission without explicit approval
Slide 8: QA takeaway - smoke tests should prove the page is stable before deeper flows
Slide 9: CTA - Follow @aitestingengineer for practical QA automation lessons

Safety notes:

- Use anonymized phrasing by default. Content should educate without naming or shaming companies.
- Do not invent metrics, audit findings, or compliance claims. Only local audit text should inform drafts.
- Human approval is required before publishing. Drafts may need client-safety and brand review.


## Short Video Script Outlines

### Short-video script: passive audit signal

- Platform: short-video
- Format: short-video-script
- Source: output/audits/example-com/audit-report.md

Hook: One QA audit signal I always check before writing deeper automation.
Point 1: A passive audit may flag a potential issue like no visible main content landmark detected.
Point 2: That is not a public blame moment. It is a manual-review signal.
Point 3: Before testing forms, payments, or logged-in flows, start with safe checks: title, navigation, main content, links, and screenshot evidence.
Point 4: If those basics are unstable, deeper automation will be noisy.
Close: Start with small smoke tests, then expand only after the workflow is approved.

Safety notes:

- Use anonymized phrasing by default. Content should educate without naming or shaming companies.
- Do not invent metrics, audit findings, or compliance claims. Only local audit text should inform drafts.
- Human approval is required before publishing. Drafts may need client-safety and brand review.


## QA Lessons

### QA lesson: review landmarks before deeper workflows

- Platform: linkedin
- Format: qa-lesson
- Source: output/audits/example-com/audit-report.md

QA lesson: do not jump straight into complex end-to-end flows.

A useful first audit step is to confirm that the homepage exposes the basic structure users depend on.

Local audit signal used for this lesson: Automation opportunity: homepage smoke coverage.
Recommended manual review from the audit: Recommended next step: create a minimal Playwright Starter Pack only after Daniel approves the audit scope.

Practical Playwright starter checks:
- Open the approved URL
- Assert the title is present
- Assert expected landmarks or visible content exist
- Capture a screenshot on failure
- Avoid login, payment, and form submission unless explicitly scoped

The point is not to claim full coverage. The point is to create a stable first safety net.

Safety notes:

- Use anonymized phrasing by default. Content should educate without naming or shaming companies.
- Do not invent metrics, audit findings, or compliance claims. Only local audit text should inform drafts.
- Human approval is required before publishing. Drafts may need client-safety and brand review.


## Recommended Publishing Order

1. QA lesson: publish first because it is the safest educational angle.
2. LinkedIn draft: use after manual review and wording cleanup.
3. Instagram carousel outline: design manually in AI Testing Engineer black / white / cyan direction.
4. Short-video outline: record manually only after reviewing the script for client safety.

## Safety Review Checklist

- Content is anonymized by default.
- No real client names are included unless explicitly approved and already marked demo/sample.
- No fake metrics, ROI, accessibility compliance, or performance claims are included.
- No company is shamed or described as having failed.
- No images, Canva files, social posts, APIs, AI calls, or publishing automations were created.
- Daniel must approve every draft before publishing.
