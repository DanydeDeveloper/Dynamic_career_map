export type ScoreMap = Record<string, number>;

export type TextMap = Record<string, string>;

export type VisibilityEvidence = string[];

export type FeedbackSignal = {
  studentName?: string;
  eventTitle?: string;
  interestScore: number;
  difficultyScore?: number;
  engagementScore: number;
  fatigueScore: number;
  wantContinue: "yes" | "no" | "not_sure";
  eventAreas: string[];
  eventFormats: string[];
  liked?: string | null;
  disliked?: string | null;
  learned?: string | null;
  wantTryNext?: string | null;
  tags?: string[];
};
