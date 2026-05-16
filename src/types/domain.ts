export type ScoreMap = Record<string, number>;

export type TextMap = Record<string, string>;

export type VisibilityEvidence = string[];

export type FeedbackSignal = {
  interestScore: number;
  engagementScore: number;
  fatigueScore: number;
  wantContinue: "yes" | "no" | "not_sure";
  eventAreas: string[];
  eventFormats: string[];
};
