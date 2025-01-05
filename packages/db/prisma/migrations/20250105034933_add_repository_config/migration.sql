/*
  Warnings:

  - Added the required column `config` to the `Repository` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Repository" ADD COLUMN     "config" JSONB;

UPDATE "Repository" SET "config" = '{"tailwindPath": "tailwind.config.ts", "packageResolution": {}}';

ALTER TABLE "Repository" ALTER COLUMN "config" SET NOT NULL;

