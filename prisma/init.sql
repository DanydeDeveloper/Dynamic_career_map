PRAGMA foreign_keys = ON;

CREATE TABLE "Student" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "age" INTEGER NOT NULL,
  "grade" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "school" TEXT,
  "parentName" TEXT,
  "curatorName" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "StudentProfile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "interestsJson" TEXT NOT NULL,
  "inclinationsJson" TEXT NOT NULL,
  "activityFormatsJson" TEXT NOT NULL,
  "stabilityJson" TEXT NOT NULL,
  "summaryText" TEXT NOT NULL,
  "curatorComment" TEXT,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "StudentProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "StudentProfile_studentId_key" ON "StudentProfile"("studentId");

CREATE TABLE "ParentRequest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "expectations" TEXT NOT NULL,
  "preferredAreasJson" TEXT NOT NULL,
  "restrictedAreasJson" TEXT NOT NULL,
  "budget" INTEGER,
  "availableTime" TEXT,
  "comment" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ParentRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ParentRequest_studentId_key" ON "ParentRequest"("studentId");

CREATE TABLE "PastActivity" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "activityType" TEXT NOT NULL,
  "area" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "result" TEXT,
  "studentReaction" TEXT,
  "parentComment" TEXT,
  "curatorComment" TEXT,
  CONSTRAINT "PastActivity_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Event" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "date" DATETIME NOT NULL,
  "time" TEXT NOT NULL,
  "format" TEXT NOT NULL,
  "participationFormat" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "ageMin" INTEGER NOT NULL,
  "ageMax" INTEGER NOT NULL,
  "city" TEXT NOT NULL,
  "location" TEXT,
  "cost" INTEGER NOT NULL,
  "professionalAreasJson" TEXT NOT NULL,
  "activityFormatsJson" TEXT NOT NULL,
  "goal" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'approved',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "StudentEventMap" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'planned',
  "goalForStudent" TEXT NOT NULL,
  "curatorComment" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "StudentEventMap_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StudentEventMap_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "StudentEventMap_studentId_eventId_key" ON "StudentEventMap"("studentId", "eventId");

CREATE TABLE "EventFeedback" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "interestScore" INTEGER NOT NULL,
  "difficultyScore" INTEGER NOT NULL,
  "engagementScore" INTEGER NOT NULL,
  "fatigueScore" INTEGER NOT NULL,
  "wantContinue" TEXT NOT NULL,
  "liked" TEXT,
  "disliked" TEXT,
  "learned" TEXT,
  "wantTryNext" TEXT,
  "tagsJson" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventFeedback_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EventFeedback_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CareerVisibility" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "area" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "level" TEXT NOT NULL,
  "evidenceJson" TEXT NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "CareerVisibility_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CareerVisibility_studentId_area_key" ON "CareerVisibility"("studentId", "area");

CREATE TABLE "ChangeProposal" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "triggerEventId" TEXT,
  "proposalType" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "oldValue" TEXT,
  "newValue" TEXT,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedBy" TEXT,
  "approvedAt" DATETIME,
  CONSTRAINT "ChangeProposal_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ChangeProposal_triggerEventId_fkey" FOREIGN KEY ("triggerEventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "CareerStrategy" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "strategySummary" TEXT NOT NULL,
  "mainHypothesesJson" TEXT NOT NULL,
  "areasToExpandJson" TEXT NOT NULL,
  "areasToCheckJson" TEXT NOT NULL,
  "recommendedFormatsJson" TEXT NOT NULL,
  "risksJson" TEXT NOT NULL,
  "next3MonthsFocus" TEXT NOT NULL,
  "next12MonthsFocus" TEXT NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "CareerStrategy_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CareerStrategy_studentId_key" ON "CareerStrategy"("studentId");
