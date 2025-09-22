-- ========================================================
-- Migration segura: renomear tabelas e manter dados
-- ========================================================

-- 1️⃣ Renomear tabelas
ALTER TABLE "public"."users" RENAME TO "user";
ALTER TABLE "public"."questionnaires" RENAME TO "questionnaire";
ALTER TABLE "public"."blocks" RENAME TO "block";
ALTER TABLE "public"."questions" RENAME TO "question";
ALTER TABLE "public"."user_answers" RENAME TO "user_answer";

-- 2️⃣ Renomear foreign key constraints
ALTER TABLE "public"."block" RENAME CONSTRAINT "blocks_questionnaireId_fkey" TO "block_questionnaireId_fkey";
ALTER TABLE "public"."question" RENAME CONSTRAINT "questions_blockId_fkey" TO "question_blockId_fkey";
ALTER TABLE "public"."user_answer" RENAME CONSTRAINT "user_answers_questionId_fkey" TO "user_answer_questionId_fkey";
ALTER TABLE "public"."user_answer" RENAME CONSTRAINT "user_answers_userId_fkey" TO "user_answer_userId_fkey";

-- 3️⃣ Renomear primary key constraints
ALTER TABLE "public"."user" RENAME CONSTRAINT "users_pkey" TO "user_pkey";
ALTER TABLE "public"."questionnaire" RENAME CONSTRAINT "questionnaires_pkey" TO "questionnaire_pkey";
ALTER TABLE "public"."block" RENAME CONSTRAINT "blocks_pkey" TO "block_pkey";
ALTER TABLE "public"."question" RENAME CONSTRAINT "questions_pkey" TO "question_pkey";
ALTER TABLE "public"."user_answer" RENAME CONSTRAINT "user_answers_pkey" TO "user_answer_pkey";
