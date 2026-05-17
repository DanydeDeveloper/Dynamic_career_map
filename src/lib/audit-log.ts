import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const json = (value: unknown) => JSON.stringify(value);

type AuditDb = Prisma.TransactionClient;

export type StudentAuditState = {
  profile: {
    interestsJson: string;
    inclinationsJson: string;
    activityFormatsJson: string;
    stabilityJson: string;
    summaryText: string;
    curatorComment: string | null;
    updatedAt: Date;
  } | null;
  strategy: {
    strategySummary: string;
    mainHypothesesJson: string;
    areasToExpandJson: string;
    areasToCheckJson: string;
    recommendedFormatsJson: string;
    risksJson: string;
    next3MonthsFocus: string;
    next12MonthsFocus: string;
    updatedAt: Date;
  } | null;
  eventMap: Array<{
    id: string;
    eventId: string;
    eventTitle: string;
    priority: string;
    status: string;
    goalForStudent: string;
    curatorComment: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  visibility: Array<{
    area: string;
    score: number;
    level: string;
    evidenceJson: string;
    updatedAt: Date;
  }>;
};

type AuditLogInput = {
  studentId?: string | null;
  eventId?: string | null;
  proposalId?: string | null;
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  source: string;
  summary: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
};

type StudentSnapshotInput = {
  studentId: string;
  actorId?: string | null;
  snapshotType: string;
  stage: "before" | "after" | "current";
  source: string;
  relatedType?: string | null;
  relatedId?: string | null;
  reason: string;
  state?: StudentAuditState | null;
  metadata?: unknown;
};

export async function getStudentAuditState(studentId: string, db: AuditDb = prisma) {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      profile: {
        select: {
          interestsJson: true,
          inclinationsJson: true,
          activityFormatsJson: true,
          stabilityJson: true,
          summaryText: true,
          curatorComment: true,
          updatedAt: true
        }
      },
      strategy: {
        select: {
          strategySummary: true,
          mainHypothesesJson: true,
          areasToExpandJson: true,
          areasToCheckJson: true,
          recommendedFormatsJson: true,
          risksJson: true,
          next3MonthsFocus: true,
          next12MonthsFocus: true,
          updatedAt: true
        }
      },
      eventMap: {
        select: {
          id: true,
          eventId: true,
          priority: true,
          status: true,
          goalForStudent: true,
          curatorComment: true,
          createdAt: true,
          updatedAt: true,
          event: {
            select: { title: true }
          }
        },
        orderBy: { event: { date: "asc" } }
      },
      visibility: {
        select: {
          area: true,
          score: true,
          level: true,
          evidenceJson: true,
          updatedAt: true
        },
        orderBy: { area: "asc" }
      }
    }
  });

  if (!student) {
    return null;
  }

  return {
    profile: student.profile,
    strategy: student.strategy,
    eventMap: student.eventMap.map((item) => ({
      id: item.id,
      eventId: item.eventId,
      eventTitle: item.event.title,
      priority: item.priority,
      status: item.status,
      goalForStudent: item.goalForStudent,
      curatorComment: item.curatorComment,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    })),
    visibility: student.visibility
  };
}

export function proposalDraftSource(reason: string) {
  if (reason.startsWith("AI-черновик.")) {
    return "claude";
  }

  if (reason.startsWith("Системный черновик.")) {
    return "rule_based";
  }

  return "manual";
}

export function proposalTargetType(proposalType: string) {
  if (proposalType === "update_visibility") {
    return "visibility";
  }

  if (proposalType === "update_strategy") {
    return "strategy";
  }

  if (proposalType === "add_event" || proposalType === "remove_event" || proposalType === "change_priority" || proposalType === "change_event_priority") {
    return "event_map";
  }

  return "profile";
}

export function pickStudentAuditTarget(state: StudentAuditState | null, targetType: string) {
  if (!state) {
    return null;
  }

  if (targetType === "strategy") {
    return state.strategy;
  }

  if (targetType === "event_map") {
    return state.eventMap;
  }

  if (targetType === "visibility") {
    return state.visibility;
  }

  return state.profile;
}

export async function createAuditLog(input: AuditLogInput, db: AuditDb = prisma) {
  return db.auditLog.create({
    data: {
      studentId: input.studentId ?? null,
      eventId: input.eventId ?? null,
      proposalId: input.proposalId ?? null,
      actorId: input.actorId ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      source: input.source,
      summary: input.summary,
      beforeJson: input.before === undefined ? null : json(input.before),
      afterJson: input.after === undefined ? null : json(input.after),
      metadataJson: input.metadata === undefined ? "{}" : json(input.metadata)
    }
  });
}

export async function createStudentSnapshot(input: StudentSnapshotInput, db: AuditDb = prisma) {
  const state = input.state === undefined ? await getStudentAuditState(input.studentId, db) : input.state;

  if (!state) {
    return null;
  }

  return db.studentSnapshot.create({
    data: {
      studentId: input.studentId,
      actorId: input.actorId ?? null,
      snapshotType: input.snapshotType,
      stage: input.stage,
      source: input.source,
      relatedType: input.relatedType ?? null,
      relatedId: input.relatedId ?? null,
      reason: input.reason,
      profileJson: state.profile ? json(state.profile) : null,
      interestsJson: state.profile?.interestsJson ?? null,
      strategyJson: state.strategy ? json(state.strategy) : null,
      eventMapJson: json(state.eventMap),
      visibilityJson: json(state.visibility),
      metadataJson: input.metadata === undefined ? "{}" : json(input.metadata)
    }
  });
}
