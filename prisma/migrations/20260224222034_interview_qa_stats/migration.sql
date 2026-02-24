-- AlterTable
ALTER TABLE "public"."InterviewQA" ADD COLUMN     "timesAnswered" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "timesCorrect" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "timesIncorrect" INTEGER NOT NULL DEFAULT 0;
