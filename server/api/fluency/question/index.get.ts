import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  let body = await getQuery<{skillId?: string | null}>(event);
  const selectedSkillId = parseSkillId(body.skillId);
  console.log('Received request for question with skillId', selectedSkillId);

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
    found = await findAnyQuestion(selectedSkillId);
  }else if(last2Answers.length === 1){
    if(last2Answers[0]){
      if(last2Answers[0].isCorrect){
        found = await findAnyQuestion(selectedSkillId);
      }else{
        if(!selectedSkillId || selectedSkillId === last2Answers[0].skillId){
          found = await findExactlySameQuestion(last2Answers[0].questionId);
        }else{
          found = await findAnyQuestion(selectedSkillId);
        }
      }
    }
  }else if(last2Answers.length >= 2){
    if(last2Answers[0] && last2Answers[1]){
      if(!last2Answers[0].isCorrect){
        if(!selectedSkillId || selectedSkillId === last2Answers[0].skillId){
          found = await findExactlySameQuestion(last2Answers[0].questionId);
        }else{
          found = await findAnyQuestion(selectedSkillId);
        }
      }else{
        if(!last2Answers[1].isCorrect){
          if(!selectedSkillId || selectedSkillId === last2Answers[1].skillId){
            found = await findAnyQuestionFromSameSkill(last2Answers[1].skillId);
          }else{
            found = await findAnyQuestion(selectedSkillId);
          }
        }else{
          found = await findAnyQuestion(selectedSkillId);
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
  console.log('findAnyQuestion ->', skillId);
  let found = await findRandomQuestionWithMinTimesShown({
    skillId: skillId || undefined
  });
  return found;
}

async function findExactlySameQuestion(questionId: number){
  console.log('findExactlySameQuestion ->', questionId);
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
  console.log('findAnyQuestionFromSameSkill ->', skillId);
  let found = await findRandomQuestionWithMinTimesShown({ skillId });
  return found;
}

async function findRandomQuestionWithMinTimesShown(where: {skillId?: number}){
  const minTimesShownResult = await prisma.fluencyQuestion.aggregate({
    where,
    _min: {
      timesShown: true,
    },
  });

  const minTimesShown = minTimesShownResult._min.timesShown;
  if(minTimesShown === null){
    return null;
  }

  const candidates = await prisma.fluencyQuestion.findMany({
    where: {
      ...where,
      timesShown: minTimesShown,
    },
    select: {
      id: true,
    },
  });

  if(candidates.length === 0){
    return null;
  }

  const randomCandidate = candidates[Math.floor(Math.random() * candidates.length)];
  if(!randomCandidate){
    return null;
  }

  const found = await prisma.fluencyQuestion.findFirst({
    where: {
      id: randomCandidate.id,
    },
    include: {
      skill: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return found;
}

function parseSkillId(rawSkillId: string | null | undefined){
  if(!rawSkillId){
    return null;
  }

  const parsed = Number(rawSkillId);
  if(!Number.isInteger(parsed) || parsed <= 0){
    return null;
  }

  return parsed;
}
