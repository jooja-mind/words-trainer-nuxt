import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  let { id } = await readBody(event);

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id is required' });
  }

  await prisma.recapTopic.delete({
    where: {
      id
    }
  });

  return {
    done: true
  };
})
