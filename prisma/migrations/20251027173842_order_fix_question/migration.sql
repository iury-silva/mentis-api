-- AlterTable
ALTER TABLE "public"."question" ALTER COLUMN "order" DROP NOT NULL,
ALTER COLUMN "order" DROP DEFAULT;
