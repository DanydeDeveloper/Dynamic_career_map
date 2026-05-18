"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { professionalAreas } from "@/lib/constants";
import { canManageApprovals, canManageEvents, canManageStudents, requireUser } from "@/lib/authz";
import {
  generateDiagnosticInsightsDraft,
  generateEventAssignmentDraft,
  generateFeedbackAnalysis,
  generateFeedbackProposals,
  generateSnapshotComparison
} from "@/lib/ai";
import {
  createAuditLog,
  createStudentSnapshot,
  getStudentAuditState,
  pickStudentAuditTarget,
  proposalDraftSource
} from "@/lib/audit-log";
import { parseJson } from "@/lib/format";
import { applyApprovedProposal } from "@/lib/proposal-application";
import { scoreEventForStudent } from "@/lib/event-matching";

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

async function createStudentAiInsight(input: {
  studentId: string;
  actorId?: string | null;
  insightType: string;
  source: string;
  title: string;
  summary: string;
  evidence?: string[];
  recommendations?: string[];
  risks?: string[];
  nextQuestions?: string[];
  relatedType?: string | null;
  relatedId?: string | null;
  metadata?: unknown;
}) {
  const insight = await prisma.studentAiInsight.create({
    data: {
      studentId: input.studentId,
      actorId: input.actorId ?? null,
      insightType: input.insightType,
      source: input.source,
      title: input.title,
      summary: input.summary,
      evidenceJson: json(input.evidence ?? []),
      recommendationsJson: json(input.recommendations ?? []),
      risksJson: json(input.risks ?? []),
      nextQuestionsJson: json(input.nextQuestions ?? []),
      relatedType: input.relatedType ?? null,
      relatedId: input.relatedId ?? null,
      metadataJson: json(input.metadata ?? {})
    }
  });

  await createAuditLog({
    studentId: input.studentId,
    actorId: input.actorId,
    action: "ai_insight.generated",
    targetType: "ai_insight",
    targetId: insight.id,
    source: input.source,
    summary: `AI-черновик создан: ${input.title}.`,
    after: {
      insightType: input.insightType,
      title: input.title,
      summary: input.summary
    },
    metadata: {
      relatedType: input.relatedType,
      relatedId: input.relatedId
    }
  });

  return insight;
}

export async function createStudentAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageStudents(user.role)) {
    throw new Error("Недостаточно прав для создания ученика.");
  }

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
      curatorName: optionalText(formData, "curatorName") || user.name || "Куратор",
      curatorId: user.id
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/students");
  redirect(`/students/${student.id}/diagnostics`);
}

