import fs = require('fs');
import path = require('path');
import {
  ClosingQuestion,
  FollowUpDraft,
  MeetingAgenda,
  MeetingPrepPack,
  ObjectionResponse,
} from './commercialMeetingTypes';

const clientName = 'Flora and Fauna Foods';
const estimatedMeetingDuration = '20-30 minutes';
const outputDir = path.join(process.cwd(), 'output', 'commercial');
const outputPaths = {
  prepMarkdown: path.join(outputDir, 'flora-meeting-prep.md'),
  prepJson: path.join(outputDir, 'flora-meeting-prep.json'),
  agendaMarkdown: path.join(outputDir, 'flora-meeting-agenda.md'),
  objectionsMarkdown: path.join(outputDir, 'flora-objections.md'),
  closingMarkdown: path.join(outputDir, 'flora-closing.md'),
  followUpMarkdown: path.join(outputDir, 'flora-follow-up.md'),
};

export function generateMeetingPrepPack(now = new Date()): MeetingPrepPack {
  const pack = buildMeetingPrepPack(now);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPaths.prepMarkdown, renderMeetingPrep(pack), 'utf8');
  fs.writeFileSync(outputPaths.prepJson, `${JSON.stringify(pack, null, 2)}\n`, 'utf8');
  fs.writeFileSync(outputPaths.agendaMarkdown, renderAgenda(pack.agenda), 'utf8');
  fs.writeFileSync(outputPaths.objectionsMarkdown, renderObjections(pack.objections), 'utf8');
  fs.writeFileSync(outputPaths.closingMarkdown, renderClosing(pack.closingQuestions), 'utf8');
  fs.writeFileSync(outputPaths.followUpMarkdown, renderFollowUps(pack.followUps), 'utf8');

  return pack;
}

export function getCommercialMeetingReadiness(): {
  pitchStatus: string;
  agendaStatus: string;
  objectionsStatus: string;
  closingStatus: string;
  followUpStatus: string;
  estimatedMeetingDuration: string;
  commercialReadinessScore: number;
} {
  const statuses = {
    pitchStatus: exists(outputPaths.prepMarkdown, outputPaths.prepJson) ? 'READY' : 'MISSING',
    agendaStatus: exists(outputPaths.agendaMarkdown) ? 'READY' : 'MISSING',
    objectionsStatus: exists(outputPaths.objectionsMarkdown) ? 'READY' : 'MISSING',
    closingStatus: exists(outputPaths.closingMarkdown) ? 'READY' : 'MISSING',
    followUpStatus: exists(outputPaths.followUpMarkdown) ? 'READY' : 'MISSING',
  };
  const readyCount = Object.values(statuses).filter((status) => status === 'READY').length;
  return {
    ...statuses,
    estimatedMeetingDuration,
    commercialReadinessScore: Math.round((readyCount / Object.keys(statuses).length) * 100),
  };
}

function buildMeetingPrepPack(now: Date): MeetingPrepPack {
  return {
    generatedAt: now.toISOString(),
    client: clientName,
    estimatedMeetingDuration,
    pitch: {
      problem: {
        title: 'Problem',
        points: ['Finding qualified buyers manually is time-consuming.'],
      },
      solution: {
        title: 'Solution',
        points: ['AI Lead Discovery Studio continuously discovers recent buyer-intent signals and prepares reviewed lead opportunities.'],
      },
      difference: {
        title: 'Difference',
        points: [
          'Recent buyer-intent focus',
          'Human-reviewed leads',
          'Sales intelligence',
          'Context-rich opportunities',
          'Manual approval workflow',
          'No spam automation',
        ],
      },
      value: {
        title: 'Value',
        points: ['Save time and help prioritize higher-quality opportunities.'],
      },
    },
    agenda: agenda(),
    pilotExplanation: {
      includes: [
        '10-15 reviewed leads',
        'Lead table',
        'Sales intelligence',
        'Review notes',
        'Recommended actions',
        'Executive summary',
      ],
      safetyRules: [
        'Manual-review only.',
        'No automated contact.',
        'No emails, DMs, calls, forms, scraping, contact extraction, or outreach are performed by this system.',
      ],
    },
    objections: objections(),
    closingQuestions: closingQuestions(),
    followUps: followUps(),
    valueStory: [
      'Time saved by reducing manual searching and organization.',
      'Lead prioritization based on recency, intent, buyer role, and fit.',
      'Better focus on opportunities with clearer commercial signals.',
      'Human review before delivery or any client-facing use.',
      'Continuous learning from reviews and false-positive filtering.',
      'Low operational overhead because the workflow remains local-first and manual-approved.',
    ],
    readiness: {
      pitchStatus: 'READY',
      agendaStatus: 'READY',
      objectionsStatus: 'READY',
      closingStatus: 'READY',
      followUpStatus: 'READY',
      commercialReadinessScore: 100,
    },
  };
}

