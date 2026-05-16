import { areaLabel, eventTypeLabels, formatLabels } from "@/lib/constants";
import { parseJson } from "@/lib/format";

type MatchStudent = {
  age: number;
  city: string;
  profile: {
    interestsJson: string;
    activityFormatsJson: string;
  } | null;
  parentRequest: {
    budget: number | null;
    preferredAreasJson: string;
    restrictedAreasJson: string;
  } | null;
  eventMap: Array<{
    eventId: string;
  }>;
};

type MatchEvent = {
  id: string;
  title: string;
  date: Date;
  time: string;
  format: string;
  eventType: string;
  ageMin: number;
  ageMax: number;
  city: string;
  cost: number;
  professionalAreasJson: string;
  activityFormatsJson: string;
  goal: string;
};

export type EventRecommendation = {
  event: MatchEvent;
  score: number;
  reasons: string[];
  risks: string[];
  explanation: string;
  goalForStudent: string;
  curatorComment: string;
};

function topKeys(values: Record<string, number>, threshold = 6) {
  return Object.entries(values)
    .filter(([, value]) => value >= threshold)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);
}

function intersect(left: string[], right: string[]) {
  return left.filter((item) => right.includes(item));
}

function buildExplanation(reasons: string[], risks: string[]) {
  const reasonText = reasons.length > 0 ? reasons.join("; ") : "мероприятие можно использовать как исследовательскую пробу";
  const riskText = risks.length > 0 ? ` Риски: ${risks.join("; ")}.` : "";
  return `${reasonText}.${riskText}`;
}

export function scoreEventForStudent(student: MatchStudent, event: MatchEvent): EventRecommendation {
  const interests = parseJson<Record<string, number>>(student.profile?.interestsJson ?? "{}", {});
  const activityFormats = parseJson<Record<string, number>>(student.profile?.activityFormatsJson ?? "{}", {});
  const preferredAreas = parseJson<string[]>(student.parentRequest?.preferredAreasJson ?? "[]", []);
  const restrictedAreas = parseJson<string[]>(student.parentRequest?.restrictedAreasJson ?? "[]", []);
  const eventAreas = parseJson<string[]>(event.professionalAreasJson, []);
  const eventFormats = parseJson<string[]>(event.activityFormatsJson, []);
  const topInterests = topKeys(interests);
  const topFormats = topKeys(activityFormats);
  const matchingInterests = intersect(eventAreas, topInterests);
  const matchingFormats = intersect(eventFormats, topFormats);
  const matchingPreferredAreas = intersect(eventAreas, preferredAreas);
  const restrictedHits = intersect(eventAreas, restrictedAreas);
  const alreadyAssigned = student.eventMap.some((item) => item.eventId === event.id);
  const reasons: string[] = [];
  const risks: string[] = [];
  let score = 0;

  if (student.age >= event.ageMin && student.age <= event.ageMax) {
    score += 20;
    reasons.push("подходит по возрасту");
  } else {
    score -= 30;
    risks.push(`возрастной диапазон ${event.ageMin}-${event.ageMax}`);
  }

  if (event.city === student.city || event.city === "Онлайн" || event.format === "online") {
    score += 15;
    reasons.push(event.city === student.city ? "совпадает город" : "доступен онлайн-формат");
  } else {
    score -= 8;
    risks.push(`другой город: ${event.city}`);
  }

  if (matchingInterests.length > 0) {
    score += 12 * matchingInterests.length;
    reasons.push(`совпадает с интересами: ${matchingInterests.map(areaLabel).join(", ")}`);
  }

  if (matchingFormats.length > 0) {
    score += 8 * matchingFormats.length;
    reasons.push(`подходит по формату: ${matchingFormats.join(", ")}`);
  }

  if (matchingPreferredAreas.length > 0) {
    score += 10;
    reasons.push(`учитывает запрос семьи: ${matchingPreferredAreas.map(areaLabel).join(", ")}`);
  }

  if (student.parentRequest?.budget == null || event.cost <= student.parentRequest.budget) {
    score += 10;
    reasons.push("вписывается в бюджет");
  } else {
    score -= 12;
    risks.push("выше указанного бюджета");
  }

  if (restrictedHits.length > 0) {
    score -= 35;
    risks.push(`область ограничена семьей: ${restrictedHits.map(areaLabel).join(", ")}`);
  }

  if (alreadyAssigned) {
    score -= 100;
    risks.push("уже есть в карте ученика");
  }

  if (event.eventType === "lecture") {
    risks.push("лекционный формат может быть менее вовлекающим");
  }

  const normalizedScore = Math.max(0, Math.min(score, 100));
  const explanation = buildExplanation(reasons, risks);
  const mainArea = eventAreas[0] ? areaLabel(eventAreas[0]) : "новую область";

  return {
    event,
    score: normalizedScore,
    reasons,
    risks,
    explanation,
    goalForStudent: `Проверить интерес к направлению ${mainArea} через формат "${eventTypeLabels[event.eventType] ?? event.eventType}".`,
    curatorComment: `${explanation} Формат: ${formatLabels[event.format] ?? event.format}.`
  };
}

export function recommendEventsForStudent(student: MatchStudent, events: MatchEvent[], limit = 5) {
  return events
    .map((event) => scoreEventForStudent(student, event))
    .filter((recommendation) => recommendation.score > 0)
    .sort((a, b) => b.score - a.score || a.event.date.getTime() - b.event.date.getTime())
    .slice(0, limit);
}
