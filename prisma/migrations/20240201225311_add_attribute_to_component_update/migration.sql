-- AlterTable
ALTER TABLE "ComponentUpdate" ADD COLUMN     "attribute_id" TEXT;

-- AddForeignKey
ALTER TABLE "ComponentUpdate" ADD CONSTRAINT "ComponentUpdate_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "ComponentAttribute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
