-- AlterTable
ALTER TABLE "ComponentDefinition" ALTER COLUMN "location_id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ComponentElement" ALTER COLUMN "location_id" DROP DEFAULT;
