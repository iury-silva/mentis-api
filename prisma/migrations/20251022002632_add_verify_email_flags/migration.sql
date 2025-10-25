-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "verify_email" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verify_token" TEXT;
