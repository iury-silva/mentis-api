const MoodSchemaResponse = {
  type: 'object',
  properties: {
    score_mood: {
      type: 'integer',
      minimum: 1,
      maximum: 5,
      description:
        'Humor geral: 1=muito ruim, 2=ruim, 3=neutro, 4=bom, 5=muito bom',
    },
    score_anxiety: {
      type: 'integer',
      minimum: 1,
      maximum: 5,
      description: 'Nível de ansiedade: 1=muito baixa, 5=muito alta',
    },
    score_energy: {
      type: 'integer',
      minimum: 1,
      maximum: 5,
      description: 'Nível de energia: 1=muito baixa, 5=muito alta',
    },
    score_sleep: {
      type: 'integer',
      minimum: 1,
      maximum: 5,
      description: 'Qualidade do sono: 1=muito ruim, 5=excelente',
    },
    score_stress: {
      type: 'integer',
      minimum: 1,
      maximum: 5,
      description: 'Nível de estresse: 1=muito baixo, 5=muito alto',
    },
    notes: {
      type: 'string',
      description:
        'TRANSCRIÇÃO EXATA do que o usuário disse no áudio. NÃO invente ou adicione nada.',
    },
    transcripted_audio: {
      type: 'string',
      description: 'Áudio transcrito do que o usuário disse.',
    },
    ai_insight: {
      type: 'string',
      description:
        'Insight empático baseado na transcrição E nas métricas vocais (pitch, jitter, shimmer, etc). Seja breve e útil.',
    },
  },
  required: [
    'score_mood',
    'score_anxiety',
    'score_energy',
    'score_sleep',
    'score_stress',
    'ai_insight',
  ],
};

export { MoodSchemaResponse };
