/*
  Warnings:

  - Added the required column `index` to the `ComponentAttribute` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ComponentAttribute" ADD COLUMN     "index" INTEGER;

UPDATE "ComponentAttribute"
SET "index"=-1;

ALTER TABLE "ComponentAttribute" ALTER COLUMN "index" SET NOT NULL;
