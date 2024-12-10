/*
  Warnings:

  - Added the required column `order` to the `ComponentUpdate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ComponentUpdate" ADD COLUMN     "order" INTEGER;

UPDATE "ComponentUpdate" SET "order" = 0;

ALTER TABLE "ComponentUpdate" ALTER COLUMN "order" SET NOT NULL;
