/*
  Warnings:

  - You are about to drop the column `attribute_id` on the `ComponentUpdate` table. All the data in the column will be lost.
  - You are about to drop the column `commit_id` on the `ComponentUpdate` table. All the data in the column will be lost.
  - You are about to drop the column `location_id` on the `ComponentUpdate` table. All the data in the column will be lost.
  - You are about to drop the `Commit` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `branch_id` to the `ComponentUpdate` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ComponentUpdate" DROP CONSTRAINT "ComponentUpdate_attribute_id_fkey";

-- DropForeignKey
ALTER TABLE "ComponentUpdate" DROP CONSTRAINT "ComponentUpdate_commit_id_fkey";

-- DropForeignKey
ALTER TABLE "ComponentUpdate" DROP CONSTRAINT "ComponentUpdate_location_id_fkey";

-- DropIndex
DROP INDEX "ComponentUpdate_location_id_key";

-- AlterTable
ALTER TABLE "ComponentUpdate" DROP COLUMN "attribute_id",
DROP COLUMN "location_id",
ADD COLUMN     "branch_id" TEXT;

UPDATE "ComponentUpdate" a
SET "branch_id"=b."branch_id"
FROM "Commit" b
WHERE b."id"=a."commit_id";

ALTER TABLE "ComponentUpdate"
DROP COLUMN "commit_id",
ALTER COLUMN "branch_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "ComponentUpdate" ADD COLUMN     "old_value" TEXT;

UPDATE "ComponentUpdate"
SET "old_value"='';

ALTER TABLE "ComponentUpdate" ALTER COLUMN "old_value" SET NOT NULL;

-- DropTable
DROP TABLE "Commit";

-- AddForeignKey
ALTER TABLE "ComponentUpdate" ADD CONSTRAINT "ComponentUpdate_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;