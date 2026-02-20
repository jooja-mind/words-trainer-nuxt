-- CreateTable
CREATE TABLE "public"."RecapTrainingStats" (
    "id" SERIAL NOT NULL,
    "score" INTEGER NOT NULL,
    "coverage" DOUBLE PRECISION NOT NULL,
    "structure" DOUBLE PRECISION NOT NULL,
    "language" DOUBLE PRECISION NOT NULL,
    "fluency" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecapTrainingStats_pkey" PRIMARY KEY ("id")
);
