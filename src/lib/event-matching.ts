type MatchStudent = {
  age: number;
  city: string;
  interests: Record<string, number>;
  areasToCheck: string[];
  budget?: number | null;
};

type MatchEvent = {
  ageMin: number;
  ageMax: number;
  city: string;
  cost: number;
  professionalAreas: string[];
};

export function scoreEventMatch(student: MatchStudent, event: MatchEvent) {
  let score = 0;
  const reasons: string[] = [];

  if (student.age >= event.ageMin && student.age <= event.ageMax) {
    score += 25;
    reasons.push("подходит по возрасту");
  }

  if (event.city === student.city || event.city === "Онлайн") {
    score += 20;
    reasons.push("подходит по городу или онлайн-формату");
  }

  const interestHit = event.professionalAreas.some((area) => (student.interests[area] ?? 0) >= 6);
  if (interestHit) {
    score += 20;
    reasons.push("совпадает с выраженными интересами");
  }

  const explorationHit = event.professionalAreas.some((area) => student.areasToCheck.includes(area));
  if (explorationHit) {
    score += 20;
    reasons.push("помогает проверить непроверенную область");
  }

  if (student.budget == null || event.cost <= student.budget) {
    score += 15;
    reasons.push("вписывается в бюджет");
  }

  return {
    score,
    reasons
  };
}
