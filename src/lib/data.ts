import { prisma } from "@/lib/db";

export async function getDashboardData() {
  const students = await prisma.student.findMany({
    include: {
      profile: true,
      eventMap: {
        include: { event: true },
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

export async function getStudentProfile(studentId: string) {
  return prisma.student.findUnique({
    where: { id: studentId },
    include: {
      profile: true,
      parentRequest: true,
      pastActivities: true,
      visibility: {
        orderBy: { score: "desc" }
      },
      strategy: true,
      eventMap: {
        include: { event: true },
        orderBy: { event: { date: "asc" } }
      },
      feedback: {
        include: { event: true },
        orderBy: { createdAt: "desc" }
      },
      proposals: {
        include: { triggerEvent: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });
}

export async function getEvents() {
  return prisma.event.findMany({
    orderBy: { date: "asc" }
  });
}

export async function getPendingProposals() {
  return prisma.changeProposal.findMany({
    where: { status: "pending" },
    include: {
      student: true,
      triggerEvent: true
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function getStudentsForForms() {
  return prisma.student.findMany({
    select: {
      id: true,
      name: true,
      grade: true,
      city: true
    },
    orderBy: { name: "asc" }
  });
}
