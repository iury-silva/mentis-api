import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import questionnaireData from '../src/questionnaire/questionnaire.json';

const prisma = new PrismaClient();

async function main() {
  // Cria o questionário
  const questionnaire = await prisma.questionnaire.create({
    data: {
      title: questionnaireData.title,
      description: questionnaireData.description,
    },
  });

  // Mapeia blocos com UUIDs
  const blockMap: Record<string, string> = {};
  questionnaireData.blocks.forEach((block: any) => {
    blockMap[block.id] = randomUUID();
  });

  // Cria perguntas
  for (const block of questionnaireData.blocks) {
    for (const q of block.questions) {
      await prisma.question.create({
        data: {
          questionnaireId: questionnaire.id,
          blockId: blockMap[block.id],
          type: q.type,
          question: q.question,
          options: q.options ? q.options : undefined,
        },
      });
    }
  }

  console.log('✅ Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
