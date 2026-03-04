import { defineEventHandler } from 'h3'
import * as GPT from '../../../utils/GPT'

export default defineEventHandler(async (event) => {
  let body = await readBody<{questionId: number, answer: string, speechDurationMs: number, reactionDelayMs: number}>(event);

  let foundQuestion = await prisma.fluencyQuestion.findUnique({
    where: {
      id: body.questionId
    },
    include: {
      skill: true
    }
  });

  if(!foundQuestion){
    throw createError({
      statusCode: 404,
      message: 'Question not found'
    });
  }

  if(!foundQuestion.skill.evaluationPrompt){
    throw createError({
      statusCode: 400,
      message: 'Skill does not have evaluation prompt'
    });
  }

  let evaluation = await GPT.ask<{
    target_skill_passed: boolean;
    explanation: string;
    corrected_answer: string;
    short_feedback: string;
    primary_error: 'none' | 'off_topic' | 'wrong_tense' | 'wrong_verb_form' | 'missing_article' | 'wrong_article' | 'missing_auxiliary' | 'grammar_other' | 'format_not_followed';
  }>({
    systemPrompt: foundQuestion.skill.evaluationPrompt,
    triggerPrompt: `TASK:\n${foundQuestion.text}\n\nUSER TEXT:\n${body.answer}`,
    model: 'gpt-5.2',
    jsonSchema: {
      "type": "json_schema",
      "name": "EvaluationResult",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "target_skill_passed": {
            "type": "boolean",
            "description": "Whether the user successfully used the target grammar skill for this exercise."
          },
          "explanation": {
            "type": "string",
            "description": "A very short explanation of the main issue. Keep it concise."
          },
          "corrected_answer": {
            "type": "string",
            "description": "A corrected natural version of the user's answer in simple English. Keep it short. Preserve the learner’s meaning. Make it easy to repeat aloud."
          },
          "short_feedback": {
            "type": "string",
            "description": "A short coaching message for the learner, ideally 1 to 2 short sentences."
          },
          "primary_error": {
            "type": "string",
            "enum": [
              "none",
              "off_topic",
              "wrong_tense",
              "wrong_verb_form",
              "missing_article",
              "wrong_article",
              "missing_auxiliary",
              "grammar_other",
              "format_not_followed"
            ],
            "description": "The single most important error to highlight."
          }
        },
        "required": [
          "target_skill_passed",
          "explanation",
          "corrected_answer",
          "short_feedback",
          "primary_error"
        ],
        "additionalProperties": false
      }
    }
  });
  
  await prisma.fluencyAnswer.create({
    data: {
      questionId: body.questionId,
      skillId: foundQuestion.skillId,
      isCorrect: evaluation.target_skill_passed,
      speechDurationMs: body.speechDurationMs,
      reactionDelayMs: body.reactionDelayMs,
      answer: body.answer,
    }
  });

  return {
    evaluation,
    body
  };
})