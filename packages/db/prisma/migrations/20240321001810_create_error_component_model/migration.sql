-- CreateTable
CREATE TABLE "ComponentError" (
    "id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    "component_parent_id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,

    CONSTRAINT "ComponentError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ComponentError_component_parent_id_component_id_key" ON "ComponentError"("component_parent_id", "component_id");
