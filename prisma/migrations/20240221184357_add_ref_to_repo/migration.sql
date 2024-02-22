/*
  Warnings:

  - Added the required column `ref` to the `Repository` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Repository" ADD COLUMN     "ref" TEXT NOT NULL;
