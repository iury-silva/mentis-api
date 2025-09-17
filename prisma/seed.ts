// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const questionnaireData = require('../src/questionnaire/questionnaire.json'); // arquivo que você já tem

async function main() {
  // cria questionário
  const questionnaire = await prisma.questionnaire.create({
    data: {
      title: questionnaireData.title,
      description: questionnaireData.description ?? null,
    },
  });

  // percorre blocos do JSON e cria Block + perguntas
  for (const block of questionnaireData.blocks) {
    const blockCreated = await prisma.block.create({
      data: {
        questionnaireId: questionnaire.id,
        order: block.id,                 // usa o id numerico do JSON como ordem
        title: block.title,
        description: block.description ?? null,
        bonus: block.bonus ?? null,      // caso queira colocar bonificação no JSON
      },
    });

    const questionsData = block.questions.map(q => ({
      blockId: blockCreated.id,
      type: q.type,
      question: q.question,
      options: q.options ?? null,
    }));

    // Bulk insert das perguntas do bloco
    await prisma.question.createMany({
      data: questionsData,
      skipDuplicates: true,
    });
  }

  console.log('✅ Seed concluído!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
