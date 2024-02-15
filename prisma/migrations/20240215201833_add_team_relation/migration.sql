/*
  Warnings:

  - You are about to drop the column `account_id` on the `Repository` table. All the data in the column will be lost.
  - Added the required column `team_id` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `team_id` to the `Repository` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Repository" DROP CONSTRAINT "Repository_account_id_fkey";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "team_id" TEXT;

UPDATE "Account"
SET "team_id"="id";

ALTER TABLE "Account" ALTER COLUMN "team_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "Repository"
ADD COLUMN     "team_id" TEXT;

UPDATE "Repository"
SET "team_id"="account_id";

ALTER TABLE "Repository"
DROP COLUMN "account_id",
ALTER COLUMN "team_id" SET NOT NULL;

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Team" SELECT id FROM "Account";

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repository" ADD CONSTRAINT "Repository_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
