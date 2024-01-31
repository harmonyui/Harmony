-- CreateTable
CREATE TABLE "Commit" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,

    CONSTRAINT "Commit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComponentUpdate" (
    "id" TEXT NOT NULL,
    "commit_id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "date_modified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComponentUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ComponentUpdate_location_id_key" ON "ComponentUpdate"("location_id");

-- AddForeignKey
ALTER TABLE "ComponentUpdate" ADD CONSTRAINT "ComponentUpdate_commit_id_fkey" FOREIGN KEY ("commit_id") REFERENCES "Commit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentUpdate" ADD CONSTRAINT "ComponentUpdate_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

--

ALTER TABLE "ComponentAttribute" DROP CONSTRAINT "ComponentAttribute_component_id_fkey";

-- DropForeignKey
ALTER TABLE "ComponentElement" DROP CONSTRAINT "ComponentElement_parent_id_fkey";

-- DropIndex
DROP INDEX "ComponentAttribute_component_id_key";

-- AlterTable
ALTER TABLE "ComponentAttribute" ADD COLUMN     "component_parent_id" TEXT;

UPDATE "ComponentAttribute" a
SET "component_parent_id" = COALESCE(b."parent_id", '')
FROM "ComponentElement" b
WHERE b."id" = a."component_id";

ALTER TABLE "ComponentAttribute"
ALTER COLUMN "component_parent_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "ComponentElement" DROP CONSTRAINT "ComponentElement_pkey",
ADD COLUMN     "parent_parent_id" TEXT;

UPDATE "ComponentElement" a
SET "parent_parent_id"=b."parent_id"
FROM "ComponentElement" b
WHERE a."parent_id"=b."id";

UPDATE "ComponentElement"
SET "parent_id"=''
WHERE "parent_id" IS NULL;

ALTER TABLE "ComponentElement"
ALTER COLUMN "parent_id" SET NOT NULL,
ADD CONSTRAINT "ComponentElement_pkey" PRIMARY KEY ("id", "parent_id");

-- AlterTable
ALTER TABLE "ComponentUpdate" ADD COLUMN     "component_parent_id" TEXT;

UPDATE "ComponentUpdate" a
SET "component_parent_id"=COALESCE(b."parent_id", '')
FROM "ComponentElement" b
WHERE b."id"=a."component_id";

ALTER TABLE "ComponentUpdate"
ALTER COLUMN "component_parent_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ComponentAttribute_component_id_component_parent_id_key" ON "ComponentAttribute"("component_id", "component_parent_id");

-- AddForeignKey
ALTER TABLE "ComponentUpdate" ADD CONSTRAINT "ComponentUpdate_component_id_component_parent_id_fkey" FOREIGN KEY ("component_id", "component_parent_id") REFERENCES "ComponentElement"("id", "parent_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentElement" ADD CONSTRAINT "ComponentElement_parent_id_parent_parent_id_fkey" FOREIGN KEY ("parent_id", "parent_parent_id") REFERENCES "ComponentElement"("id", "parent_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentAttribute" ADD CONSTRAINT "ComponentAttribute_component_id_component_parent_id_fkey" FOREIGN KEY ("component_id", "component_parent_id") REFERENCES "ComponentElement"("id", "parent_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropIndex
DROP INDEX "ComponentElement_location_id_key";
