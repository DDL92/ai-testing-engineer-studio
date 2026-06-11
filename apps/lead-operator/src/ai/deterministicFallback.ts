import type { MessageOptimizationInput, MessageType } from './promptTemplates';

export function deterministicOptimize(input: MessageOptimizationInput): string {
  const lead = input.lead;
  const company = lead?.companyName ?? 'your team';
  const contact = lead?.contactName || 'there';
  const qaFit = lead?.qaFitReason || 'there may be practical QA automation opportunities worth reviewing';
  const offer = lead?.suggestedOffer || 'a focused Playwright QA audit';
  const auditNote = input.auditFindings ? 'I can keep the next step tied to the public-page findings already captured.' : 'I would keep the first step limited to public, reviewable information.';

  const templates: Record<MessageType, string> = {
    linkedin_dm: `Hi ${contact}, I noticed ${company} may be a fit for focused QA automation support. ${qaFit}. I help teams use Playwright and TypeScript to turn risky public flows into maintainable smoke coverage. Open to a short, practical QA audit as a next step?`,
    cold_email: `Subject: Practical Playwright QA audit for ${company}\n\nHi ${contact},\n\nI am Daniel, a Senior QA Automation Engineer focused on Playwright and TypeScript. ${qaFit}.\n\nA useful first step could be ${offer}: a concise review of public flows, automation opportunities, and a clear test plan without touching private areas or making unsupported claims.\n\nWould it be worth sending over a short outline?`,
    instagram_dm: `Hi ${contact}, I help SaaS and web app teams improve release confidence with Playwright QA automation. ${company} looks like it may have flows where a lightweight public-page QA review could be useful. Open to me sharing a short audit outline?`,
    upwork_proposal: `Hi, I am Daniel, a Senior QA Automation Engineer specializing in Playwright and TypeScript. Based on the project details, I would keep the first step practical: identify the highest-risk flows, add stable smoke coverage, and document what should be automated next. I avoid brittle selectors, overbuilt frameworks, and unsupported claims. If helpful, I can start with a focused QA audit and a concise implementation plan.`,
    follow_up: `Hi ${contact}, quick follow-up. ${auditNote} If QA automation is still relevant, I can keep this lightweight with a focused Playwright audit and a short action plan. Is this worth revisiting?`,
    audit_based_proposal: `Hi ${contact}, based on the available public-page QA review for ${company}, the safest next step is ${offer}. I would focus on observable flows, regression risks, and Playwright coverage recommendations without claiming access to private product areas. Would you like me to turn this into a short implementation plan?`,
    objection_response: `That makes sense. The lowest-risk option is to keep the scope small: a focused public-flow QA audit, practical Playwright recommendations, and no commitment to a larger engagement until the findings are useful. Would a short scoped review be easier to evaluate?`,
    closing_message: `Hi ${contact}, I will close the loop for now. If QA automation or Playwright coverage becomes a priority later, I can help with a focused audit or a small smoke-test foundation. Thanks for considering it.`,
  };

  return templates[input.type];
}