export async function saveStudentDiagnosticAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageStudents(user.role)) {
    throw new Error("Недостаточно прав для редактирования диагностики.");
  }

  const studentId = text(formData, "studentId");
  const student = await prisma.student.findUnique({
    where: { id: studentId, ...(user.role === "ADMIN" ? {} : { curatorId: user.id }) },
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
  const visibility = Object.fromEntries(student.visibility.map((item) => [item.area, item.score]));
  const insights = await generateDiagnosticInsightsDraft({
    studentName: student.name,
    age: student.age,
    grade: student.grade,
    city: student.city,
    interests,
    inclinations,
    activityFormats,
    stability,
    visibility,
    parentExpectations: student.parentRequest?.expectations,
    likedActivities,
    subjects,
    experience
  });
  const summaryText = text(formData, "summaryText") || insights.profileSummary;
  const curatorComment = text(formData, "curatorComment") || insights.curatorComment;
  const strategy = insights.strategy;
  const draftSource = insights.source === "ai" ? "claude" : "rule_based";
  const beforeState = await getStudentAuditState(studentId);

  const diagnostic = await prisma.diagnosticSession.create({
    data: {
      studentId,
      authorId: user.id,
      source: "curator_form",
      status: "applied",
      likedActivities: likedActivities || null,
      subjects: subjects || null,
      experience: experience || null,
      rawAnswersJson: json({
        likedActivities,
        subjects,
        experience,
        summaryText: text(formData, "summaryText"),
        curatorComment: text(formData, "curatorComment"),
        generatedDraftSource: insights.source
      }),
      interestsJson: json(interests),
      inclinationsJson: json(inclinations),
      activityFormatsJson: json(activityFormats),
      stabilityJson: json(stability),
      summaryText,
      curatorComment,
      appliedToProfileAt: new Date()
    }
  });

  await prisma.studentProfile.upsert({
    where: { studentId },
    update: {
      interestsJson: json(interests),
      inclinationsJson: json(inclinations),
      activityFormatsJson: json(activityFormats),
      stabilityJson: json(stability),
      summaryText,
      curatorComment
    },
    create: {
      studentId,
      interestsJson: json(interests),
      inclinationsJson: json(inclinations),
      activityFormatsJson: json(activityFormats),
      stabilityJson: json(stability),
      summaryText,
      curatorComment
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

  const afterState = await getStudentAuditState(studentId);

  await createAuditLog({
    studentId,
    actorId: user.id,
    action: "diagnostic.applied",
    targetType: "profile",
    targetId: studentId,
    source: "diagnostic",
    summary: "Диагностика применена к профилю и стратегии ученика.",
    before: {
      profile: beforeState?.profile,
      strategy: beforeState?.strategy
    },
    after: {
      profile: afterState?.profile,
      strategy: afterState?.strategy
    },
    metadata: {
      diagnosticId: diagnostic.id,
      draftSource
    }
  });

  await createStudentSnapshot({
    studentId,
    actorId: user.id,
    snapshotType: "diagnostic",
    stage: "before",
    source: "diagnostic",
    relatedType: "diagnostic",
    relatedId: diagnostic.id,
    reason: "До применения диагностики к профилю.",
    state: beforeState,
    metadata: { draftSource }
  });

  await createStudentSnapshot({
    studentId,
    actorId: user.id,
    snapshotType: "diagnostic",
    stage: "after",
    source: "diagnostic",
    relatedType: "diagnostic",
    relatedId: diagnostic.id,
    reason: "После применения диагностики к профилю.",
    state: afterState,
    metadata: { draftSource }
  });

  const topInterestEvidence = Object.entries(interests)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([area, score]) => `${area}: ${score}/10`);

  await createStudentAiInsight({
    studentId,
    actorId: user.id,
    insightType: "diagnostic_interpretation",
    source: draftSource,
    title: "Интерпретация диагностики",
    summary: insights.profileSummary,
    evidence: [
      ...topInterestEvidence,
      likedActivities ? `Нравится: ${likedActivities}` : "Любимые занятия не указаны",
      subjects ? `Предметы: ${subjects}` : "Интересные предметы не указаны"
    ],
    recommendations: [
      strategy.next3MonthsFocus,
      ...strategy.mainHypotheses.slice(0, 3),
      ...strategy.recommendedFormats.slice(0, 2).map((format) => `Проверить формат: ${format}`)
    ],
    risks: strategy.risks,
    nextQuestions: [
      "Какая гипотеза должна быть проверена ближайшим мероприятием?",
      "Какие форматы активности дают больше энергии, а какие утомляют?",
      "Что стоит обсудить с родителем перед назначением следующей профпробы?"
    ],
    relatedType: "diagnostic",
    relatedId: diagnostic.id,
    metadata: {
      generatedDraftSource: insights.source
    }
  });

  const comparison = await generateSnapshotComparison({
    studentName: student.name,
    reason: "Диагностика обновила профиль и стратегию ученика.",
    before: beforeState,
    after: afterState,
    context: {
      diagnosticId: diagnostic.id,
      interests,
      activityFormats,
      strategy
    }
  });

  await createStudentAiInsight({
    studentId,
    actorId: user.id,
    insightType: "snapshot_comparison",
    source: comparison.source === "ai" ? "claude" : "rule_based",
    title: comparison.title,
    summary: comparison.summary,
    evidence: comparison.evidence,
    recommendations: comparison.recommendations,
    risks: comparison.risks,
    nextQuestions: comparison.nextQuestions,
    relatedType: "diagnostic",
    relatedId: diagnostic.id,
    metadata: {
      comparisonReason: "diagnostic_applied"
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  redirect(`/students/${studentId}`);
}

export async function saveParentRequestAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageStudents(user.role)) {
    throw new Error("Недостаточно прав для редактирования родительского запроса.");
  }

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
  const user = await requireUser();
  if (!canManageEvents(user.role)) {
    throw new Error("Недостаточно прав для создания мероприятия.");
  }

  await prisma.event.create({
    data: {
      sourceId: optionalText(formData, "sourceId"),
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
      qualityNotes: optionalText(formData, "qualityNotes"),
      status: text(formData, "status") || "draft",
      moderatedById: text(formData, "status") === "approved" ? user.id : null,
      moderatedAt: text(formData, "status") === "approved" ? new Date() : null
    }
  });

  revalidatePath("/events");
  redirect("/events");
}

export async function createEventSourceAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageEvents(user.role)) {
    throw new Error("Недостаточно прав для создания источника.");
  }

  const title = text(formData, "title");
  const url = text(formData, "url");

  if (!title || !url) {
    throw new Error("Нужно указать название и URL источника.");
  }

  await prisma.eventSource.create({
    data: {
      title,
      url,
      city: optionalText(formData, "city"),
      focusAreasJson: json(checkedValues(formData, "focusAreas")),
      comment: optionalText(formData, "comment"),
      isActive: text(formData, "isActive") !== "off"
    }
  });

  revalidatePath("/events");
  revalidatePath("/events/sources");
}

export async function updateEventModerationStatusAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageEvents(user.role)) {
    throw new Error("Недостаточно прав для модерации мероприятий.");
  }

  const eventId = text(formData, "eventId");
  const status = text(formData, "status");
  const allowedStatuses = new Set(["draft", "needs_review", "approved", "rejected"]);

  if (!eventId || !allowedStatuses.has(status)) {
    throw new Error("Некорректный статус модерации.");
  }

  const existingEvent = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      status: true,
      qualityNotes: true,
      sourceId: true,
      moderatedById: true,
      moderatedAt: true
    }
  });

  if (!existingEvent) {
    throw new Error("Мероприятие не найдено.");
  }

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      status,
      moderatedById: status === "approved" || status === "rejected" ? user.id : null,
      moderatedAt: status === "approved" || status === "rejected" ? new Date() : null
    }
  });

  await createAuditLog({
    eventId,
    actorId: user.id,
    action: "event.moderation_status_changed",
    targetType: "event",
    targetId: eventId,
    source: "moderation",
    summary: `Статус модерации мероприятия изменен: ${event.title}.`,
    before: existingEvent,
    after: {
      id: event.id,
      title: event.title,
      status: event.status,
      qualityNotes: event.qualityNotes,
      sourceId: event.sourceId,
      moderatedById: event.moderatedById,
      moderatedAt: event.moderatedAt
    }
  });

  revalidatePath("/events");
  revalidatePath(`/events?status=${status}`);
}

