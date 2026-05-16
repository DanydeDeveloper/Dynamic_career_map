"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { professionalAreas } from "@/lib/constants";
import { generateCareerStrategyDraft, generateFeedbackProposals } from "@/lib/ai";
import { parseJson } from "@/lib/format";
import { visibilityLevel } from "@/lib/visibility";

const json = (value: unknown) => JSON.stringify(value);

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value.length > 0 ? value : null;
}

function intValue(formData: FormData, key: string, fallback = 0) {
  const value = Number.parseInt(String(formData.get(key) ?? ""), 10);
  return Number.isFinite(value) ? value : fallback;
}

function checkedValues(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => String(value));
}

function scoreMapFromAreas(formData: FormData, prefix: string) {
  return Object.fromEntries(
    professionalAreas.map((area) => [area.key, intValue(formData, `${prefix}_${area.key}`, 1)])
  );
}

function defaultInclinations(formData: FormData) {
  return {
    analytical_thinking: intValue(formData, "analytical_thinking", 5),
    creative_thinking: intValue(formData, "creative_thinking", 5),
    communication: intValue(formData, "communication", 5),
    research_orientation: intValue(formData, "research_orientation", 5),
    practical_making: intValue(formData, "practical_making", 5)
  };
}

function defaultActivityFormats(formData: FormData) {
  return {
    teamwork: intValue(formData, "teamwork", 5),
    individual_work: intValue(formData, "individual_work", 5),
    competition: intValue(formData, "competition", 5),
    project_work: intValue(formData, "project_work", 5),
    public_speaking: intValue(formData, "public_speaking", 5)
  };
}

function stabilityFromInterests(interests: Record<string, number>) {
  return Object.fromEntries(
    Object.entries(interests).map(([area, score]) => {
      if (score >= 8) return [area, "growing"];
      if (score >= 6) return [area, "unstable"];
      if (score <= 2) return [area, "not_checked"];
      return [area, "low"];
    })
  );
}

function firstDateTime(date: string) {
  if (!date) {
    return new Date();
  }

  return new Date(`${date}T00:00:00.000Z`);
}

export async function createStudentAction(formData: FormData) {
  const name = text(formData, "name");
  if (!name) {
    throw new Error("Нужно указать имя ученика.");
  }

  const student = await prisma.student.create({
    data: {
      name,
      age: intValue(formData, "age", 11),
      grade: text(formData, "grade") || "5 класс",
      city: text(formData, "city") || "Москва",
      school: optionalText(formData, "school"),
      parentName: optionalText(formData, "parentName"),
      curatorName: optionalText(formData, "curatorName") || "Педагог"
    }
  });

  revalidatePath("/");
  revalidatePath("/students");
  redirect(`/students/${student.id}/diagnostics`);
}

