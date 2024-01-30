/*
  Warnings:

  - You are about to drop the column `end` on the `ComponentDefinition` table. All the data in the column will be lost.
  - You are about to drop the column `file` on the `ComponentDefinition` table. All the data in the column will be lost.
  - You are about to drop the column `start` on the `ComponentDefinition` table. All the data in the column will be lost.
  - You are about to drop the column `end` on the `ComponentElement` table. All the data in the column will be lost.
  - You are about to drop the column `file` on the `ComponentElement` table. All the data in the column will be lost.
  - You are about to drop the column `start` on the `ComponentElement` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[location_id]` on the table `ComponentDefinition` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[location_id]` on the table `ComponentElement` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `location_id` to the `ComponentDefinition` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location_id` to the `ComponentElement` table without a default value. This is not possible if the table is not empty.

*/

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "start" INTEGER NOT NULL,
    "end" INTEGER NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComponentAttribute" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,

    CONSTRAINT "ComponentAttribute_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Location" ("id", "end", "file", "start")
SELECT CONCAT("ComponentDefinition"."id", '-definition') as "id", "end", "file", "start" 
FROM "ComponentDefinition";

INSERT INTO "Location" ("id", "end", "file", "start")
SELECT CONCAT("ComponentElement"."id", '-element') as "id", "end", "file", "start" 
FROM "ComponentElement";

-- AlterTable
ALTER TABLE "ComponentDefinition" DROP COLUMN "end",
DROP COLUMN "file",
DROP COLUMN "start",
ADD COLUMN     "location_id" TEXT NOT NULL DEFAULT '0';

-- AlterTable
ALTER TABLE "ComponentElement" DROP COLUMN "end",
DROP COLUMN "file",
DROP COLUMN "start",
ADD COLUMN     "location_id" TEXT NOT NULL DEFAULT '0';

UPDATE "ComponentDefinition"
SET "location_id" = CONCAT("id", '-definition');

UPDATE "ComponentElement"
SET "location_id" = CONCAT("id", '-element');

-- CreateIndex
CREATE UNIQUE INDEX "ComponentAttribute_component_id_key" ON "ComponentAttribute"("component_id");

-- CreateIndex
CREATE UNIQUE INDEX "ComponentAttribute_location_id_key" ON "ComponentAttribute"("location_id");

-- CreateIndex
CREATE UNIQUE INDEX "ComponentDefinition_location_id_key" ON "ComponentDefinition"("location_id");

-- CreateIndex
CREATE UNIQUE INDEX "ComponentElement_location_id_key" ON "ComponentElement"("location_id");

-- AddForeignKey
ALTER TABLE "ComponentElement" ADD CONSTRAINT "ComponentElement_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentAttribute" ADD CONSTRAINT "ComponentAttribute_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "ComponentElement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentAttribute" ADD CONSTRAINT "ComponentAttribute_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentDefinition" ADD CONSTRAINT "ComponentDefinition_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
