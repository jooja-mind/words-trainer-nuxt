-- CreateTable
CREATE TABLE "FluencyError" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "errorType" TEXT NOT NULL,
    "wrongFragment" TEXT NOT NULL,
    "suggestedFragment" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FluencyError_pkey" PRIMARY KEY ("id")
);
