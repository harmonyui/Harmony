/*
  Warnings:

  - Added the required column `prettier_config` to the `Repository` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Repository" ADD COLUMN     "prettier_config" TEXT;

UPDATE "Repository" SET "prettier_config" = '{"trailingComma":"es5","semi":true,"tabWidth":2,"singleQuote":true,"jsxSingleQuote":true}';

ALTER TABLE "Repository" ALTER COLUMN "prettier_config" SET NOT NULL;
