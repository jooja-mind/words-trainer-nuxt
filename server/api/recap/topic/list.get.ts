import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  let list = await prisma.recapTopic.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  });

  return {
    list
  };
})
