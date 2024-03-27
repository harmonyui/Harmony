/*
  Warnings:

  - Added the required column `account_id` to the `Branch` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "account_id" TEXT;

UPDATE "Branch"
SET "account_id" = a."id"
FROM "Repository" as r
INNER JOIN "Account" as a on a."team_id" = r."team_id"
WHERE r."id" = "repository_id";

ALTER TABLE "Branch" ALTER COLUMN "account_id" SET NOT NULL;


-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
