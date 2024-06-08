-- DropForeignKey
ALTER TABLE "ComponentUpdate" DROP CONSTRAINT "ComponentUpdate_component_id_fkey";

-- DropIndex
DROP INDEX "ComponentError_component_id_key";
