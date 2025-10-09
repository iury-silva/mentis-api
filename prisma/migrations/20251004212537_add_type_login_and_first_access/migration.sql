-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "first_access" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "type_login" TEXT;
