-- CreateTable
CREATE TABLE "ChatBubble" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "offset_x" DOUBLE PRECISION NOT NULL,
    "offset_y" DOUBLE PRECISION NOT NULL,
    "account_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatBubble_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatBubble_branch_id_idx" ON "ChatBubble"("branch_id");

-- CreateIndex
CREATE INDEX "ChatBubble_component_id_idx" ON "ChatBubble"("component_id");

-- AddForeignKey
ALTER TABLE "ChatBubble" ADD CONSTRAINT "ChatBubble_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatBubble" ADD CONSTRAINT "ChatBubble_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