export async function assignEventToStudentAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageEvents(user.role)) {
    throw new Error("Недостаточно прав для назначения мероприятия.");
  }

  const studentId = text(formData, "studentId");
  const eventId = text(formData, "eventId");

  if (!studentId || !eventId) {
    throw new Error("Нужно выбрать ученика и мероприятие.");
  }

  const [student, event] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId, ...(user.role === "ADMIN" ? {} : { curatorId: user.id }) },
      include: {
        profile: true,
        parentRequest: true,
        eventMap: {
          select: {
            eventId: true
          }
        }
      }
    }),
    prisma.event.findFirst({
      where: {
        id: eventId,
        status: "approved"
      }
    })
  ]);

  if (!student) {
    throw new Error("Ученик не найден или не прикреплен к этому куратору.");
  }

  if (!event) {
    throw new Error("Назначать можно только согласованные мероприятия.");
  }

  const requestedPriority = text(formData, "priority");
  const manualGoal = text(formData, "goalForStudent");
  const manualComment = optionalText(formData, "curatorComment");
  const recommendation = scoreEventForStudent(student, event);
  const fallbackPriority = recommendation.score >= 75 ? "required" : recommendation.score >= 35 ? "recommended" : "optional";
  const fallbackAssignment = {
    priority: fallbackPriority as "required" | "recommended" | "optional",
    goalForStudent: recommendation.goalForStudent,
    curatorComment: recommendation.curatorComment
  };
  const shouldAutoFill = requestedPriority === "auto" || !requestedPriority || !manualGoal || !manualComment;
  const autoAssignment = shouldAutoFill
    ? await generateEventAssignmentDraft({
        studentName: student.name,
        age: student.age,
        grade: student.grade,
        city: student.city,
        profile: student.profile,
        parentRequest: student.parentRequest,
        event,
        ruleScore: recommendation.score,
        ruleReasons: recommendation.reasons,
        ruleRisks: recommendation.risks,
        fallback: fallbackAssignment
      })
    : null;
  const priority =
    requestedPriority && requestedPriority !== "auto"
      ? requestedPriority
      : autoAssignment?.priority ?? fallbackAssignment.priority;
  const goalForStudent = manualGoal || autoAssignment?.goalForStudent || fallbackAssignment.goalForStudent;
  const curatorComment = manualComment || autoAssignment?.curatorComment || fallbackAssignment.curatorComment;

  const beforeState = await getStudentAuditState(studentId);
  const existingMapItem = await prisma.studentEventMap.findUnique({
    where: {
      studentId_eventId: {
        studentId,
        eventId
      }
    },
    include: { event: { select: { title: true } } }
  });

  const mapItem = await prisma.studentEventMap.upsert({
    where: {
      studentId_eventId: {
        studentId,
        eventId
      }
    },
    update: {
      priority,
      goalForStudent,
      curatorComment
    },
    create: {
      studentId,
      eventId,
      priority,
      goalForStudent,
      curatorComment,
      status: "planned"
    }
  });

  const afterState = await getStudentAuditState(studentId);

  await createAuditLog({
    studentId,
    eventId,
    actorId: user.id,
    action: existingMapItem ? "event_map.assignment_updated" : "event_map.event_assigned",
    targetType: "event_map",
    targetId: mapItem.id,
    source: "curator",
    summary: existingMapItem ? "Назначение мероприятия в карте обновлено." : "Мероприятие назначено ученику.",
    before: existingMapItem
      ? {
          id: existingMapItem.id,
          eventId: existingMapItem.eventId,
          eventTitle: existingMapItem.event.title,
          priority: existingMapItem.priority,
          status: existingMapItem.status,
          goalForStudent: existingMapItem.goalForStudent,
          curatorComment: existingMapItem.curatorComment
        }
      : null,
    after: pickStudentAuditTarget(afterState, "event_map"),
    metadata: {
      priority: mapItem.priority,
      status: mapItem.status
    }
  });

  await createStudentSnapshot({
    studentId,
    actorId: user.id,
    snapshotType: "event_map",
    stage: "before",
    source: "curator",
    relatedType: "event",
    relatedId: eventId,
    reason: "До назначения мероприятия в карту.",
    state: beforeState
  });

  await createStudentSnapshot({
    studentId,
    actorId: user.id,
    snapshotType: "event_map",
    stage: "after",
    source: "curator",
    relatedType: "event",
    relatedId: eventId,
    reason: "После назначения мероприятия в карту.",
    state: afterState
  });

  revalidatePath("/dashboard");
  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  redirect(`/students/${studentId}`);
}

