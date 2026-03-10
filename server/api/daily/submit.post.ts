import { defineEventHandler } from 'h3'
import moment from 'moment';

export default defineEventHandler(async (event) => {
  let {date, sectionKey, startedAt, endedAt, stats} = await readBody(event);

  await prisma.dailyCompleted.create({
    data: {
      date,
      sectionKey,
      startedAt: new Date(startedAt),
      endedAt: new Date(endedAt),
      completedInSeconds: Math.round((endedAt - startedAt) / 1000),
      stats
    }
  });

  return {
    done: true
  }
});
