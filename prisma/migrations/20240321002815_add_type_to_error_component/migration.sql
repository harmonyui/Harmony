/*
  Warnings:

  - Added the required column `type` to the `ComponentError` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ComponentError" ADD COLUMN     "type" TEXT;

UPDATE "ComponentError" SET "type"='element';

ALTER TABLE "ComponentError" ALTER COLUMN "type" SET NOT NULL;
