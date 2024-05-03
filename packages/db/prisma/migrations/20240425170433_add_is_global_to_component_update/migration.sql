/*
  Warnings:

  - Added the required column `is_global` to the `ComponentUpdate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ComponentUpdate" ADD COLUMN     "is_global" BOOLEAN;

UPDATE "ComponentUpdate" SET "is_global" = FALSE;

ALTER TABLE "ComponentUpdate" ALTER COLUMN "is_global" SET NOT NULL;
