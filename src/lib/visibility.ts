const activityScores: Record<string, number> = {
  lecture: 5,
  festival: 5,
  workshop: 10,
  club: 15,
  hackathon: 15,
  project_school: 20,
  excursion: 10,
  camp: 25,
  olympiad: 10
};

export function visibilityPointsForEvent(eventType: string) {
  return activityScores[eventType] ?? 5;
}

export function visibilityLevel(score: number) {
  if (score <= 20) {
    return "низкая";
  }

  if (score <= 50) {
    return "базовая";
  }

  if (score <= 80) {
    return "средняя";
  }

  return "высокая";
}

export function clampVisibility(score: number) {
  return Math.max(0, Math.min(score, 100));
}
