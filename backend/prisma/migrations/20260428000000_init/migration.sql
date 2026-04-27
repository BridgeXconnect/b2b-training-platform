-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SALES', 'COURSE_MANAGER', 'TRAINER', 'STUDENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "CEFRLevel" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REQUIRES_REVIEW');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('IN_PERSON', 'VIRTUAL', 'HYBRID');

-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('DAILY', 'WEEKLY', 'BI_WEEKLY');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('GENERATED', 'UNDER_REVIEW', 'APPROVED', 'REQUIRES_REVISION');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SALES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientRequest" (
    "id" TEXT NOT NULL,
    "salesRepId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "companyName" TEXT NOT NULL,
    "companyIndustry" TEXT NOT NULL,
    "companySize" INTEGER NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "contactPosition" TEXT NOT NULL,
    "participantCount" INTEGER NOT NULL,
    "currentLevel" "CEFRLevel" NOT NULL,
    "targetLevel" "CEFRLevel" NOT NULL,
    "departments" TEXT[],
    "goals" TEXT[],
    "painPoints" TEXT[],
    "successCriteria" TEXT[],
    "totalHours" INTEGER NOT NULL,
    "lessonsPerModule" INTEGER NOT NULL,
    "deliveryMethod" "DeliveryMethod" NOT NULL,
    "frequency" "Frequency" NOT NULL,
    "lessonDuration" INTEGER NOT NULL,
    "preferredTimes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SOPDocument" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "extractedText" TEXT,
    "analysis" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SOPDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedCourse" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "trainerId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cefrLevel" "CEFRLevel" NOT NULL,
    "totalHours" INTEGER NOT NULL,
    "status" "CourseStatus" NOT NULL DEFAULT 'GENERATED',
    "revisionNote" TEXT,
    "modules" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedCourse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "ClientRequest_salesRepId_idx" ON "ClientRequest"("salesRepId");

-- CreateIndex
CREATE INDEX "SOPDocument_requestId_idx" ON "SOPDocument"("requestId");

-- CreateIndex
CREATE INDEX "GeneratedCourse_requestId_idx" ON "GeneratedCourse"("requestId");

-- CreateIndex
CREATE INDEX "GeneratedCourse_trainerId_idx" ON "GeneratedCourse"("trainerId");

-- AddForeignKey
ALTER TABLE "ClientRequest" ADD CONSTRAINT "ClientRequest_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SOPDocument" ADD CONSTRAINT "SOPDocument_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ClientRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedCourse" ADD CONSTRAINT "GeneratedCourse_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ClientRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedCourse" ADD CONSTRAINT "GeneratedCourse_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
