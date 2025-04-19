/*
  Warnings:

  - Added the required column `childIndex` to the `ChatBubble` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChatBubble" ADD COLUMN     "childIndex" INTEGER;

UPDATE "ChatBubble" SET "childIndex" = 0;

ALTER TABLE "ChatBubble" ALTER COLUMN "childIndex" SET NOT NULL;
