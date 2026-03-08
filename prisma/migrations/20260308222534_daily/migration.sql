-- CreateTable
CREATE TABLE "public"."DailySections" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "autoEnd" BOOLEAN NOT NULL DEFAULT false,
    "target" INTEGER NOT NULL,

    CONSTRAINT "DailySections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyCompleted" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "stats" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "completedInSeconds" INTEGER NOT NULL,

    CONSTRAINT "DailyCompleted_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailySections_sectionKey_key" ON "public"."DailySections"("sectionKey");
