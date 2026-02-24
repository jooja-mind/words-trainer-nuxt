/*
  Warnings:

  - You are about to drop the column `translationRu` on the `Word` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Word" RENAME COLUMN "translationRu" TO "translation";