function agenda(): MeetingAgenda {
  return {
    title: 'Flora Commercial Meeting Agenda',
    estimatedDurationMinutes: estimatedMeetingDuration,
    items: [
      { order: 1, topic: "Understand Flora's current process", goal: 'Learn how Flora currently finds and qualifies opportunities.' },
      { order: 2, topic: 'Understand lead pain points', goal: 'Identify where manual lead discovery is slow, inconsistent, or low quality.' },
      { order: 3, topic: 'Explain AI Lead Discovery Studio', goal: 'Describe the local-first, human-reviewed buyer-intent workflow.' },
      { order: 4, topic: 'Show pilot example', goal: 'Walk through the pilot pack structure and current NO_DELIVERY state honestly.' },
      { order: 5, topic: 'Explain deliverables', goal: 'Review lead table, sales intelligence, review notes, actions, and executive summary.' },
      { order: 6, topic: 'Explain pricing', goal: 'Position the $250-$500 pilot and monthly growth options.' },
      { order: 7, topic: 'Answer questions', goal: 'Address quality, guarantees, outreach control, and low-quality lead concerns.' },
      { order: 8, topic: 'Discuss pilot', goal: 'Decide whether a paid pilot is useful and define success criteria.' },
    ],
  };
}

function objections(): ObjectionResponse[] {
  return [
    {
      objection: 'How do I know the leads are good?',
      response: 'Every lead goes through scoring, buyer-role classification, false-positive filtering, and human review.',
    },
    {
      objection: 'Do you guarantee sales?',
      response: 'No. The system increases the probability of finding good opportunities but does not guarantee closed deals.',
    },
    {
      objection: 'Does this spam people?',
      response: 'No. The system prepares opportunities. Outreach remains under your control.',
    },
    {
      objection: 'What if we receive low-quality leads?',
      response: 'The system learns from every review and continuously improves quality.',
    },
  ];
}

function closingQuestions(): ClosingQuestion[] {
  return [
    {
      question: 'Would reviewing 10-15 qualified opportunities this month be valuable to your team?',
      purpose: 'Confirm whether the pilot volume is useful.',
    },
    {
      question: 'If the pilot delivered opportunities you would not have otherwise found, would you continue using it monthly?',
      purpose: 'Test expansion potential before starting the pilot.',
    },
    {
      question: 'What would make this pilot a success from your perspective?',
      purpose: 'Define success criteria before asking for commitment.',
    },
  ];
}

function followUps(): FollowUpDraft[] {
  return [
    {
      name: 'Thank-you follow-up',
      subject: 'Thank you for discussing AI Lead Discovery',
      body: 'Thank you for taking the time to discuss Flora and Fauna Foods lead discovery needs. I appreciate the context on your current process and where higher-quality opportunity discovery could help. I will keep the pilot focused on reviewed opportunities, sales context, and manual approval only.',
      safetyNote: 'Preparation only. Do not send automatically.',
    },
    {
      name: 'Pilot proposal follow-up',
      subject: 'Flora pilot proposal: 10-15 reviewed opportunities',
      body: 'Based on our conversation, the suggested pilot would include 10-15 reviewed leads, a lead table, sales intelligence, review notes, recommended actions, and an executive summary. Suggested pilot pricing is $250-$500. Outreach remains fully under Flora control; this system does not send emails, DMs, calls, or forms.',
      safetyNote: 'Preparation only. Do not send automatically.',
    },
    {
      name: 'Need-more-information follow-up',
      subject: 'Follow-up questions for the Flora lead discovery pilot',
      body: 'To make the pilot useful, I would like to confirm your ideal event types, preferred locations, minimum event size, most valuable lead signals, and what would make a reviewed opportunity worth pursuing. I can use those answers to keep the pilot focused and exclude low-quality matches.',
      safetyNote: 'Preparation only. Do not send automatically.',
    },
  ];
}

