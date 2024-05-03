/*
  Warnings:

  - Added the required column `childIndex` to the `ComponentUpdate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ComponentUpdate" ADD COLUMN     "childIndex" INTEGER;

UPDATE "ComponentUpdate" SET "childIndex" = 0;

ALTER TABLE "ComponentUpdate" ALTER COLUMN "childIndex" SET NOT NULL;