export async function saveStudentDiagnosticAction(formData: FormData) {
  const studentId = text(formData, "studentId");
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      parentRequest: true,
      visibility: true
    }
  });

  if (!student) {
    throw new Error("Ученик не найден.");
  }

  const interests = scoreMapFromAreas(formData, "interest");
  const inclinations = defaultInclinations(formData);
  const activityFormats = defaultActivityFormats(formData);
  const stability = stabilityFromInterests(interests);
  const likedActivities = text(formData, "likedActivities");
  const subjects = text(formData, "subjects");
  const experience = text(formData, "experience");
  const topAreas = Object.entries(interests)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([area]) => area);

  const visibility = Object.fromEntries(student.visibility.map((item) => [item.area, item.score]));
  const strategy = await generateCareerStrategyDraft({
    studentName: student.name,
    interests,
    visibility,
    parentExpectations: student.parentRequest?.expectations
  });

  await prisma.studentProfile.upsert({
    where: { studentId },
    update: {
      interestsJson: json(interests),
      inclinationsJson: json(inclinations),
      activityFormatsJson: json(activityFormats),
      stabilityJson: json(stability),
      summaryText:
        text(formData, "summaryText") ||
        `По диагностике у ученика выделяются направления: ${topAreas.join(", ")}. Важно проверять интересы через разные форматы и не сужать траекторию после одной пробы.`,
      curatorComment:
        text(formData, "curatorComment") ||
        `Любимые занятия: ${likedActivities || "не указано"}. Предметы: ${subjects || "не указано"}. Опыт: ${experience || "не указан"}.`
    },
    create: {
      studentId,
      interestsJson: json(interests),
      inclinationsJson: json(inclinations),
      activityFormatsJson: json(activityFormats),
      stabilityJson: json(stability),
      summaryText:
        text(formData, "summaryText") ||
        `По диагностике у ученика выделяются направления: ${topAreas.join(", ")}. Важно проверять интересы через разные форматы и не сужать траекторию после одной пробы.`,
      curatorComment:
        text(formData, "curatorComment") ||
        `Любимые занятия: ${likedActivities || "не указано"}. Предметы: ${subjects || "не указано"}. Опыт: ${experience || "не указан"}.`
    }
  });

  await prisma.careerStrategy.upsert({
    where: { studentId },
    update: {
      strategySummary: strategy.strategySummary,
      mainHypothesesJson: json(strategy.mainHypotheses),
      areasToExpandJson: json(strategy.areasToExpand),
      areasToCheckJson: json(strategy.areasToCheck),
      recommendedFormatsJson: json(strategy.recommendedFormats),
      risksJson: json(strategy.risks),
      next3MonthsFocus: strategy.next3MonthsFocus,
      next12MonthsFocus: strategy.next12MonthsFocus
    },
    create: {
      studentId,
      strategySummary: strategy.strategySummary,
      mainHypothesesJson: json(strategy.mainHypotheses),
      areasToExpandJson: json(strategy.areasToExpand),
      areasToCheckJson: json(strategy.areasToCheck),
      recommendedFormatsJson: json(strategy.recommendedFormats),
      risksJson: json(strategy.risks),
      next3MonthsFocus: strategy.next3MonthsFocus,
      next12MonthsFocus: strategy.next12MonthsFocus
    }
  });

  for (const area of professionalAreas) {
    await prisma.careerVisibility.upsert({
      where: {
        studentId_area: {
          studentId,
          area: area.key
        }
      },
      update: {},
      create: {
        studentId,
        area: area.key,
        score: 0,
        level: "низкая",
        evidenceJson: json([])
      }
    });
  }

  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  redirect(`/students/${studentId}`);
}

export async function saveParentRequestAction(formData: FormData) {
  const studentId = text(formData, "studentId");
  const expectations = text(formData, "expectations");

  if (!studentId || !expectations) {
    throw new Error("Нужно выбрать ученика и заполнить ожидания.");
  }

  await prisma.parentRequest.upsert({
    where: { studentId },
    update: {
      expectations,
      preferredAreasJson: json(checkedValues(formData, "preferredAreas")),
      restrictedAreasJson: json(checkedValues(formData, "restrictedAreas")),
      budget: intValue(formData, "budget", 0),
      availableTime: optionalText(formData, "availableTime"),
      comment: optionalText(formData, "comment")
    },
    create: {
      studentId,
      expectations,
      preferredAreasJson: json(checkedValues(formData, "preferredAreas")),
      restrictedAreasJson: json(checkedValues(formData, "restrictedAreas")),
      budget: intValue(formData, "budget", 0),
      availableTime: optionalText(formData, "availableTime"),
      comment: optionalText(formData, "comment")
    }
  });

  revalidatePath(`/students/${studentId}`);
  revalidatePath(`/students/${studentId}/diagnostics`);
}

export async function createEventAction(formData: FormData) {
  await prisma.event.create({
    data: {
      title: text(formData, "title"),
      date: firstDateTime(text(formData, "date")),
      time: text(formData, "time") || "12:00",
      format: text(formData, "format") || "offline",
      participationFormat: text(formData, "participationFormat") || "individual",
      eventType: text(formData, "eventType") || "workshop",
      ageMin: intValue(formData, "ageMin", 10),
      ageMax: intValue(formData, "ageMax", 14),
      city: text(formData, "city") || "Москва",
      location: optionalText(formData, "location"),
      cost: intValue(formData, "cost", 0),
      professionalAreasJson: json(checkedValues(formData, "professionalAreas")),
      activityFormatsJson: json(checkedValues(formData, "activityFormats")),
      goal: text(formData, "goal") || "Проверить интерес через профессиональную пробу",
      sourceUrl: optionalText(formData, "sourceUrl"),
      status: text(formData, "status") || "approved"
    }
  });

  revalidatePath("/events");
  redirect("/events");
}

