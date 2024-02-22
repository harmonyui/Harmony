/*
  Warnings:

  - Added the required column `contact` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "contact" TEXT;

UPDATE "Account" SET "contact"='example@gmail.com';

ALTER TABLE "Account" ALTER COLUMN "contact" SET NOT NULL;
