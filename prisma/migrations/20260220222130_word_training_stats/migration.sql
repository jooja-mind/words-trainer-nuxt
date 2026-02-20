-- CreateTable
CREATE TABLE "public"."WordTrainingStats" (
    "id" SERIAL NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "totalAnswers" INTEGER NOT NULL,
    "totalWords" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WordTrainingStats_pkey" PRIMARY KEY ("id")
);
