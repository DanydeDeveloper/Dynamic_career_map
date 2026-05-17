import { prisma } from "@/lib/db";

type CurrentUser = {
  id: string;
  role: string;
};

function studentAccessWhere(user: CurrentUser) {
  if (user.role === "ADMIN") {
    return {};
  }

  if (user.role === "CURATOR") {
    return { curatorId: user.id };
  }

  if (user.role === "PARENT") {
    return { parentId: user.id };
  }

  return { userId: user.id };
}

export async function getDashboardData(user: CurrentUser) {
  const students = await prisma.student.findMany({
    where: studentAccessWhere(user),
    include: {
      profile: true,
      eventMap: {
        include: { event: { include: { source: true } } },
        orderBy: { event: { date: "asc" } }
      },
      proposals: {
        where: { status: "pending" }
      }
    },
    orderBy: { createdAt: "asc" }
  });

  return students;
}

export async function getStudentProfile(studentId: string, user: CurrentUser) {
  return prisma.student.findUnique({
    where: {
      id: studentId,
      ...studentAccessWhere(user)
    },
    include: {
      profile: true,
      parentRequest: true,
      pastActivities: true,
      visibility: {
        orderBy: { score: "desc" }
      },
      strategy: true,
      eventMap: {
        include: { event: { include: { source: true } } },
        orderBy: { event: { date: "asc" } }
      },
      feedback: {
        include: { event: true },
        orderBy: { createdAt: "desc" }
      },
      proposals: {
        include: { triggerEvent: true },
        orderBy: { createdAt: "desc" }
      },
      diagnostics: {
        include: {
          author: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      },
      auditLogs: {
        include: {
          actor: {
            select: {
              name: true,
              email: true,
              role: true
            }
          },
          event: {
            select: {
              title: true
            }
          },
          proposal: {
            select: {
              proposalType: true,
              description: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 40
      },
      snapshots: {
        include: {
          actor: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 18
      },
      aiInsights: {
        include: {
          actor: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 12
      }
    }
  });
}

export async function getEvents() {
  return prisma.event.findMany({
    include: { source: true },
    orderBy: { date: "asc" }
  });
}

export async function getApprovedEvents() {
  return prisma.event.findMany({
    where: { status: "approved" },
    include: { source: true },
    orderBy: { date: "asc" }
  });
}

export async function getEventSources() {
  return prisma.eventSource.findMany({
    orderBy: [{ isActive: "desc" }, { title: "asc" }]
  });
}

export async function getPendingProposals(user: CurrentUser) {
  return prisma.changeProposal.findMany({
    where: {
      status: "pending",
      student: studentAccessWhere(user)
    },
    include: {
      student: true,
      triggerEvent: true
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function getStudentsForForms(user: CurrentUser) {
  return prisma.student.findMany({
    where: studentAccessWhere(user),
    select: {
      id: true,
      name: true,
      grade: true,
      city: true
    },
    orderBy: { name: "asc" }
  });
}
