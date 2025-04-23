/*
  Warnings:

  - Added the required column `number` to the `PullRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PullRequest" ADD COLUMN     "number" INTEGER;

UPDATE "PullRequest" SET "number" = 0;

ALTER TABLE "PullRequest" ALTER COLUMN "number" SET NOT NULL;
