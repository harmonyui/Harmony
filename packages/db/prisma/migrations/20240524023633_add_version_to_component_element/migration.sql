/*
  Warnings:

  - Added the required column `version` to the `ComponentElement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ComponentElement" ADD COLUMN     "version" TEXT;

UPDATE "ComponentElement"
SET "version"='0.0.0';

ALTER TABLE "ComponentElement" ALTER COLUMN "version" SET NOT NULL;
