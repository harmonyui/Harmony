/*
  Warnings:

  - Added the required column `default_url` to the `Repository` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Repository" ADD COLUMN     "default_url" TEXT;

UPDATE "Repository" as r
SET "default_url"=b."url"
FROM "Branch" as b
WHERE b."repository_id"=r."id";

ALTER TABLE "Repository" ALTER COLUMN "default_url" SET NOT NULL;
