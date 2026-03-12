import { defineEventHandler, readBody } from 'h3'
import * as GPT from '../../../utils/GPT'

export default defineEventHandler(async (event) => {
  let { count, mainIdea } = await readBody(event);

  if (!count || !mainIdea) {
    throw createError({ statusCode: 400, statusMessage: 'count and mainIdea are required' });
  }

  let result = await GPT.ask<{items: string[]}>({
    systemPrompt: `You generate short English recap topics for speaking practice.
A recap topic is an open-ended situation seed, not a full plot, not a headline, and not an abstract theme.

Follow these rules:
- Write each topic as one concise English sentence fragment, usually 7-14 words.
- Describe a situation, misunderstanding, decision, obstacle, pressure, change, or tension.
- Keep it specific enough to imagine a story, but do not include names, places, brands, dates, numbers, or detailed backstory.
- Do not resolve the situation and do not imply a final outcome.
- Do not write questions, commands, morals, lessons, or generic labels such as "friendship" or "success".
- Prefer everyday life, travel, study, work, social, or software-team situations when relevant to the main idea.
- Keep the tone natural, neutral, and varied.
- Make all topics distinct in wording and scenario type.`,
    triggerPrompt: `Main idea: "${mainIdea}". \nGenerate ${count} recap topics based on this main idea.`,
    model: 'gpt-5.2',
    reasoningEffort: 'high',
    jsonSchema: {
      "type": "json_schema",
      "name": "RecapTopics",
      "strict": true,
      "schema": {
        "type": "array",
        "items": {
          "type": "string"
        }
      }
    }
  });

  let createdTopics = [];
  for(let item of result.items){
    let created = await prisma.recapTopic.create({
      data: {
        text: item
      }
    });
    createdTopics.push(created);
  }

  return createdTopics;
})

/*
Topic examples:
1	A routine task becoming unexpectedly complicated	2026-03-13 05:01:48.678
2	A person adjusting to unfamiliar rules and habits	2026-03-13 05:01:48.678
3	A team working under pressure while trying to stay calm	2026-03-13 05:01:48.678
4	Unexpected news changing the mood of an ordinary day	2026-03-13 05:01:48.678
5	Someone trying something new without feeling fully prepared	2026-03-13 05:01:48.678
6	A conversation shaped by different priorities	2026-03-13 05:01:48.678
7	A decision that feels risky even without obvious danger	2026-03-13 05:01:48.678
8	An everyday service experience that leaves a strong impression	2026-03-13 05:01:48.678
9	A misunderstanding caused more by assumptions than facts	2026-03-13 05:01:48.678
10	A moment when confidence turns out to be incomplete	2026-03-13 05:01:48.678
11	Travel plans being disrupted by small practical problems	2026-03-13 05:01:48.678
12	Running into someone from the past in a surprising context	2026-03-13 05:01:48.678
13	Preparing for visitors while several small things go wrong	2026-03-13 05:01:48.678
14	Losing access to something important for a short time	2026-03-13 05:01:48.678
15	Trying to handle an unfamiliar task with limited experience	2026-03-13 05:01:48.678
16	Being asked for help at a slightly inconvenient moment	2026-03-13 05:01:48.678
17	Realizing too late that something important was forgotten	2026-03-13 05:01:48.678
18	Questioning an expensive or ambitious choice soon after making it	2026-03-13 05:01:48.678
19	An ordinary day slowly becoming memorable for unexpected reasons	2026-03-13 05:01:48.678
20	A small disagreement leading to a more honest exchange	2026-03-13 05:01:48.678
21	A plan changing because one detail was overlooked	2026-03-13 05:01:48.678
22	A person trying to look confident while feeling uncertain	2026-03-13 05:01:48.678
23	Balancing politeness with honesty in a delicate situation	2026-03-13 05:01:48.678
24	A simple problem turning out to have emotional consequences	2026-03-13 05:01:48.678
25	An attempt to help creating extra complications	2026-03-13 05:01:48.678
26	A day shaped by interruptions and shifting priorities	2026-03-13 05:01:48.678
27	A choice between comfort and opportunity	2026-03-13 05:01:48.678
28	A familiar place suddenly feeling different	2026-03-13 05:01:48.678
29	Cooperating with someone whose style is completely different	2026-03-13 05:01:48.678
30	Trying to fix a mistake without drawing too much attention	2026-03-13 05:01:48.678
31	A situation where timing matters more than talent	2026-03-13 05:01:48.678
32	A conversation that changes someone’s first impression	2026-03-13 05:01:48.678
33	One practical responsibility affecting several other plans	2026-03-13 05:01:48.678
34	A person noticing a pattern that others ignore	2026-03-13 05:01:48.678
35	A short interaction with surprisingly lasting consequences	2026-03-13 05:01:48.678
36	Trying to protect personal time while remaining helpful	2026-03-13 05:01:48.678
37	Good intentions not being enough to solve a problem	2026-03-13 05:01:48.678
38	A moment of hesitation before doing something necessary	2026-03-13 05:01:48.678
39	An event revealing hidden tension inside a group	2026-03-13 05:01:48.678
40	A person rethinking what success actually means	2026-03-13 05:01:48.678
41	A software team preparing for a release while key details remain unclear	2026-03-13 05:01:48.678
42	A developer dealing with a bug that behaves differently every time	2026-03-13 05:01:48.678
43	A product discussion where technical limits and business goals do not fully match	2026-03-13 05:01:48.678
44	A new teammate trying to understand an unfamiliar codebase and team routine	2026-03-13 05:01:48.678
45	A meeting about priorities after several tasks start competing for attention	2026-03-13 05:01:48.678
46	A project moving forward even though some decisions were never fully agreed on	2026-03-13 05:01:48.678
47	A person trying to explain a technical problem to someone non-technical	2026-03-13 05:01:48.678
48	A team noticing late that a small implementation detail affects the whole feature	2026-03-13 05:01:48.678
49	An engineer balancing speed, quality, and pressure from deadlines	2026-03-13 05:01:48.678
50	A workday shaped by notifications, context switching, and unfinished thoughts	2026-03-13 05:01:48.678
*/