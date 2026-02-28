-- AlterTable
ALTER TABLE "FluencyError"
ADD COLUMN "reviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastReviewedAt" TIMESTAMP(3),
ADD COLUMN "nextReviewAt" TIMESTAMP(3);
