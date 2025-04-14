/*
  Warnings:

  - You are about to drop the column `team_id` on the `Repository` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[workspace_id]` on the table `Repository` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `workspace_id` to the `Repository` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Repository" DROP CONSTRAINT "Repository_team_id_fkey";

-- AlterTable
ALTER TABLE "Repository"
ADD COLUMN     "workspace_id" TEXT;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- Add default values for existing teams
UPDATE "Team" SET 
    "updated_at" = CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Team" 
    ALTER COLUMN "updated_at" SET NOT NULL;

-- Create workspaces for existing teams and repositories
INSERT INTO "Workspace" ("id", "name", "team_id", "created_at", "updated_at")
SELECT 
    gen_random_uuid()::text,
    CASE 
        WHEN a."firstName" IS NOT NULL THEN a."firstName" || '''s Workspace'
        ELSE 'Default Workspace'
    END,
    t."id",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Team" t
LEFT JOIN "Account" a ON t."id" = a."team_id";

-- Update workspace_id for existing repositories
UPDATE "Repository" r
SET "workspace_id" = w."id"
FROM "Workspace" w
WHERE r."team_id" = w."team_id";

-- Drop team_id from Repository and make workspace_id required
ALTER TABLE "Repository" 
    DROP COLUMN "team_id",
    ALTER COLUMN "workspace_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Repository_workspace_id_key" ON "Repository"("workspace_id");

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_team_id_fkey" 
    FOREIGN KEY ("team_id") REFERENCES "Team"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repository" ADD CONSTRAINT "Repository_workspace_id_fkey" 
    FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;
