import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  let body = await readBody<{skillId: number | null}>(event);

  let last2Answers = await prisma.fluencyAnswer.findMany({
    orderBy: {
      id: 'desc'
    },
    take: 2
  });

  let found: {
    id: number;
    createdAt: Date;
    skillId: number;
    text: string;
    timesShown: number;
    skill: {
      name: string;
      id: number;
    }
  } | null = null;

  if(last2Answers.length === 0){
    found = await findAnyQuestion(body.skillId);
  }else if(last2Answers.length === 1){
    if(last2Answers[0]){
      if(last2Answers[0].isCorrect){
        found = await findAnyQuestion(body.skillId);
      }else{
        found = await findExactlySameQuestion(last2Answers[0].questionId);
      }
    }
  }else if(last2Answers.length === 2){
    if(last2Answers[0] && last2Answers[1]){
      if(!last2Answers[0].isCorrect){
        found = await findExactlySameQuestion(last2Answers[0].questionId);
      }else{
        if(!last2Answers[1].isCorrect){
          found = await findAnyQuestionFromSameSkill(last2Answers[1].skillId);
        }else{
          found = await findAnyQuestion(body.skillId);
        }
      }
    }
  }


  if(found){
    await prisma.fluencyQuestion.update({
      where: {
        id: found.id
      },
      data: {
        timesShown: found.timesShown + 1
      }
    });
  }else{
    throw createError({
      statusCode: 404,
      message: 'No question found'
    });
  }

  return found;
})


async function findAnyQuestion(skillId: number | null){
  let found = await prisma.fluencyQuestion.findFirst({
    where: {
      skillId: skillId || undefined
    },
    orderBy: {
      timesShown: 'asc'
    },
    include: {
      skill: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  return found;
}

async function findExactlySameQuestion(questionId: number){
  let found = await prisma.fluencyQuestion.findFirst({
    where: {
      id: questionId
    },
    include: {
      skill: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  return found;
}

async function findAnyQuestionFromSameSkill(skillId: number){
  let found = await prisma.fluencyQuestion.findFirst({
    where: {
      skillId: skillId
    },
    orderBy: {
      timesShown: 'asc'
    },
    include: {
      skill: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  return found;
}