export async function updateStudentEventStatusAction(formData: FormData) {
  const user = await requireUser();
  const studentEventMapId = text(formData, "studentEventMapId");
  const status = text(formData, "status");
  const allowedStatuses = new Set(["planned", "selected", "visited", "feedback_completed"]);

  if (!studentEventMapId || !allowedStatuses.has(status)) {
    throw new Error("Некорректный статус мероприятия.");
  }

  const mapItem = await prisma.studentEventMap.findUnique({
    where: { id: studentEventMapId },
    include: {
      student: true,
      event: {
        select: { id: true, title: true }
      }
    }
  });

  if (!mapItem) {
    throw new Error("Мероприятие в карте не найдено.");
  }

  const canUpdate =
    user.role === "ADMIN" ||
    mapItem.student.curatorId === user.id ||
    mapItem.student.parentId === user.id ||
    mapItem.student.userId === user.id;

  if (!canUpdate) {
    throw new Error("Недостаточно прав для изменения статуса мероприятия.");
  }

  const beforeState = await getStudentAuditState(mapItem.studentId);
  const updatedMapItem = await prisma.studentEventMap.update({
    where: { id: studentEventMapId },
    data: { status }
  });
  const afterState = await getStudentAuditState(mapItem.studentId);

  await createAuditLog({
    studentId: mapItem.studentId,
    eventId: mapItem.eventId,
    actorId: user.id,
    action: "event_map.status_changed",
    targetType: "event_map",
    targetId: studentEventMapId,
    source: user.role === "PARENT" || user.role === "STUDENT" ? "feedback" : "curator",
    summary: `Статус мероприятия в карте изменен: ${mapItem.event.title}.`,
    before: {
      id: mapItem.id,
      eventId: mapItem.eventId,
      eventTitle: mapItem.event.title,
      priority: mapItem.priority,
      status: mapItem.status,
      goalForStudent: mapItem.goalForStudent,
      curatorComment: mapItem.curatorComment
    },
    after: {
      id: updatedMapItem.id,
      eventId: updatedMapItem.eventId,
      eventTitle: mapItem.event.title,
      priority: updatedMapItem.priority,
      status: updatedMapItem.status,
      goalForStudent: updatedMapItem.goalForStudent,
      curatorComment: updatedMapItem.curatorComment
    }
  });

  await createStudentSnapshot({
    studentId: mapItem.studentId,
    actorId: user.id,
    snapshotType: "event_map",
    stage: "before",
    source: "status_update",
    relatedType: "event",
    relatedId: mapItem.eventId,
    reason: "До изменения статуса мероприятия в карте.",
    state: beforeState
  });

  await createStudentSnapshot({
    studentId: mapItem.studentId,
    actorId: user.id,
    snapshotType: "event_map",
    stage: "after",
    source: "status_update",
    relatedType: "event",
    relatedId: mapItem.eventId,
    reason: "После изменения статуса мероприятия в карте.",
    state: afterState
  });

  revalidatePath("/dashboard");
  revalidatePath("/events");
  revalidatePath(`/students/${mapItem.studentId}`);
  revalidatePath("/feedback");
}

