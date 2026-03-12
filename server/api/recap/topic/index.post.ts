import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  let { text } = await readBody(event);

  if (!text) {
    throw createError({ statusCode: 400, statusMessage: 'text is required' });
  }

  let created = await prisma.recapTopic.create({
    data: {
      text
    }
  });

  return created;
})
