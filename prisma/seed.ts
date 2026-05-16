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
  await prisma.student.deleteMany();

  const student = await prisma.student.create({
    data: {
      name: "Алиса Морозова",
      age: 12,
      grade: "6 класс",
      city: "Москва",
      school: "Private.Education",
      parentName: "Елена Морозова",
      curatorName: "Мария Сергеева",
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

  const events = await prisma.event.createManyAndReturn({
    data: [
      {
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
        status: "approved"
      },
      {
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
        status: "draft"
      },
      {
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
        status: "approved"
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
