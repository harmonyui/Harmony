/*
  Warnings:

  - Added the required column `tailwind_config` to the `Repository` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Repository" ADD COLUMN     "tailwind_config" TEXT;

UPDATE "Repository" SET "tailwind_config" = '{}';

ALTER TABLE "Repository" ALTER COLUMN "tailwind_config" SET NOT NULL;
