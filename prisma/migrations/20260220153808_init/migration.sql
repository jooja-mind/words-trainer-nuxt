-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."WordStatus" AS ENUM ('NEW', 'HARD', 'EASY');

-- CreateTable
CREATE TABLE "public"."Word" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "definition" TEXT,
    "example" TEXT,
    "translationRu" TEXT,
    "status" "public"."WordStatus" NOT NULL DEFAULT 'NEW',
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WordReview" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "wasCorrect" BOOLEAN NOT NULL,
    "statusAfter" "public"."WordStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WordReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Word_term_key" ON "public"."Word"("term");

-- CreateIndex
CREATE INDEX "WordReview_wordId_createdAt_idx" ON "public"."WordReview"("wordId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."WordReview" ADD CONSTRAINT "WordReview_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "public"."Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

