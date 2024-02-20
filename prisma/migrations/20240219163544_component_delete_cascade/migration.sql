-- DropForeignKey
ALTER TABLE "ComponentAttribute" DROP CONSTRAINT "ComponentAttribute_component_id_component_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "ComponentUpdate" DROP CONSTRAINT "ComponentUpdate_component_id_component_parent_id_fkey";

-- AddForeignKey
ALTER TABLE "ComponentUpdate" ADD CONSTRAINT "ComponentUpdate_component_id_component_parent_id_fkey" FOREIGN KEY ("component_id", "component_parent_id") REFERENCES "ComponentElement"("id", "parent_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentAttribute" ADD CONSTRAINT "ComponentAttribute_component_id_component_parent_id_fkey" FOREIGN KEY ("component_id", "component_parent_id") REFERENCES "ComponentElement"("id", "parent_id") ON DELETE CASCADE ON UPDATE CASCADE;
