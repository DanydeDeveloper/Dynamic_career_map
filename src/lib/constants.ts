export const professionalAreas = [
  { key: "IT", label: "IT и цифровые технологии" },
  { key: "engineering", label: "Инженерия и робототехника" },
  { key: "science", label: "Естественные науки" },
  { key: "medicine", label: "Медицина и биотехнологии" },
  { key: "entrepreneurship", label: "Предпринимательство" },
  { key: "media", label: "Медиа и коммуникации" },
  { key: "design", label: "Искусство и дизайн" },
  { key: "social_projects", label: "Социальные проекты" },
  { key: "humanities", label: "Гуманитарные науки" },
  { key: "law", label: "Право и общество" },
  { key: "education", label: "Образование" },
  { key: "sport", label: "Спорт и здоровье" }
] as const;

export const russianCities = [
  "Москва",
  "Санкт-Петербург",
  "Казань",
  "Екатеринбург",
  "Новосибирск",
  "Нижний Новгород",
  "Онлайн"
];

export const priorityLabels: Record<string, string> = {
  required: "Обязательное",
  recommended: "Рекомендуемое",
  optional: "Дополнительное"
};

export const eventStatusLabels: Record<string, string> = {
  draft: "Черновик",
  approved: "Одобрено",
  planned: "Запланировано",
  visited: "Посещено",
  feedback_completed: "Фидбэк заполнен",
  change_suggested: "Есть предложение",
  completed: "Завершено"
};

export const proposalStatusLabels: Record<string, string> = {
  pending: "Ждет решения",
  approved: "Одобрено",
  rejected: "Отклонено",
  edited: "Изменено",
  postponed: "Отложено"
};

export const formatLabels: Record<string, string> = {
  offline: "Очно",
  online: "Онлайн",
  hybrid: "Гибрид"
};

export const eventTypeLabels: Record<string, string> = {
  festival: "Фестиваль",
  workshop: "Мастер-класс",
  olympiad: "Олимпиада",
  hackathon: "Хакатон",
  club: "Кружок",
  camp: "Смена",
  lecture: "Лекция",
  excursion: "Экскурсия",
  project_school: "Проектная школа"
};

export function areaLabel(key: string) {
  return professionalAreas.find((area) => area.key === key)?.label ?? key;
}
