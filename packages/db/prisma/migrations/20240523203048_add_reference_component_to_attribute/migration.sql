/*
  Warnings:

  - Added the required column `reference_component_id` to the `ComponentAttribute` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ComponentAttribute" ADD COLUMN     "reference_component_id" TEXT;

UPDATE "ComponentAttribute"
SET "reference_component_id"="component_id";

ALTER TABLE "ComponentAttribute" ALTER COLUMN "reference_component_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "ComponentAttribute" ADD CONSTRAINT "ComponentAttribute_reference_component_id_fkey" FOREIGN KEY ("reference_component_id") REFERENCES "ComponentElement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
