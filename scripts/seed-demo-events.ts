import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const json = (value: unknown) => JSON.stringify(value);

function eventDate(daysFromToday: number) {
  const date = new Date();
  date.setUTCHours(10, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + daysFromToday);
  return date.toISOString();
}

type DemoSource = {
  title: string;
  url: string;
  city?: string;
  focusAreas: string[];
  comment: string;
};

type DemoEvent = {
  sourceTitle: string;
  title: string;
  date: string;
  time: string;
  format: string;
  participationFormat: string;
  eventType: string;
  ageMin: number;
  ageMax: number;
  city: string;
  location?: string;
  cost: number;
  professionalAreas: string[];
  activityFormats: string[];
  goal: string;
  sourceUrl: string;
  qualityNotes: string;
  status: "approved" | "needs_review" | "draft";
};

const sources: DemoSource[] = [
  {
    title: "Детский технопарк",
    url: "https://example.com/technopark",
    city: "Москва",
    focusAreas: ["engineering", "IT"],
    comment: "Мастер-классы, проектные смены и инженерные демо-дни."
  },
  {
    title: "Университетские лаборатории",
    url: "https://example.com/university-labs",
    city: "Санкт-Петербург",
    focusAreas: ["science", "medicine"],
    comment: "Экскурсии и короткие исследовательские программы для школьников."
  },
  {
    title: "Онлайн-платформа школьных хакатонов",
    url: "https://example.com/hackathons",
    city: "Онлайн",
    focusAreas: ["IT", "entrepreneurship"],
    comment: "Командные онлайн-соревнования и проектные интенсивы."
  },
  {
    title: "Музей науки и технологий",
    url: "https://example.com/science-museum",
    city: "Москва",
    focusAreas: ["science", "engineering", "design"],
    comment: "Фестивали, лекции, интерактивные экскурсии."
  },
  {
    title: "Школа медиа и дизайна",
    url: "https://example.com/media-design",
    city: "Онлайн",
    focusAreas: ["media", "design"],
    comment: "Короткие практикумы по визуальным, медиа и коммуникационным навыкам."
  },
  {
    title: "Центр социальных проектов",
    url: "https://example.com/social-projects",
    city: "Казань",
    focusAreas: ["social_projects", "education", "law"],
    comment: "Волонтерские, образовательные и городские проектные программы."
  }
];