export async function assignEventToStudentAction(formData: FormData) {
  const studentId = text(formData, "studentId");
  const eventId = text(formData, "eventId");

  if (!studentId || !eventId) {
    throw new Error("Нужно выбрать ученика и мероприятие.");
  }

  await prisma.studentEventMap.upsert({
    where: {
      studentId_eventId: {
        studentId,
        eventId
      }
    },
    update: {
      priority: text(formData, "priority") || "recommended",
      goalForStudent: text(formData, "goalForStudent") || "Проверить гипотезу интереса",
      curatorComment: optionalText(formData, "curatorComment")
    },
    create: {
      studentId,
      eventId,
      priority: text(formData, "priority") || "recommended",
      goalForStudent: text(formData, "goalForStudent") || "Проверить гипотезу интереса",
      curatorComment: optionalText(formData, "curatorComment"),
      status: "planned"
    }
  });

  revalidatePath("/");
  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  redirect(`/students/${studentId}`);
}

export async function submitFeedbackAction(formData: FormData) {
  const studentId = text(formData, "studentId");
  const eventId = text(formData, "eventId");
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!studentId || !event) {
    throw new Error("Нужно выбрать ученика и мероприятие.");
  }

  const eventAreas = parseJson<string[]>(event.professionalAreasJson, []);
  const eventFormats = parseJson<string[]>(event.activityFormatsJson, []);
  const interestScore = intValue(formData, "interestScore", 5);
  const engagementScore = intValue(formData, "engagementScore", 5);
  const fatigueScore = intValue(formData, "fatigueScore", 5);
  const wantContinue = text(formData, "wantContinue") as "yes" | "no" | "not_sure";

  await prisma.eventFeedback.create({
    data: {
      studentId,
      eventId,
      interestScore,
      difficultyScore: intValue(formData, "difficultyScore", 5),
      engagementScore,
      fatigueScore,
      wantContinue,
      liked: optionalText(formData, "liked"),
      disliked: optionalText(formData, "disliked"),
      learned: optionalText(formData, "learned"),
      wantTryNext: optionalText(formData, "wantTryNext"),
      tagsJson: json(checkedValues(formData, "tags"))
    }
  });

  await prisma.studentEventMap.updateMany({
    where: { studentId, eventId },
    data: { status: "feedback_completed" }
  });

  const proposals = await generateFeedbackProposals({
    interestScore,
    engagementScore,
    fatigueScore,
    wantContinue,
    eventAreas,
    eventFormats
  });

  await prisma.changeProposal.createMany({
    data: proposals.map((proposal) => ({
      studentId,
      triggerEventId: eventId,
      proposalType: proposal.proposalType,
      description: proposal.description,
      oldValue: proposal.oldValue,
      newValue: proposal.newValue,
      reason: proposal.reason,
      status: "pending"
    }))
  });

  revalidatePath("/");
  revalidatePath("/approvals");
  revalidatePath(`/students/${studentId}`);
  redirect("/approvals");
}

export async function updateProposalStatusAction(formData: FormData) {
  const proposalId = text(formData, "proposalId");
  const status = text(formData, "status");

  const proposal = await prisma.changeProposal.update({
    where: { id: proposalId },
    data: {
      status,
      approvedBy: status === "approved" || status === "edited" ? "Педагог" : null,
      approvedAt: status === "approved" || status === "edited" ? new Date() : null
    },
    include: {
      triggerEvent: true
    }
  });

  if ((status === "approved" || status === "edited") && proposal.proposalType === "update_visibility" && proposal.triggerEvent) {
    const eventAreas = parseJson<string[]>(proposal.triggerEvent.professionalAreasJson, []);

    for (const area of eventAreas) {
      const existing = await prisma.careerVisibility.findUnique({
        where: {
          studentId_area: {
            studentId: proposal.studentId,
            area
          }
        }
      });
      const evidence = parseJson<string[]>(existing?.evidenceJson ?? "[]", []);
      const nextScore = Math.min((existing?.score ?? 0) + 5, 100);

      await prisma.careerVisibility.upsert({
        where: {
          studentId_area: {
            studentId: proposal.studentId,
            area
          }
        },
        update: {
          score: nextScore,
          level: visibilityLevel(nextScore),
          evidenceJson: json([...new Set([...evidence, proposal.triggerEvent.title])])
        },
        create: {
          studentId: proposal.studentId,
          area,
          score: nextScore,
          level: visibilityLevel(nextScore),
          evidenceJson: json([proposal.triggerEvent.title])
        }
      });
    }
  }

  revalidatePath("/approvals");
  revalidatePath("/");
  revalidatePath(`/students/${proposal.studentId}`);
}
