# Fluency

Main idea: quick answer for a short question.

Questions are:
- divided by training skills: 
- - past simple - to talk about past events,
- - present simple - to talk about daily routines and facts,
- - future - to talk about future plans and predictions,
- - article_guided_noun - to train a/an/the/no article,
- - article_two_step_reference - to train a/an/the/no article,
- - article_repair_speaking - to train a/an/the/no article,
- all questions are precreated and stored in the database:
- - id, text, skillId, timesShown, createdAt

Skills are:
- precreated and stored in the database:
- - id, name, evaluationPrompt

Stats are:
- stored in the database:
- - id, date, questionId, skillId, isCorrect, speechDurationMs, reactionDelayMs, userAnswer
- - - answerTime is time from first word in sentence to the last word in sentence in ms

Logic:
- page asks for microphone access
- page requires random question from the database
- user sees question
- user starts speaking answer, page uses 11labs recognition with temp token
- page fixes start and end time, sends answer to the server
- server evaluates answer with GPT against the question and skill's prompt
- IF OK:
- - server saves stats with isCorrect = true
- - page shows "Correct!" and moves to the next random question after 2 seconds
- IF NOT OK:
- - server saves stats with isCorrect = false
- - page shows short feedback and right answer format
- - page awaits for user press space on any place on screen to continue
- - page shows same question again
- - user sees question
- - user starts speaking answer, page uses 11labs recognition with temp token
- - page fixes start and end time, sends answer to the server
- - server evaluates answer with GPT against the question and skill's prompt
- - IF OK:
- - - server saves stats with isCorrect = true
- - - page shows "Correct!" and moves to the next random question IN SAME SKILL after 2 seconds
- - IF NOT OK:
- - - (repeat same as before, but after correct answer page shows next random question IN SAME SKILL)


