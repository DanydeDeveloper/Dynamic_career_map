import { prisma } from "@/lib/db";
import {
  createAuditLog,
  createStudentSnapshot,
  getStudentAuditState,
  pickStudentAuditTarget,
  proposalDraftSource,
  proposalTargetType
} from "@/lib/audit-log";
import { professionalAreas } from "@/lib/constants";
import { parseJson } from "@/lib/format";
import { visibilityLevel } from "@/lib/visibility";

const json = (value: unknown) => JSON.stringify(value);

const defaultInterests = () => Object.fromEntries(professionalAreas.map((area) => [area.key, 1]));

const defaultInclinations = () => ({
  analytical_thinking: 5,
  creative_thinking: 5,
  communication: 5,
  research_orientation: 5,
  practical_making: 5
});

const defaultActivityFormats = () => ({
  teamwork: 5,
  individual_work: 5,
  competition: 5,
  project_work: 5,
  public_speaking: 5
});

function bumpScores(values: Record<string, number>, keys: string[], delta = 1) {
  const next = { ...values };

  for (const key of keys) {
    next[key] = Math.min((next[key] ?? 1) + delta, 10);
  }

  return next;
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

function proposalNote(description: string, newValue: string | null, reason: string) {
  return [description, newValue, reason].filter(Boolean).join(" — ");
}

function payloadFromNewValue(value: string | null) {
  if (!value) {
    return {};
  }

  return parseJson<Record<string, string>>(value, {});
}

async function updateProfileScores(proposalId: string, mode: "interests" | "formats") {
  const proposal = await prisma.changeProposal.findUnique({
    where: { id: proposalId },
    include: { triggerEvent: true, student: { include: { profile: true } } }
  });

  if (!proposal) {
    throw new Error("Предложение не найдено.");
  }

  const profile = proposal.student.profile;
  const eventAreas = parseJson<string[]>(proposal.triggerEvent?.professionalAreasJson ?? "[]", []);
  const eventFormats = parseJson<string[]>(proposal.triggerEvent?.activityFormatsJson ?? "[]", []);
  const interests = parseJson<Record<string, number>>(profile?.interestsJson ?? "{}", defaultInterests());
  const inclinations = parseJson<Record<string, number>>(profile?.inclinationsJson ?? "{}", defaultInclinations());
  const activityFormats = parseJson<Record<string, number>>(profile?.activityFormatsJson ?? "{}", defaultActivityFormats());
  const nextInterests = mode === "interests" ? bumpScores(interests, eventAreas, 1) : interests;
  const nextFormats = mode === "formats" ? bumpScores(activityFormats, eventFormats, 1) : activityFormats;
  const note = proposalNote(proposal.description, proposal.newValue, proposal.reason);

  await prisma.studentProfile.upsert({
    where: { studentId: proposal.studentId },
    update: {
      interestsJson: json(nextInterests),
      inclinationsJson: json(inclinations),
      activityFormatsJson: json(nextFormats),
      stabilityJson: json(stabilityFromInterests(nextInterests)),
      curatorComment: [profile?.curatorComment, `Согласовано: ${note}`].filter(Boolean).join("\n")
    },
    create: {
      studentId: proposal.studentId,
      interestsJson: json(nextInterests),
      inclinationsJson: json(inclinations),
      activityFormatsJson: json(nextFormats),
      stabilityJson: json(stabilityFromInterests(nextInterests)),
      summaryText: "Профиль создан на основе согласованного предложения изменений.",
      curatorComment: `Согласовано: ${note}`
    }
  });
}

async function updateVisibility(proposalId: string) {
  const proposal = await prisma.changeProposal.findUnique({
    where: { id: proposalId },
    include: { triggerEvent: true }
  });

  if (!proposal?.triggerEvent) {
    return;
  }

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

async function appendStrategyNote(proposalId: string) {
  const proposal = await prisma.changeProposal.findUnique({
    where: { id: proposalId },
    include: { student: { include: { strategy: true } } }
  });

  if (!proposal) {
    throw new Error("Предложение не найдено.");
  }

  const strategy = proposal.student.strategy;
  const note = proposalNote(proposal.description, proposal.newValue, proposal.reason);

  await prisma.careerStrategy.upsert({
    where: { studentId: proposal.studentId },
    update: {
      strategySummary: [strategy?.strategySummary, `Согласовано: ${note}`].filter(Boolean).join("\n"),
      next3MonthsFocus: proposal.newValue ?? strategy?.next3MonthsFocus ?? note
    },
    create: {
      studentId: proposal.studentId,
      strategySummary: `Согласовано: ${note}`,
      mainHypothesesJson: json([proposal.description]),
      areasToExpandJson: json([]),
      areasToCheckJson: json([]),
      recommendedFormatsJson: json([]),
      risksJson: json([]),
      next3MonthsFocus: proposal.newValue ?? note,
      next12MonthsFocus: "Уточнить после следующих профпроб и обратной связи."
    }
  });
}

async function addEventToMap(proposalId: string) {
  const proposal = await prisma.changeProposal.findUnique({
    where: { id: proposalId },
    include: { triggerEvent: true }
  });

  if (!proposal) {
    throw new Error("Предложение не найдено.");
  }

  const payload = payloadFromNewValue(proposal.newValue);
  const eventId = payload.eventId;

  if (!eventId) {
    await appendStrategyNote(proposalId);
    return;
  }

  await prisma.studentEventMap.upsert({
    where: {
      studentId_eventId: {
        studentId: proposal.studentId,
        eventId
      }
    },
    update: {
      priority: payload.priority ?? "recommended",
      goalForStudent: proposal.description,
      curatorComment: proposal.reason
    },
    create: {
      studentId: proposal.studentId,
      eventId,
      priority: payload.priority ?? "recommended",
      goalForStudent: proposal.description,
      curatorComment: proposal.reason,
      status: "planned"
    }
  });
}

async function changeEventPriority(proposalId: string) {
  const proposal = await prisma.changeProposal.findUnique({ where: { id: proposalId } });

  if (!proposal?.triggerEventId) {
    await appendStrategyNote(proposalId);
    return;
  }

  const payload = payloadFromNewValue(proposal.newValue);

  await prisma.studentEventMap.updateMany({
    where: {
      studentId: proposal.studentId,
      eventId: proposal.triggerEventId
    },
    data: {
      priority: payload.priority ?? "optional",
      curatorComment: proposal.reason,
      status: "change_suggested"
    }
  });
}

async function removeEventFromMap(proposalId: string) {
  const proposal = await prisma.changeProposal.findUnique({ where: { id: proposalId } });

  if (!proposal?.triggerEventId) {
    await appendStrategyNote(proposalId);
    return;
  }

  await prisma.studentEventMap.deleteMany({
    where: {
      studentId: proposal.studentId,
      eventId: proposal.triggerEventId
    }
  });
}

export async function applyApprovedProposal(proposalId: string, actorId?: string | null) {
  const proposal = await prisma.changeProposal.findUnique({ where: { id: proposalId } });

  if (!proposal) {
    throw new Error("Предложение не найдено.");
  }

  const targetType = proposalTargetType(proposal.proposalType);
  const beforeState = await getStudentAuditState(proposal.studentId);

  await createStudentSnapshot({
    studentId: proposal.studentId,
    actorId,
    snapshotType: targetType,
    stage: "before",
    source: "teacher_approval",
    relatedType: "proposal",
    relatedId: proposal.id,
    reason: `До применения согласования: ${proposal.description}`,
    state: beforeState,
    metadata: {
      proposalType: proposal.proposalType,
      draftSource: proposalDraftSource(proposal.reason)
    }
  });

  switch (proposal.proposalType) {
    case "update_visibility":
      await updateVisibility(proposal.id);
      break;
    case "update_profile":
    case "update_interest":
      await updateProfileScores(proposal.id, "interests");
      break;
    case "adjust_formats":
    case "update_activity_format":
      await updateProfileScores(proposal.id, "formats");
      break;
    case "update_strategy":
      await appendStrategyNote(proposal.id);
      break;
    case "add_event":
      await addEventToMap(proposal.id);
      break;
    case "remove_event":
      await removeEventFromMap(proposal.id);
      break;
    case "change_priority":
    case "change_event_priority":
      await changeEventPriority(proposal.id);
      break;
    default:
      await appendStrategyNote(proposal.id);
      break;
  }

  const afterState = await getStudentAuditState(proposal.studentId);

  await createAuditLog({
    studentId: proposal.studentId,
    eventId: proposal.triggerEventId,
    proposalId: proposal.id,
    actorId,
    action: "proposal.applied",
    targetType,
    targetId: proposal.triggerEventId ?? proposal.studentId,
    source: "teacher_approval",
    summary: `Согласованное предложение применено: ${proposal.description}`,
    before: pickStudentAuditTarget(beforeState, targetType),
    after: pickStudentAuditTarget(afterState, targetType),
    metadata: {
      proposalType: proposal.proposalType,
      draftSource: proposalDraftSource(proposal.reason),
      oldValue: proposal.oldValue,
      newValue: proposal.newValue
    }
  });

  await createStudentSnapshot({
    studentId: proposal.studentId,
    actorId,
    snapshotType: targetType,
    stage: "after",
    source: "teacher_approval",
    relatedType: "proposal",
    relatedId: proposal.id,
    reason: `После применения согласования: ${proposal.description}`,
    state: afterState,
    metadata: {
      proposalType: proposal.proposalType,
      draftSource: proposalDraftSource(proposal.reason)
    }
  });
}