const events: DemoEvent[] = [
  {
    sourceTitle: "Детский технопарк",
    title: "Робототехника: собрать и запрограммировать манипулятор",
    date: eventDate(7),
    time: "11:00",
    format: "offline",
    participationFormat: "team",
    eventType: "workshop",
    ageMin: 10,
    ageMax: 14,
    city: "Москва",
    location: "Детский технопарк",
    cost: 2800,
    professionalAreas: ["engineering", "IT"],
    activityFormats: ["teamwork", "making", "project_work"],
    goal: "Проверить интерес к инженерии через сборку и программирование устройства",
    sourceUrl: "https://example.com/robot-arm",
    qualityNotes: "Проверены возраст, длительность и практическая часть.",
    status: "approved"
  },
  {
    sourceTitle: "Детский технопарк",
    title: "3D-моделирование для инженерных задач",
    date: eventDate(12),
    time: "14:00",
    format: "offline",
    participationFormat: "individual",
    eventType: "workshop",
    ageMin: 11,
    ageMax: 15,
    city: "Москва",
    location: "Лаборатория прототипирования",
    cost: 1800,
    professionalAreas: ["engineering", "design"],
    activityFormats: ["individual_work", "making"],
    goal: "Понять, нравится ли ученику проектировать предметы и видеть материальный результат",
    sourceUrl: "https://example.com/3d-modeling",
    qualityNotes: "Подходит для первой инженерно-дизайнерской пробы.",
    status: "approved"
  },
  {
    sourceTitle: "Музей науки и технологий",
    title: "Фестиваль экспериментов: химия, физика, биология",
    date: eventDate(18),
    time: "12:00",
    format: "offline",
    participationFormat: "family",
    eventType: "festival",
    ageMin: 9,
    ageMax: 14,
    city: "Москва",
    location: "Музей науки",
    cost: 900,
    professionalAreas: ["science", "medicine"],
    activityFormats: ["research", "individual_work"],
    goal: "Расширить насмотренность в естественных науках без высокой нагрузки",
    sourceUrl: "https://example.com/science-fest",
    qualityNotes: "Хорошо подходит для мягкой первичной пробы.",
    status: "approved"
  },
  {
    sourceTitle: "Онлайн-платформа школьных хакатонов",
    title: "Мини-хакатон: приложение для школьной жизни",
    date: eventDate(24),
    time: "10:00",
    format: "online",
    participationFormat: "team",
    eventType: "hackathon",
    ageMin: 11,
    ageMax: 16,
    city: "Онлайн",
    cost: 0,
    professionalAreas: ["IT", "entrepreneurship"],
    activityFormats: ["teamwork", "project_work", "competition"],
    goal: "Проверить интерес к командной разработке цифрового продукта",
    sourceUrl: "https://example.com/school-life-app",
    qualityNotes: "Нужна базовая готовность к командной работе.",
    status: "approved"
  },
  {
    sourceTitle: "Университетские лаборатории",
    title: "Экскурсия в биолабораторию: как работают исследователи",
    date: eventDate(32),
    time: "13:30",
    format: "offline",
    participationFormat: "with_curator",
    eventType: "excursion",
    ageMin: 11,
    ageMax: 15,
    city: "Санкт-Петербург",
    location: "Университетская лаборатория",
    cost: 0,
    professionalAreas: ["medicine", "science"],
    activityFormats: ["research", "individual_work"],
    goal: "Проверить интерес к биологии и медицине через знакомство с лабораторной средой",
    sourceUrl: "https://example.com/biology-lab",
    qualityNotes: "Проверить требования к сопровождению.",
    status: "needs_review"
  },
  {
    sourceTitle: "Школа медиа и дизайна",
    title: "Практикум: сделать афишу мероприятия в Figma",
    date: eventDate(38),
    time: "17:00",
    format: "online",
    participationFormat: "individual",
    eventType: "workshop",
    ageMin: 10,
    ageMax: 14,
    city: "Онлайн",
    cost: 1200,
    professionalAreas: ["design", "media"],
    activityFormats: ["individual_work", "making"],
    goal: "Проверить творческий интерес через конкретный визуальный результат",
    sourceUrl: "https://example.com/figma-poster",
    qualityNotes: "Понятный результат за одно занятие.",
    status: "approved"
  },
  {
    sourceTitle: "Центр социальных проектов",
    title: "Городской проект: как придумать полезную инициативу",
    date: eventDate(45),
    time: "16:00",
    format: "hybrid",
    participationFormat: "team",
    eventType: "project_school",
    ageMin: 11,
    ageMax: 15,
    city: "Казань",
    location: "Молодежный центр",
    cost: 0,
    professionalAreas: ["social_projects", "education"],
    activityFormats: ["teamwork", "project_work", "public_speaking"],
    goal: "Понять, откликаются ли социальные и образовательные задачи",
    sourceUrl: "https://example.com/city-project",
    qualityNotes: "Подходит для проверки коммуникации и командности.",
    status: "approved"
  },
  {
    sourceTitle: "Музей науки и технологий",
    title: "Лекция-практикум: космос, спутники и связь",
    date: eventDate(53),
    time: "15:00",
    format: "offline",
    participationFormat: "individual",
    eventType: "lecture",
    ageMin: 10,
    ageMax: 15,
    city: "Москва",
    location: "Планетарий",
    cost: 700,
    professionalAreas: ["science", "engineering"],
    activityFormats: ["research", "individual_work"],
    goal: "Расширить представление о научно-технических профессиях",
    sourceUrl: "https://example.com/space-satellites",
    qualityNotes: "Есть практический блок, не только лекция.",
    status: "approved"
  },
  {
    sourceTitle: "Онлайн-платформа школьных хакатонов",
    title: "Олимпиада по логике и алгоритмам для 5-7 классов",
    date: eventDate(61),
    time: "11:00",
    format: "online",
    participationFormat: "individual",
    eventType: "olympiad",
    ageMin: 10,
    ageMax: 13,
    city: "Онлайн",
    cost: 0,
    professionalAreas: ["IT", "science"],
    activityFormats: ["individual_work", "competition"],
    goal: "Проверить интерес к задачам и соревновательному формату",
    sourceUrl: "https://example.com/logic-olympiad",
    qualityNotes: "Низкая нагрузка, можно использовать как быструю пробу.",
    status: "approved"
  },
  {
    sourceTitle: "Детский технопарк",
    title: "Каникулярная смена: инженерный стартап",
    date: eventDate(70),
    time: "10:00",
    format: "offline",
    participationFormat: "team",
    eventType: "camp",
    ageMin: 11,
    ageMax: 15,
    city: "Москва",
    location: "Детский технопарк",
    cost: 14500,
    professionalAreas: ["engineering", "entrepreneurship", "IT"],
    activityFormats: ["teamwork", "project_work", "public_speaking"],
    goal: "Проверить устойчивость интереса в длительном проектном формате",
    sourceUrl: "https://example.com/engineering-startup-camp",
    qualityNotes: "Высокая нагрузка, назначать только при готовности семьи.",
    status: "approved"
  },
  {
    sourceTitle: "Школа медиа и дизайна",
    title: "Подкаст за два часа: интервью и монтаж",
    date: eventDate(82),
    time: "18:00",
    format: "online",
    participationFormat: "team",
    eventType: "workshop",
    ageMin: 11,
    ageMax: 15,
    city: "Онлайн",
    cost: 900,
    professionalAreas: ["media", "humanities"],
    activityFormats: ["teamwork", "public_speaking", "making"],
    goal: "Проверить медиаинтерес через речь, вопросы и монтаж",
    sourceUrl: "https://example.com/podcast-workshop",
    qualityNotes: "Нужен микрофон или гарнитура.",
    status: "approved"
  },
  {
    sourceTitle: "Университетские лаборатории",
    title: "Медицинский симулятор: первая помощь и диагностика",
    date: eventDate(96),
    time: "13:00",
    format: "offline",
    participationFormat: "team",
    eventType: "workshop",
    ageMin: 12,
    ageMax: 16,
    city: "Санкт-Петербург",
    location: "Симуляционный центр",
    cost: 2500,
    professionalAreas: ["medicine", "social_projects"],
    activityFormats: ["teamwork", "making", "helping_people"],
    goal: "Проверить интерес к медицинским задачам через практический сценарий",
    sourceUrl: "https://example.com/medical-simulator",
    qualityNotes: "Требуется уточнить возрастной допуск.",
    status: "needs_review"
  },
  {
    sourceTitle: "Центр социальных проектов",
    title: "Правовой квест: как устроены правила города",
    date: eventDate(112),
    time: "15:30",
    format: "offline",
    participationFormat: "team",
    eventType: "workshop",
    ageMin: 11,
    ageMax: 15,
    city: "Казань",
    location: "Городская библиотека",
    cost: 0,
    professionalAreas: ["law", "social_projects", "humanities"],
    activityFormats: ["teamwork", "research", "public_speaking"],
    goal: "Расширить насмотренность в праве и социальных профессиях",
    sourceUrl: "https://example.com/law-quest",
    qualityNotes: "Хороший мягкий вход в правовую тематику.",
    status: "approved"
  },
  {
    sourceTitle: "Музей науки и технологий",
    title: "Экскурсия: профессии будущего в энергетике",
    date: eventDate(128),
    time: "12:30",
    format: "offline",
    participationFormat: "family",
    eventType: "excursion",
    ageMin: 10,
    ageMax: 16,
    city: "Москва",
    location: "Музей энергетики",
    cost: 600,
    professionalAreas: ["engineering", "science"],
    activityFormats: ["research", "individual_work"],
    goal: "Показать инженерные профессии вне робототехники и IT",
    sourceUrl: "https://example.com/energy-careers",
    qualityNotes: "Проверена дата, программа требует короткого обсуждения после.",
    status: "approved"
  },
  {
    sourceTitle: "Школа медиа и дизайна",
    title: "Комикс как проект: сценарий, персонаж, раскадровка",
    date: eventDate(145),
    time: "12:00",
    format: "online",
    participationFormat: "individual",
    eventType: "project_school",
    ageMin: 10,
    ageMax: 14,
    city: "Онлайн",
    cost: 1500,
    professionalAreas: ["design", "humanities", "media"],
    activityFormats: ["individual_work", "making", "project_work"],
    goal: "Проверить пересечение творчества, сторителлинга и проектной работы",
    sourceUrl: "https://example.com/comics-project",
    qualityNotes: "Нужны материалы для рисования или планшет.",
    status: "approved"
  },
  {
    sourceTitle: "Онлайн-платформа школьных хакатонов",
    title: "No-code проект: собрать прототип полезного сервиса",
    date: eventDate(163),
    time: "11:00",
    format: "online",
    participationFormat: "team",
    eventType: "project_school",
    ageMin: 11,
    ageMax: 16,
    city: "Онлайн",
    cost: 0,
    professionalAreas: ["IT", "entrepreneurship", "social_projects"],
    activityFormats: ["teamwork", "project_work", "public_speaking"],
    goal: "Проверить предпринимательскую гипотезу без сложного программирования",
    sourceUrl: "https://example.com/no-code-service",
    qualityNotes: "Подходит для детей с интересом к идеям и продуктам.",
    status: "approved"
  },
  {
    sourceTitle: "Университетские лаборатории",
    title: "Микромир под микроскопом: клетки и материалы",
    date: eventDate(181),
    time: "14:00",
    format: "offline",
    participationFormat: "individual",
    eventType: "workshop",
    ageMin: 11,
    ageMax: 15,
    city: "Санкт-Петербург",
    location: "Научная лаборатория",
    cost: 1900,
    professionalAreas: ["science", "medicine", "engineering"],
    activityFormats: ["research", "individual_work"],
    goal: "Проверить интерес к наблюдению, аккуратности и лабораторной работе",
    sourceUrl: "https://example.com/microscope-world",
    qualityNotes: "Требуется запись заранее.",
    status: "approved"
  },
  {
    sourceTitle: "Центр социальных проектов",
    title: "Наставник на час: придумать занятие для младших",
    date: eventDate(198),
    time: "16:00",
    format: "offline",
    participationFormat: "team",
    eventType: "workshop",
    ageMin: 11,
    ageMax: 15,
    city: "Казань",
    location: "Детская библиотека",
    cost: 0,
    professionalAreas: ["education", "social_projects"],
    activityFormats: ["teamwork", "public_speaking", "helping_people"],
    goal: "Проверить интерес к объяснению, наставничеству и социальным задачам",
    sourceUrl: "https://example.com/mentor-hour",
    qualityNotes: "Нужна готовность к выступлению перед детьми.",
    status: "approved"
  },
  {
    sourceTitle: "Детский технопарк",
    title: "Arduino: датчики, свет и простая автоматизация",
    date: eventDate(215),
    time: "13:00",
    format: "offline",
    participationFormat: "individual",
    eventType: "workshop",
    ageMin: 10,
    ageMax: 14,
    city: "Москва",
    location: "Детский технопарк",
    cost: 2200,
    professionalAreas: ["engineering", "IT"],
    activityFormats: ["making", "individual_work"],
    goal: "Проверить интерес к электронике через быстрый видимый результат",
    sourceUrl: "https://example.com/arduino-sensors",
    qualityNotes: "Хорошо для технической пробы после Scratch/робототехники.",
    status: "approved"
  },
  {
    sourceTitle: "Школа медиа и дизайна",
    title: "Видеоистория: снять и смонтировать короткий ролик",
    date: eventDate(232),
    time: "17:30",
    format: "online",
    participationFormat: "individual",
    eventType: "workshop",
    ageMin: 11,
    ageMax: 15,
    city: "Онлайн",
    cost: 1300,
    professionalAreas: ["media", "design"],
    activityFormats: ["making", "individual_work"],
    goal: "Понять, нравится ли ученику визуальная коммуникация и монтаж",
    sourceUrl: "https://example.com/video-story",
    qualityNotes: "Проверить, есть ли телефон или камера.",
    status: "approved"
  },
  {
    sourceTitle: "Музей науки и технологий",
    title: "Научный стендап для школьников: объяснить сложное просто",
    date: eventDate(249),
    time: "15:00",
    format: "offline",
    participationFormat: "individual",
    eventType: "festival",
    ageMin: 12,
    ageMax: 16,
    city: "Москва",
    location: "Музей науки",
    cost: 500,
    professionalAreas: ["science", "media", "education"],
    activityFormats: ["public_speaking", "research"],
    goal: "Проверить готовность объяснять и выступать на научные темы",
    sourceUrl: "https://example.com/science-standup",
    qualityNotes: "Может быть стрессовым для тихих учеников.",
    status: "draft"
  },
  {
    sourceTitle: "Университетские лаборатории",
    title: "Интенсив: генетика вокруг нас",
    date: eventDate(266),
    time: "12:00",
    format: "offline",
    participationFormat: "with_curator",
    eventType: "project_school",
    ageMin: 12,
    ageMax: 16,
    city: "Санкт-Петербург",
    location: "Биоцентр",
    cost: 4800,
    professionalAreas: ["medicine", "science"],
    activityFormats: ["research", "project_work"],
    goal: "Проверить устойчивость интереса к биологии в более глубоком формате",
    sourceUrl: "https://example.com/genetics-intensive",
    qualityNotes: "Нужна проверка программы и уровня сложности.",
    status: "needs_review"
  },
  {
    sourceTitle: "Онлайн-платформа школьных хакатонов",
    title: "Data-квест: найти закономерности в данных",
    date: eventDate(284),
    time: "11:30",
    format: "online",
    participationFormat: "individual",
    eventType: "workshop",
    ageMin: 11,
    ageMax: 15,
    city: "Онлайн",
    cost: 0,
    professionalAreas: ["IT", "science"],
    activityFormats: ["research", "individual_work"],
    goal: "Проверить интерес к аналитике, данным и поиску закономерностей",
    sourceUrl: "https://example.com/data-quest",
    qualityNotes: "Нужен ноутбук, без сложного кода.",
    status: "approved"
  },
  {
    sourceTitle: "Центр социальных проектов",
    title: "Медиа для добрых дел: кампания социального проекта",
    date: eventDate(302),
    time: "16:30",
    format: "hybrid",
    participationFormat: "team",
    eventType: "project_school",
    ageMin: 11,
    ageMax: 15,
    city: "Казань",
    location: "Молодежный центр",
    cost: 0,
    professionalAreas: ["media", "social_projects", "design"],
    activityFormats: ["teamwork", "project_work", "public_speaking"],
    goal: "Проверить сочетание медиа, дизайна и социальной мотивации",
    sourceUrl: "https://example.com/social-media-campaign",
    qualityNotes: "Есть публичная защита в конце.",
    status: "approved"
  },
  {
    sourceTitle: "Детский технопарк",
    title: "Проект: умная теплица на датчиках",
    date: eventDate(320),
    time: "13:00",
    format: "offline",
    participationFormat: "team",
    eventType: "project_school",
    ageMin: 11,
    ageMax: 15,
    city: "Москва",
    location: "Детский технопарк",
    cost: 3600,
    professionalAreas: ["engineering", "science", "IT"],
    activityFormats: ["teamwork", "making", "project_work"],
    goal: "Проверить интерес на стыке инженерии, биологии и цифровых технологий",
    sourceUrl: "https://example.com/smart-greenhouse",
    qualityNotes: "Хороший междисциплинарный формат.",
    status: "approved"
  },
  {
    sourceTitle: "Школа медиа и дизайна",
    title: "UX-разбор: почему приложением удобно пользоваться",
    date: eventDate(338),
    time: "18:00",
    format: "online",
    participationFormat: "team",
    eventType: "workshop",
    ageMin: 12,
    ageMax: 16,
    city: "Онлайн",
    cost: 1000,
    professionalAreas: ["design", "IT", "media"],
    activityFormats: ["teamwork", "research"],
    goal: "Проверить интерес к пользовательскому опыту и анализу продуктов",
    sourceUrl: "https://example.com/ux-review",
    qualityNotes: "Не требует рисования, больше про наблюдение и аргументацию.",
    status: "approved"
  },
  {
    sourceTitle: "Центр социальных проектов",
    title: "Дебаты: город, школа и правила",
    date: eventDate(356),
    time: "17:00",
    format: "offline",
    participationFormat: "team",
    eventType: "club",
    ageMin: 12,
    ageMax: 16,
    city: "Казань",
    location: "Образовательный центр",
    cost: 0,
    professionalAreas: ["law", "humanities", "social_projects"],
    activityFormats: ["public_speaking", "teamwork"],
    goal: "Проверить интерес к аргументации, праву и общественным темам",
    sourceUrl: "https://example.com/city-debates",
    qualityNotes: "Подходит ученикам с готовностью говорить и спорить.",
    status: "approved"
  },
  {
    sourceTitle: "Музей науки и технологий",
    title: "Экодизайн: придумать предмет из вторичных материалов",
    date: eventDate(378),
    time: "14:00",
    format: "offline",
    participationFormat: "individual",
    eventType: "workshop",
    ageMin: 10,
    ageMax: 14,
    city: "Москва",
    location: "Музей науки",
    cost: 1100,
    professionalAreas: ["design", "engineering", "social_projects"],
    activityFormats: ["making", "individual_work"],
    goal: "Проверить интерес к созданию предметов и экологической теме",
    sourceUrl: "https://example.com/eco-design",
    qualityNotes: "Хорошо для творческо-прикладной пробы.",
    status: "approved"
  },
  {
    sourceTitle: "Онлайн-платформа школьных хакатонов",
    title: "Финальный проект: цифровой помощник для семьи",
    date: eventDate(420),
    time: "11:00",
    format: "online",
    participationFormat: "team",
    eventType: "hackathon",
    ageMin: 11,
    ageMax: 16,
    city: "Онлайн",
    cost: 0,
    professionalAreas: ["IT", "entrepreneurship", "social_projects"],
    activityFormats: ["teamwork", "project_work", "competition"],
    goal: "Проверить продуктовый интерес и командное создание решения",
    sourceUrl: "https://example.com/family-helper",
    qualityNotes: "Можно назначать после 1-2 более мягких IT-проб.",
    status: "approved"
  },
  {
    sourceTitle: "Университетские лаборатории",
    title: "Наука о спорте: движение, пульс и восстановление",
    date: eventDate(470),
    time: "12:30",
    format: "offline",
    participationFormat: "team",
    eventType: "workshop",
    ageMin: 11,
    ageMax: 15,
    city: "Санкт-Петербург",
    location: "Спортивная лаборатория",
    cost: 1700,
    professionalAreas: ["sport", "medicine", "science"],
    activityFormats: ["research", "teamwork"],
    goal: "Проверить область спорта и здоровья через измерения и исследование",
    sourceUrl: "https://example.com/sport-science",
    qualityNotes: "Мягкая проба для направления sport/medicine.",
    status: "approved"
  },
  {
    sourceTitle: "Школа медиа и дизайна",
    title: "Курс выходного дня: бренд школьного проекта",
    date: eventDate(525),
    time: "13:00",
    format: "online",
    participationFormat: "team",
    eventType: "project_school",
    ageMin: 12,
    ageMax: 16,
    city: "Онлайн",
    cost: 2400,
    professionalAreas: ["design", "entrepreneurship", "media"],
    activityFormats: ["teamwork", "project_work", "public_speaking"],
    goal: "Проверить интерес к упаковке идей, дизайну и презентации",
    sourceUrl: "https://example.com/project-brand",
    qualityNotes: "Есть защита проекта, учитывать готовность к выступлению.",
    status: "approved"
  }
];

