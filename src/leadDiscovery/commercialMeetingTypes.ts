export interface MeetingAgenda {
  title: string;
  estimatedDurationMinutes: string;
  items: Array<{
    order: number;
    topic: string;
    goal: string;
  }>;
}

export interface PitchSection {
  title: string;
  points: string[];
}

export interface ObjectionResponse {
  objection: string;
  response: string;
}

export interface ClosingQuestion {
  question: string;
  purpose: string;
}

export interface FollowUpDraft {
  name: 'Thank-you follow-up' | 'Pilot proposal follow-up' | 'Need-more-information follow-up';
  subject: string;
  body: string;
  safetyNote: string;
}

export interface MeetingPrepPack {
  generatedAt: string;
  client: string;
  estimatedMeetingDuration: string;
  pitch: {
    problem: PitchSection;
    solution: PitchSection;
    difference: PitchSection;
    value: PitchSection;
  };
  agenda: MeetingAgenda;
  pilotExplanation: {
    includes: string[];
    safetyRules: string[];
  };
  objections: ObjectionResponse[];
  closingQuestions: ClosingQuestion[];
  followUps: FollowUpDraft[];
  valueStory: string[];
  readiness: {
    pitchStatus: 'READY';
    agendaStatus: 'READY';
    objectionsStatus: 'READY';
    closingStatus: 'READY';
    followUpStatus: 'READY';
    commercialReadinessScore: number;
  };
}
