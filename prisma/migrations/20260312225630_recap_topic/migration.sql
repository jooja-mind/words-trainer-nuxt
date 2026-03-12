-- CreateTable
CREATE TABLE "public"."RecapTopic" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecapTopic_pkey" PRIMARY KEY ("id")
);