async function upsertSource(source: DemoSource) {
  const existing = await prisma.eventSource.findFirst({ where: { url: source.url } });

  if (existing) {
    return prisma.eventSource.update({
      where: { id: existing.id },
      data: {
        title: source.title,
        city: source.city,
        focusAreasJson: json(source.focusAreas),
        comment: source.comment,
        isActive: true
      }
    });
  }

  return prisma.eventSource.create({
    data: {
      title: source.title,
      url: source.url,
      city: source.city,
      focusAreasJson: json(source.focusAreas),
      comment: source.comment,
      isActive: true
    }
  });
}

async function upsertEvent(event: DemoEvent, sourceId: string) {
  const existing = await prisma.event.findFirst({ where: { title: event.title } });
  const data = {
    sourceId,
    title: event.title,
    date: new Date(event.date),
    time: event.time,
    format: event.format,
    participationFormat: event.participationFormat,
    eventType: event.eventType,
    ageMin: event.ageMin,
    ageMax: event.ageMax,
    city: event.city,
    location: event.location,
    cost: event.cost,
    professionalAreasJson: json(event.professionalAreas),
    activityFormatsJson: json(event.activityFormats),
    goal: event.goal,
    sourceUrl: event.sourceUrl,
    qualityNotes: event.qualityNotes,
    status: event.status
  };

  if (existing) {
    await prisma.event.update({ where: { id: existing.id }, data });
    return "updated";
  }

  await prisma.event.create({ data });
  return "created";
}

async function main() {
  const sourceByTitle = new Map<string, string>();

  for (const source of sources) {
    const saved = await upsertSource(source);
    sourceByTitle.set(source.title, saved.id);
  }

  let created = 0;
  let updated = 0;

  for (const event of events) {
    const sourceId = sourceByTitle.get(event.sourceTitle);

    if (!sourceId) {
      throw new Error(`Source not found for event: ${event.title}`);
    }

    const result = await upsertEvent(event, sourceId);

    if (result === "created") {
      created += 1;
    } else {
      updated += 1;
    }
  }

  const totalEvents = await prisma.event.count();
  const approvedEvents = await prisma.event.count({ where: { status: "approved" } });

  console.log(`Demo events synced: ${created} created, ${updated} updated.`);
  console.log(`Total events: ${totalEvents}. Approved events: ${approvedEvents}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
