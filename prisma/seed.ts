process.env.DATABASE_URL ||= "postgresql://postgres:postgres@localhost:5432/dynamic_career_map";

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const json = (value: unknown) => JSON.stringify(value);

async function main() {
  await prisma.changeProposal.deleteMany();
  await prisma.eventFeedback.deleteMany();
  await prisma.studentEventMap.deleteMany();
  await prisma.careerVisibility.deleteMany();
  await prisma.careerStrategy.deleteMany();
  await prisma.pastActivity.deleteMany();
  await prisma.parentRequest.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.event.deleteMany();
  await prisma.eventSource.deleteMany();
  await prisma.student.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const [admin, curator, parent, studentUser] = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@private.education",
        name: "Администратор",
        role: "ADMIN",
        passwordHash
      }
    }),
    prisma.user.create({
      data: {
        email: "curator@private.education",
        name: "Мария Сергеева",
        role: "CURATOR",
        passwordHash
      }
    }),
    prisma.user.create({
      data: {
        email: "parent@example.com",
        name: "Елена Морозова",
        role: "PARENT",
        passwordHash
      }
    }),
    prisma.user.create({
      data: {
        email: "student@example.com",
        name: "Алиса Морозова",
        role: "STUDENT",
        passwordHash
      }
    })
  ]);

  const student = await prisma.student.create({
    data: {
      name: "Алиса Морозова",
      age: 12,
      grade: "6 класс",
      city: "Москва",
      school: "Private.Education",
      parentName: parent.name,
      curatorName: curator.name,
      parentId: parent.id,
      curatorId: curator.id,
      userId: studentUser.id,
      profile: {
        create: {
          interestsJson: json({ IT: 7, engineering: 6, science: 5, design: 4, medicine: 2 }),
          inclinationsJson: json({
            analytical_thinking: 8,
            creative_thinking: 6,
            communication: 5,
            research_orientation: 7,
            practical_making: 8
          }),
          activityFormatsJson: json({
            teamwork: 8,
            individual_work: 5,
            competition: 6,
            project_work: 9,
            public_speaking: 4
          }),
          stabilityJson: json({ IT: "growing", engineering: "unstable", science: "not_checked" }),
          summaryText:
            "Алиса уверенно откликается на практические и проектные форматы. Сейчас выражен интерес к цифровым продуктам и инженерным задачам, но траекторию важно не сужать только до IT.",
          curatorComment: "Проверить инженерные и естественно-научные форматы через практику, не через лекции."
        }
      },
      parentRequest: {
        create: {
          expectations: "Понять, какие направления действительно интересны ребенку, и подобрать умеренную нагрузку.",
          preferredAreasJson: json(["IT", "engineering", "science"]),
          restrictedAreasJson: json(["sport"]),
          budget: 12000,
          availableTime: "Вечера будней, суббота до 16:00",
          comment: "Семья хочет избежать перегруза и сохранить интерес к учебе."
        }
      },
      pastActivities: {
        create: [
          {
            title: "Кружок Scratch",
            activityType: "club",
            area: "IT",
            period: "2024-2025",
            result: "Собрала простую игру",
            studentReaction: "Понравилось делать видимый результат",
            parentComment: "Интерес держался почти весь год"
          },
          {
            title: "Городской фестиваль науки",
            activityType: "festival",
            area: "science",
            period: "осень 2025",
            result: "Посетила стенды по химии и робототехнике",
            studentReaction: "Запомнились опыты, лекции быстро утомили"
          }
        ]
      },
      visibility: {
        create: [
          { area: "IT", score: 65, level: "средняя", evidenceJson: json(["Scratch", "мини-хакатон"]) },
          { area: "engineering", score: 40, level: "базовая", evidenceJson: json(["фестиваль науки"]) },
          { area: "science", score: 30, level: "базовая", evidenceJson: json(["опыты на фестивале"]) },
          { area: "medicine", score: 10, level: "низкая", evidenceJson: json([]) },
          { area: "design", score: 25, level: "базовая", evidenceJson: json(["школьные творческие проекты"]) }
        ]
      },
      strategy: {
        create: {
          strategySummary:
            "В ближайшие 3 месяца стоит расширить насмотренность в инженерии и естественных науках через практические форматы, сохраняя IT как сильную, но не единственную линию.",
          mainHypothesesJson: json([
            "Интерес усиливается, когда есть проектный результат",
            "Лекционный формат снижает вовлеченность",
            "Командные задачи могут поддерживать мотивацию"
          ]),
          areasToExpandJson: json(["engineering", "science", "design"]),
          areasToCheckJson: json(["medicine", "social_projects"]),
          recommendedFormatsJson: json(["workshop", "project_school", "excursion"]),
          risksJson: json(["Слишком раннее сужение до IT", "Перегруз при частых мероприятиях"]),
          next3MonthsFocus: "1-2 практических события в инженерии, одно естественно-научное мероприятие и короткая проектная проба.",
          next12MonthsFocus: "Собрать сбалансированную карту проб: IT, инженерия, наука, творческо-прикладная область и социальный проект."
        }
      }
    }
  });

  await prisma.diagnosticSession.create({
    data: {
      studentId: student.id,
      authorId: curator.id,
      source: "seed",
      status: "applied",
      likedActivities: "Делать игры, собирать модели и решать практические задачи",
      subjects: "Математика, технология, биология",
      experience: "Scratch, городской фестиваль науки, школьные творческие проекты",
      rawAnswersJson: json({
        likedActivities: "Делать игры, собирать модели и решать практические задачи",
        subjects: "Математика, технология, биология",
        experience: "Scratch, городской фестиваль науки, школьные творческие проекты"
      }),
      interestsJson: json({ IT: 7, engineering: 6, science: 5, design: 4, medicine: 2 }),
      inclinationsJson: json({
        analytical_thinking: 8,
        creative_thinking: 6,
        communication: 5,
        research_orientation: 7,
        practical_making: 8
      }),
      activityFormatsJson: json({
        teamwork: 8,
        individual_work: 5,
        competition: 6,
        project_work: 9,
        public_speaking: 4
      }),
      stabilityJson: json({ IT: "growing", engineering: "unstable", science: "not_checked" }),
      summaryText:
        "Алиса уверенно откликается на практические и проектные форматы. Сейчас выражен интерес к цифровым продуктам и инженерным задачам, но траекторию важно не сужать только до IT.",
      curatorComment:
        "Проверить инженерные и естественно-научные форматы через практику, не через лекции.",
      appliedToProfileAt: new Date()
    }
  });

  const sources = await prisma.eventSource.createManyAndReturn({
    data: [
      {
        title: "Детский технопарк",
        url: "https://example.com/technopark",
        city: "Москва",
        focusAreasJson: json(["engineering", "IT"]),
        comment: "Проверять мастер-классы и проектные смены раз в неделю."
      },
      {
        title: "Университетские лаборатории",
        url: "https://example.com/university-labs",
        city: "Санкт-Петербург",
        focusAreasJson: json(["science", "medicine"]),
        comment: "Хороший источник экскурсий и коротких исследовательских проб."
      },
      {
        title: "Онлайн-платформа школьных хакатонов",
        url: "https://example.com/hackathons",
        city: "Онлайн",
        focusAreasJson: json(["IT", "entrepreneurship"]),
        comment: "Отбирать только события с понятным возрастом и безопасной командной модерацией."
      }
    ]
  });

  const events = await prisma.event.createManyAndReturn({
    data: [
      {
        sourceId: sources[0].id,
        title: "Инженерный мастер-класс: умный дом",
        date: new Date("2026-06-08T10:00:00.000Z"),
        time: "13:00",
        format: "offline",
        participationFormat: "team",
        eventType: "workshop",
        ageMin: 10,
        ageMax: 14,
        city: "Москва",
        location: "Детский технопарк",
        cost: 2500,
        professionalAreasJson: json(["engineering", "IT"]),
        activityFormatsJson: json(["teamwork", "making", "project_work"]),
        goal: "Проверить интерес к инженерии через практическую сборку",
        sourceUrl: "https://example.com/smart-home",
        qualityNotes: "Проверены возраст, стоимость и очная площадка.",
        status: "approved"
      },
      {
        sourceId: sources[1].id,
        title: "Лаборатория биотехнологий для школьников",
        date: new Date("2026-07-14T10:00:00.000Z"),
        time: "12:00",
        format: "offline",
        participationFormat: "individual",
        eventType: "excursion",
        ageMin: 11,
        ageMax: 15,
        city: "Санкт-Петербург",
        location: "Университетская лаборатория",
        cost: 0,
        professionalAreasJson: json(["medicine", "science"]),
        activityFormatsJson: json(["research", "helping_people"]),
        goal: "Аккуратно проверить почти не изученную область медицины",
        sourceUrl: "https://example.com/biotech",
        qualityNotes: "Нужно уточнить длительность и сопровождающего взрослого.",
        status: "needs_review"
      },
      {
        sourceId: sources[2].id,
        title: "Онлайн-хакатон школьных цифровых проектов",
        date: new Date("2026-08-21T10:00:00.000Z"),
        time: "11:00",
        format: "online",
        participationFormat: "team",
        eventType: "hackathon",
        ageMin: 11,
        ageMax: 16,
        city: "Онлайн",
        location: "Онлайн",
        cost: 0,
        professionalAreasJson: json(["IT", "entrepreneurship"]),
        activityFormatsJson: json(["teamwork", "project_work", "competition"]),
        goal: "Проверить интерес к командному созданию продукта",
        sourceUrl: "https://example.com/hackathon",
        qualityNotes: "Проверить дедлайн регистрации перед назначением.",
        status: "approved"
      },
      {
        sourceId: sources[0].id,
        title: "Демо-день робототехники",
        date: new Date("2026-09-12T10:00:00.000Z"),
        time: "15:00",
        format: "offline",
        participationFormat: "family",
        eventType: "festival",
        ageMin: 10,
        ageMax: 14,
        city: "Москва",
        location: "Детский технопарк",
        cost: 0,
        professionalAreasJson: json(["engineering", "IT"]),
        activityFormatsJson: json(["making", "public_speaking"]),
        goal: "Расширить насмотренность без высокой нагрузки",
        sourceUrl: "https://example.com/robotics-demo",
        qualityNotes: "Черновик из источника: нужна проверка программы.",
        status: "draft"
      }
    ]
  });

  await prisma.studentEventMap.createMany({
    data: [
      {
        studentId: student.id,
        eventId: events[0].id,
        priority: "required",
        status: "planned",
        goalForStudent: "Проверить инженерную гипотезу через практику",
        curatorComment: "Важно обсудить после события, что было интереснее: сборка, командность или идея продукта."
      },
      {
        studentId: student.id,
        eventId: events[2].id,
        priority: "recommended",
        status: "planned",
        goalForStudent: "Расширить IT-интерес до командной разработки продукта"
      }
    ]
  });

  await prisma.changeProposal.create({
    data: {
      studentId: student.id,
      triggerEventId: events[0].id,
      proposalType: "update_strategy",
      description: "После инженерного мастер-класса уточнить, поддерживает ли практический формат интерес к инженерии.",
      oldValue: "Инженерия отмечена как нестабильный интерес",
      newValue: "Оставить инженерию в зоне проверки через практические форматы",
      reason: "Есть предварительный интерес к созданию предметного результата, но данных пока недостаточно для усиления области.",
      status: "pending"
    }
  });

  console.log("Seed users:");
  console.log(`- ${admin.email} / password123`);
  console.log(`- ${curator.email} / password123`);
  console.log(`- ${parent.email} / password123`);
  console.log(`- ${studentUser.email} / password123`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
