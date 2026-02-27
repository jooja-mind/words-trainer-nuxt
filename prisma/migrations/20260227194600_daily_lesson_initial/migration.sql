-- CreateTable
CREATE TABLE "DailyLesson" (
    "id" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "profile" TEXT NOT NULL DEFAULT 'standard',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'planned',
    "planJson" JSONB NOT NULL,
    "progressJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyLesson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyLesson_dateKey_key" ON "DailyLesson"("dateKey");
