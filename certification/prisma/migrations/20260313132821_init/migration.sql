-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "departmentId" TEXT,
    "groupId" TEXT,
    "passwordHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    CONSTRAINT "Group_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "structure" TEXT NOT NULL,
    "theme" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "trainerName" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "managerId" TEXT,
    "managerName" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "summary" TEXT,
    CONSTRAINT "FormSubmission_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "FormTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FormSubmission_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FormSubmission_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "submissionId" TEXT,
    "targetDepartmentId" TEXT NOT NULL,
    "targetGroupId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppNotification_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "FormSubmission" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GlobalList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "sorting" TEXT NOT NULL,
    "isCaseSensitive" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Group_name_departmentId_key" ON "Group"("name", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalList_name_key" ON "GlobalList"("name");