function renderMeetingPrep(pack: MeetingPrepPack): string {
  return `# Flora Commercial Meeting Prep Pack

Generated: ${pack.generatedAt}

## 60 Second Pitch

### ${pack.pitch.problem.title}

${pack.pitch.problem.points.map((point) => `- ${point}`).join('\n')}

### ${pack.pitch.solution.title}

${pack.pitch.solution.points.map((point) => `- ${point}`).join('\n')}

### ${pack.pitch.difference.title}

${pack.pitch.difference.points.map((point) => `- ${point}`).join('\n')}

### ${pack.pitch.value.title}

${pack.pitch.value.points.map((point) => `- ${point}`).join('\n')}

## Meeting Agenda

${renderAgendaItems(pack.agenda)}

## Pilot Explanation

Pilot includes:

${pack.pilotExplanation.includes.map((item) => `- ${item}`).join('\n')}

Safety:

${pack.pilotExplanation.safetyRules.map((rule) => `- ${rule}`).join('\n')}

## Objection Handler

${renderObjectionItems(pack.objections)}

## Closing Questions

${renderClosingItems(pack.closingQuestions)}

## Follow-Up Drafts

${renderFollowUpItems(pack.followUps)}

## Value Story

${pack.valueStory.map((item) => `- ${item}`).join('\n')}

## Readiness

- Pitch status: ${pack.readiness.pitchStatus}
- Agenda status: ${pack.readiness.agendaStatus}
- Objections status: ${pack.readiness.objectionsStatus}
- Closing status: ${pack.readiness.closingStatus}
- Follow-up status: ${pack.readiness.followUpStatus}
- Estimated meeting duration: ${pack.estimatedMeetingDuration}
- Commercial readiness score: ${pack.readiness.commercialReadinessScore}

Preparation only. No outreach, emails, DMs, calls, forms, scraping, contact extraction, providers, Tavily, browser automation, login, or paid services are used.
`;
}

function renderAgenda(meetingAgenda: MeetingAgenda): string {
  return `# ${meetingAgenda.title}

Estimated duration: ${meetingAgenda.estimatedDurationMinutes}

${renderAgendaItems(meetingAgenda)}
`;
}

function renderObjections(items: ObjectionResponse[]): string {
  return `# Flora Objection Handler

${renderObjectionItems(items)}
`;
}

function renderClosing(items: ClosingQuestion[]): string {
  return `# Flora Closing Questions

${renderClosingItems(items)}
`;
}

function renderFollowUps(items: FollowUpDraft[]): string {
  return `# Flora Follow-Up Drafts

Preparation only. No sending, emails, DMs, calls, forms, or outreach automation.

${renderFollowUpItems(items)}
`;
}

function renderAgendaItems(meetingAgenda: MeetingAgenda): string {
  return meetingAgenda.items.map((item) => `${item.order}. ${item.topic}\n\n   Goal: ${item.goal}`).join('\n\n');
}

function renderObjectionItems(items: ObjectionResponse[]): string {
  return items.map((item) => `### Objection: ${item.objection}\n\nResponse: ${item.response}`).join('\n\n');
}

function renderClosingItems(items: ClosingQuestion[]): string {
  return items.map((item) => `- ${item.question}\n  Purpose: ${item.purpose}`).join('\n');
}

function renderFollowUpItems(items: FollowUpDraft[]): string {
  return items.map((item) => `### ${item.name}\n\nSubject: ${item.subject}\n\n${item.body}\n\nSafety note: ${item.safetyNote}`).join('\n\n');
}

function exists(...filePaths: string[]): boolean {
  return filePaths.every((filePath) => fs.existsSync(filePath));
}

if (require.main === module) {
  generateMeetingPrepPack();
  console.log(`Generated meeting prep pack: ${Object.values(outputPaths).map((filePath) => path.relative(process.cwd(), filePath)).join(', ')}`);
}
