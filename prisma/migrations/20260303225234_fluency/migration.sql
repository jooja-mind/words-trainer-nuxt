-- CreateTable
CREATE TABLE "public"."FluencySkill" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "evaluationPrompt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FluencySkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FluencyQuestion" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "skillId" INTEGER NOT NULL,
    "timesShown" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FluencyQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FluencyAnswer" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "speechDurationMs" INTEGER NOT NULL,
    "reactionDelayMs" INTEGER NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FluencyAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FluencySkill_name_key" ON "public"."FluencySkill"("name");

-- AddForeignKey
ALTER TABLE "public"."FluencyQuestion" ADD CONSTRAINT "FluencyQuestion_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "public"."FluencySkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