Skill prompt sample:
- schema:
```
{
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
```
- prompt for *past simple* skill:
```
You are evaluating the skill: past_simple.

The learner should answer about a completed action in the past.

Mark target_skill_passed as true if:
- the answer is on topic, and
- the learner mainly uses past-time meaning correctly, and
- the main verb forms are appropriate for past simple.

Mark primary_error as:
- wrong_tense if the learner uses present or future instead of past for the main action
- wrong_verb_form if the learner clearly attempts past meaning but uses the wrong verb form
- off_topic if the answer does not address the question

Be tolerant of:
- missing small details
- slightly unnatural wording
- minor vocabulary limitations

Examples:
- "I went to the shop yesterday" -> passed
- "I go to the shop yesterday" -> not passed, wrong_tense or wrong_verb_form
- "Yesterday I watched TV" -> passed

Do not fail the answer for mistakes unrelated to the target skill.
```
- prompt for *present simple* skill:
```
You are evaluating the skill: present_simple.

The learner should answer using present-time facts, habits, routines, or regular actions.

Mark target_skill_passed as true if:
- the answer is on topic, and
- the learner mainly uses present simple appropriately for habits, routines, or general facts

Mark primary_error as:
- wrong_tense if the learner uses past or future where present simple is expected
- wrong_verb_form if the learner uses the wrong main verb form in a way that breaks the target pattern
- off_topic if the answer does not address the question

Be tolerant of:
- minor missing words
- simple vocabulary
- small awkward phrasing

Examples:
- "I drink tea every morning" -> passed
- "I drank tea every morning" -> not passed
- "I go to work by bus" -> passed

Do not fail the answer for mistakes unrelated to the target skill.
```
- prompt for *future simple* skill:
```
You are evaluating the skill: future_simple.

The learner should answer about future plans, intentions, or expected actions.

Mark target_skill_passed as true if:
- the answer is on topic, and
- the learner clearly expresses future meaning appropriately

Accept simple future forms such as:
- will
- going to

Mark primary_error as:
- wrong_tense if the learner answers in present or past without expressing future meaning
- missing_auxiliary if the future construction is broken in an important way
- off_topic if the answer does not address the question

Be tolerant of:
- simple wording
- natural short answers
- small non-critical mistakes

Examples:
- "I will work tomorrow" -> passed
- "I am going to visit my friend" -> passed
- "I work tomorrow" -> usually not passed unless the context still clearly conveys future and the wording is natural enough

Do not fail the answer for mistakes unrelated to the target skill.
```
- prompt for *article_guided_noun* skill:
```
You are evaluating the skill: article_guided_noun.

The learner should produce a short spoken answer that follows the task instruction and uses English articles appropriately around the required noun.

The question will tell the learner to use a specific word in one short sentence or a very short answer.

Mark target_skill_passed as true if:
- the answer is meaningfully related to the question, and
- the learner uses the required noun from the question, and
- the learner uses that noun as a normal noun in the sentence, and
- article usage around that noun is acceptable

Mark target_skill_passed as false if:
- the learner does not use the required word, or
- the learner avoids the target pattern by changing the structure too much, or
- the learner uses the required noun but article usage around it is clearly wrong in an important place

Mark primary_error as:
- missing_article if a singular countable noun clearly needs an article and it is missing
- wrong_article if the learner uses the wrong article in an important place
- off_topic if the answer does not address the question
- grammar_other if the learner is trying to answer correctly but the result is too broken to accept for the target skill

Be strict about the task format:
- the learner must use the required word from the question
- if the learner avoids the intended article pattern by not using the required noun properly, do not pass the answer

Be tolerant of:
- minor unrelated grammar mistakes
- imperfect style
- short and simple wording

Focus only on the most important article issue around the required noun.
Do not fail the answer for mistakes unrelated to the target skill.

Examples:
- Question: Use the word "book" in one sentence.
  Answer: "I bought a book yesterday." -> passed
- Question: Use the word "book" in one sentence.
  Answer: "I bought book yesterday." -> not passed, missing_article
- Question: Use the word "book" in one sentence.
  Answer: "It is very useful." -> not passed, off_topic
- Question: Use the word "apple" in one sentence.
  Answer: "I ate an apple." -> passed

If the learner avoids the required task format, mark target_skill_passed as false.

Prefer failing the answer if the learner avoids the intended article pattern instead of clearly demonstrating it.
```
- prompt for *article_two_step_reference* skill:
```
You are evaluating the skill: article_two_step_reference.

The learner should produce a short spoken answer that follows a two-step reference pattern:
- first mention a singular countable noun for the first time
- then mention the same noun again as a known specific thing

This skill is mainly about using:
- a or an for first mention
- the for second mention

Mark target_skill_passed as true if:
- the answer is meaningfully related to the question, and
- the learner clearly produces two parts, ideas, or sentences, and
- the same noun is introduced first and then referred to again, and
- article usage follows the expected first-mention then second-mention pattern well enough

Mark target_skill_passed as false if:
- the learner does not follow the two-step pattern, or
- the learner does not clearly refer to the same noun twice, or
- the learner avoids the target pattern, or
- the article usage breaks the first-mention then second-mention logic in an important way

Mark primary_error as:
- missing_article if a needed article is omitted in an important place
- wrong_article if the learner uses the wrong article in an important place
- off_topic if the answer does not address the question
- grammar_other if the learner attempts the pattern but the result is too broken to accept

Be strict about the task format:
- the learner must show first mention and second mention
- the learner should refer to the same object, not two unrelated objects
- if the learner avoids the pattern, do not pass the answer

Be tolerant of:
- minor unrelated grammar mistakes
- imperfect style
- simple wording

Focus on whether the learner correctly demonstrates the reference pattern.
Do not fail the answer for mistakes unrelated to the target skill.

Examples:
- Question: Make two sentences about a car. Mention it for the first time, then mention it again.
  Answer: "I bought a car. The car is outside." -> passed
- Question: Make two sentences about a car. Mention it for the first time, then mention it again.
  Answer: "I bought car. The car is outside." -> not passed, missing_article
- Question: Make two sentences about a car. Mention it for the first time, then mention it again.
  Answer: "The car is nice. The car is fast." -> not passed, wrong_article
- Question: Make two sentences about a phone. Mention it for the first time, then mention it again.
  Answer: "I have a phone. The phone is on the table." -> passed

If the learner avoids the required task format, mark target_skill_passed as false.

Prefer failing the answer if the learner avoids the intended article pattern instead of clearly demonstrating it.
```
- prompt for *article_repair_speaking* skill:
```
You are evaluating the skill: article_repair_speaking.

The learner should correct a short incorrect sentence and say it in a correct natural form.

The main goal is to fix article usage:
- a
- an
- the
- no article

Mark target_skill_passed as true if:
- the learner clearly attempts to correct the given sentence, and
- the important article mistakes are corrected, and
- the corrected answer keeps the original meaning close enough

Mark target_skill_passed as false if:
- the learner does not meaningfully correct the given sentence, or
- the important article mistake is still present, or
- the learner changes the sentence so much that the original correction task is no longer followed

Mark primary_error as:
- missing_article if a needed article is still missing
- wrong_article if the learner still uses the wrong article in an important place
- off_topic if the answer does not address the correction task
- grammar_other if the learner attempts a correction but the result is too broken to accept

Be strict about the task format:
- the learner should correct the given sentence, not answer with a different unrelated sentence
- small wording changes are acceptable if the meaning stays close
- the main article issue must be fixed

Be tolerant of:
- minor unrelated grammar mistakes
- small wording differences
- simple phrasing

Focus only on whether the learner successfully repaired the article problem.
Do not fail the answer for mistakes unrelated to the target skill.

Examples:
- Question: Say this correctly: "There is laptop on table."
  Answer: "There is a laptop on the table." -> passed
- Question: Say this correctly: "There is laptop on table."
  Answer: "There is laptop on the table." -> not passed, missing_article
- Question: Say this correctly: "I bought book yesterday."
  Answer: "I bought a book yesterday." -> passed
- Question: Say this correctly: "I bought book yesterday."
  Answer: "Yesterday I bought book." -> not passed, missing_article

If the learner avoids the required task format, mark target_skill_passed as false.
```



GPT evaluation messages example:
```
SYSTEM MESSAGE

JSON SCHEMA

USER MESSAGE {
  "skill": "past_simple",
  "question": "What did you do yesterday?",
  "transcript": "I go to shop yesterday"
}
```