export async function submitFeedbackAction(formData: FormData) {
  const user = await requireUser();
  const studentId = text(formData, "studentId");
  const eventId = text(formData, "eventId");
  const student = await prisma.student.findUnique({
    where: {
      id: studentId
    }
  });
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!studentId || !student || !event) {
    throw new Error("Нужно выбрать ученика и мероприятие.");
  }

  const canSubmit =
    user.role === "ADMIN" ||
    student.curatorId === user.id ||
    student.parentId === user.id ||
    student.userId === user.id;

  if (!canSubmit) {
    throw new Error("Недостаточно прав для отправки обратной связи по этому ученику.");
  }

  const eventAreas = parseJson<string[]>(event.professionalAreasJson, []);
  const eventFormats = parseJson<string[]>(event.activityFormatsJson, []);
  const interestScore = intValue(formData, "interestScore", 5);
  const difficultyScore = intValue(formData, "difficultyScore", 5);
  const engagementScore = intValue(formData, "engagementScore", 5);
  const fatigueScore = intValue(formData, "fatigueScore", 5);
  const wantContinue = text(formData, "wantContinue") as "yes" | "no" | "not_sure";
  const liked = optionalText(formData, "liked");
  const disliked = optionalText(formData, "disliked");
  const learned = optionalText(formData, "learned");
  const wantTryNext = optionalText(formData, "wantTryNext");
  const tags = checkedValues(formData, "tags");
  const beforeState = await getStudentAuditState(studentId);

  const feedback = await prisma.eventFeedback.create({
    data: {
      studentId,
      eventId,
      interestScore,
      difficultyScore,
      engagementScore,
      fatigueScore,
      wantContinue,
      liked,
      disliked,
      learned,
      wantTryNext,
      tagsJson: json(tags)
    }
  });

  await prisma.studentEventMap.updateMany({
    where: { studentId, eventId },
    data: { status: "feedback_completed" }
  });

  const proposals = await generateFeedbackProposals({
    studentName: student.name,
    eventTitle: event.title,
    interestScore,
    difficultyScore,
    engagementScore,
    fatigueScore,
    wantContinue,
    eventAreas,
    eventFormats,
    liked,
    disliked,
    learned,
    wantTryNext,
    tags
  });

  if (proposals.length > 0) {
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
  }

  const afterState = await getStudentAuditState(studentId);
  const proposalSources = Array.from(new Set(proposals.map((proposal) => proposalDraftSource(proposal.reason))));

  await createAuditLog({
    studentId,
    eventId,
    actorId: user.id,
    action: "feedback.submitted",
    targetType: "feedback",
    targetId: feedback.id,
    source: "feedback",
    summary: `Обратная связь оставлена по мероприятию: ${event.title}.`,
    before: pickStudentAuditTarget(beforeState, "event_map"),
    after: pickStudentAuditTarget(afterState, "event_map"),
    metadata: {
      feedback: {
        interestScore,
        difficultyScore,
        engagementScore,
        fatigueScore,
        wantContinue,
        tags
      },
      proposalsCreated: proposals.length,
      proposalSources
    }
  });

  await createStudentSnapshot({
    studentId,
    actorId: user.id,
    snapshotType: "feedback",
    stage: "after",
    source: "feedback",
    relatedType: "feedback",
    relatedId: feedback.id,
    reason: "После сохранения обратной связи и черновиков предложений.",
    state: afterState,
    metadata: {
      eventId,
      proposalsCreated: proposals.length,
      proposalSources
    }
  });

  const feedbackAnalysis = await generateFeedbackAnalysis({
    studentName: student.name,
    eventTitle: event.title,
    interestScore,
    difficultyScore,
    engagementScore,
    fatigueScore,
    wantContinue,
    eventAreas,
    eventFormats,
    liked,
    disliked,
    learned,
    wantTryNext,
    tags,
    currentProfile: afterState?.profile,
    currentStrategy: afterState?.strategy,
    currentEventMap: afterState?.eventMap,
    currentVisibility: afterState?.visibility,
    proposalsCreated: proposals.length
  });

  await createStudentAiInsight({
    studentId,
    actorId: user.id,
    insightType: "feedback_analysis",
    source: feedbackAnalysis.source === "ai" ? "claude" : "rule_based",
    title: feedbackAnalysis.title,
    summary: feedbackAnalysis.summary,
    evidence: feedbackAnalysis.evidence,
    recommendations: feedbackAnalysis.recommendations,
    risks: feedbackAnalysis.risks,
    nextQuestions: feedbackAnalysis.nextQuestions,
    relatedType: "feedback",
    relatedId: feedback.id,
    metadata: {
      eventId,
      proposalsCreated: proposals.length,
      proposalSources
    }
  });

  const feedbackComparison = await generateSnapshotComparison({
    studentName: student.name,
    reason: `Обратная связь по мероприятию "${event.title}" обновила карту и создала черновики предложений.`,
    before: beforeState,
    after: afterState,
    context: {
      feedbackId: feedback.id,
      eventTitle: event.title,
      proposalsCreated: proposals.length
    }
  });

  await createStudentAiInsight({
    studentId,
    actorId: user.id,
    insightType: "snapshot_comparison",
    source: feedbackComparison.source === "ai" ? "claude" : "rule_based",
    title: feedbackComparison.title,
    summary: feedbackComparison.summary,
    evidence: feedbackComparison.evidence,
    recommendations: feedbackComparison.recommendations,
    risks: feedbackComparison.risks,
    nextQuestions: feedbackComparison.nextQuestions,
    relatedType: "feedback",
    relatedId: feedback.id,
    metadata: {
      eventId,
      comparisonReason: "feedback_submitted"
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/approvals");
  revalidatePath(`/students/${studentId}`);
  redirect(canManageApprovals(user.role) ? "/approvals" : `/students/${studentId}`);
}

export async function updateProposalStatusAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageApprovals(user.role)) {
    throw new Error("Недостаточно прав для согласования предложений.");
  }

  const proposalId = text(formData, "proposalId");
  const status = text(formData, "status");
  const shouldApplyStatus = status === "approved" || status === "edited";
  const existingProposal = await prisma.changeProposal.findUnique({
    where: { id: proposalId }
  });

  if (!existingProposal) {
    throw new Error("Предложение не найдено.");
  }

  const shouldApply = shouldApplyStatus && existingProposal.status !== "approved" && existingProposal.status !== "edited";

  if (shouldApply) {
    await applyApprovedProposal(proposalId, user.id);
  }

  const proposal = await prisma.changeProposal.update({
    where: { id: proposalId },
    data: {
      status,
      approvedBy: shouldApplyStatus ? user.id : null,
      approvedAt: shouldApplyStatus ? new Date() : null
    }
  });

  await createAuditLog({
    studentId: proposal.studentId,
    eventId: proposal.triggerEventId,
    proposalId: proposal.id,
    actorId: user.id,
    action: "proposal.status_changed",
    targetType: "proposal",
    targetId: proposal.id,
    source: "teacher_approval",
    summary: `Статус предложения изменен: ${proposal.description}.`,
    before: {
      status: existingProposal.status,
      approvedBy: existingProposal.approvedBy,
      approvedAt: existingProposal.approvedAt
    },
    after: {
      status: proposal.status,
      approvedBy: proposal.approvedBy,
      approvedAt: proposal.approvedAt
    },
    metadata: {
      proposalType: proposal.proposalType,
      applied: shouldApply
    }
  });

  revalidatePath("/approvals");
  revalidatePath("/dashboard");
  revalidatePath(`/students/${proposal.studentId}`);
}
