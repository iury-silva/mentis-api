-- CreateTable
CREATE TABLE "public"."mood_record" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score_mood" INTEGER NOT NULL,
    "score_anxiety" INTEGER NOT NULL,
    "score_energy" INTEGER NOT NULL,
    "score_sleep" INTEGER NOT NULL,
    "score_stress" INTEGER NOT NULL,
    "notes" TEXT,
    "ai_insight" TEXT,
    "ai_features" JSONB,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mood_record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mood_record_userId_date_key" ON "public"."mood_record"("userId", "date");

-- AddForeignKey
ALTER TABLE "public"."mood_record" ADD CONSTRAINT "mood_record_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
