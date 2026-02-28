-- CreateTable
CREATE TABLE "FluencyAttempt" (
    "id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "targetPattern" TEXT,
    "transcript" TEXT,
    "verdict" TEXT,
    "score" DOUBLE PRECISION,
    "timeToFirstWordMs" INTEGER,
    "speechRateWpm" DOUBLE PRECISION,
    "longPauseCount" INTEGER,
    "selfCorrectionCount" INTEGER,
    "feedbackJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FluencyAttempt_pkey" PRIMARY KEY ("id")
);
