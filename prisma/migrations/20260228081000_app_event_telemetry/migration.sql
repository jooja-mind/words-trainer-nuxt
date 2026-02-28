-- CreateTable
CREATE TABLE "AppEvent" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "route" TEXT,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppEvent_pkey" PRIMARY KEY ("id")
);
