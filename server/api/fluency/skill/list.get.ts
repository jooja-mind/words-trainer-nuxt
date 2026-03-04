import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  let list = await prisma.fluencySkill.findMany({
    select: {
      id: true,
      name: true,
    }
  });

  return list;
})
