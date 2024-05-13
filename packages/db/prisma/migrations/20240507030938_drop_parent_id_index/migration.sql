/*
  Warnings:

  - You are about to drop the column `component_parent_id` on the `ComponentAttribute` table. All the data in the column will be lost.
  - The primary key for the `ComponentElement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `parent_parent_id` on the `ComponentElement` table. All the data in the column will be lost.
  - You are about to drop the column `component_parent_id` on the `ComponentError` table. All the data in the column will be lost.
  - You are about to drop the column `component_parent_id` on the `ComponentUpdate` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[component_id]` on the table `ComponentError` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "ComponentAttribute" DROP CONSTRAINT "ComponentAttribute_component_id_component_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "ComponentElement" DROP CONSTRAINT "ComponentElement_parent_id_parent_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "ComponentUpdate" DROP CONSTRAINT "ComponentUpdate_component_id_component_parent_id_fkey";

-- DropIndex
DROP INDEX "ComponentError_component_parent_id_component_id_key";

UPDATE "ComponentAttribute" 
SET "component_id"=CONCAT("component_id", CASE WHEN "component_parent_id" IS NULL OR "component_parent_id" = '' THEN '' ELSE CONCAT('#', "component_parent_id") END);

-- AlterTable
ALTER TABLE "ComponentAttribute" DROP COLUMN "component_parent_id";

UPDATE "ComponentElement" 
SET "id"=CONCAT("id", CASE WHEN "parent_id" IS NULL OR "parent_id" = '' THEN '' ELSE CONCAT('#', "parent_id") END);

-- AlterTable
ALTER TABLE "ComponentElement" DROP CONSTRAINT "ComponentElement_pkey",
DROP COLUMN "parent_parent_id",
ALTER COLUMN "parent_id" DROP NOT NULL,
ADD CONSTRAINT "ComponentElement_pkey" PRIMARY KEY ("id");

UPDATE "ComponentElement" 
SET "parent_id"=NULL
WHERE "parent_id"='';

UPDATE "ComponentError" 
SET "component_id"=CONCAT("component_id", CASE WHEN "component_parent_id" IS NULL OR "component_parent_id" = '' THEN '' ELSE CONCAT('#', "component_parent_id") END);

-- AlterTable
ALTER TABLE "ComponentError" DROP COLUMN "component_parent_id";

UPDATE "ComponentUpdate" 
SET "component_id"=CONCAT("component_id", CASE WHEN "component_parent_id" IS NULL OR "component_parent_id" = '' THEN '' ELSE CONCAT('#', "component_parent_id") END);

-- AlterTable
ALTER TABLE "ComponentUpdate" DROP COLUMN "component_parent_id";

-- CreateIndex
CREATE UNIQUE INDEX "ComponentError_component_id_key" ON "ComponentError"("component_id");

-- AddForeignKey
ALTER TABLE "ComponentUpdate" ADD CONSTRAINT "ComponentUpdate_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "ComponentElement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentElement" ADD CONSTRAINT "ComponentElement_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "ComponentElement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentAttribute" ADD CONSTRAINT "ComponentAttribute_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "ComponentElement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
