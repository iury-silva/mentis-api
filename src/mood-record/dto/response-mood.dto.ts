export class ResponseMoodDto {
  aiAnalysis: {
    score_mood: number;
    score_anxiety: number;
    score_energy: number;
    score_sleep: number;
    score_stress: number;
    notes?: string;
    ai_insight: string;
  };
}
