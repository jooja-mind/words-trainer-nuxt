import {prisma} from '../server/utils/prisma';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

type SkillObjectType = {
  skillName: string,
  evaluationPromptPath: string
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  let toFill: {[key: string]: SkillObjectType} = {
    'article_guided_noun_500_prompts.txt': {
      skillName: 'Article Guided Noun',
      evaluationPromptPath: 'skills/article_guided_noun_prompt.txt'
    },
    'article_repair_speaking_500_prompts.txt': {
      skillName: 'Article Repair Speaking',
      evaluationPromptPath: 'skills/article_repair_speaking_prompt.txt'
    },
    'article_two_step_reference_500_prompts.txt': {
      skillName: 'Article Two Step Reference',
      evaluationPromptPath: 'skills/article_two_step_reference_prompt.txt'
    },
    'article_ru_en_tricky_500_questions.txt': {
      skillName: 'Article RU to EN Tricky',
      evaluationPromptPath: 'skills/article_ru_en_tricky_prompt.txt'
    },
    'future_simple_500_questions.txt': {
      skillName: 'Future Simple',
      evaluationPromptPath: 'skills/future_simple_prompt.txt'
    },
    'past_simple_500_questions.txt': {
      skillName: 'Past Simple',
      evaluationPromptPath: 'skills/past_simple_prompt.txt'
    },
    'present_simple_500_questions.txt': {
      skillName: 'Present Simple',
      evaluationPromptPath: 'skills/present_simple_prompt.txt'
    },
    'question_building_present_500_questions.txt': {
      skillName: 'Question Building Present',
      evaluationPromptPath: 'skills/question_building_present_prompt.txt'
    },
    'question_building_past_500_questions.txt': {
      skillName: 'Question Building Past',
      evaluationPromptPath: 'skills/question_building_past_prompt.txt'
    },
    'question_building_future_500_questions.txt': {
      skillName: 'Question Building Future',
      evaluationPromptPath: 'skills/question_building_future_prompt.txt'
    }
  };

  for(let fileName in toFill){
    await fill(fileName, toFill[fileName]!);
  }
}

async function fill(fileName: string, skill: SkillObjectType){
  let skillExists = await prisma.fluencySkill.findUnique({ where: { name: skill.skillName } });
  if(skillExists){
    console.log(`Skill ${skill.skillName} already exists, skipping ${fileName}`);
    return;
  }

  let evaluationPrompt = fs.readFileSync(path.join(scriptDir, skill.evaluationPromptPath), 'utf-8');
  if(!evaluationPrompt){
    console.log(`Evaluation prompt for skill ${skill.skillName} not found at ${skill.evaluationPromptPath}, skipping ${fileName}`);
    return;
  }

  let createdSkill = await prisma.fluencySkill.create({
    data: {
      name: skill.skillName,
      evaluationPrompt
    }
  });

  let questions = fs.readFileSync(path.join(scriptDir, 'questions', fileName), 'utf-8').split('\n');
  questions.push('');

  let writeBuffer = [];
  let count = 0;
  for(let q of questions){
    q = q.trim();
    if(q.length === 0){
      if(writeBuffer.length > 0){
        let questionText = writeBuffer.join('\n');
        await prisma.fluencyQuestion.create({
          data: {
            text: questionText,
            skillId: createdSkill.id
          }
        });
        count++;
        console.log(`Inserted question for skill ${skill.skillName}: ${count}`);
      }
      writeBuffer = [];
      continue;
    }
    writeBuffer.push(q);
  }
};

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
