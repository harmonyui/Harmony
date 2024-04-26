/*
  Warnings:

  - Added the required column `css_framework` to the `Repository` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Repository" ADD COLUMN     "css_framework" TEXT,
ADD COLUMN     "tailwind_prefix" TEXT;

UPDATE "Repository"
SET "css_framework"='other';

ALTER TABLE "Repository"
ALTER COLUMN "css_framework" SET NOT NULL;
