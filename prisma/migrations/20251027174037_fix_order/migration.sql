/*
  Warnings:

  - You are about to drop the column `order` on the `question` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."question" DROP COLUMN "order",
ADD COLUMN     "questionOrder" INTEGER;
