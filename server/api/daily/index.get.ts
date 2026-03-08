import { defineEventHandler } from 'h3'
import moment from 'moment';

export default defineEventHandler(async (event) => {
  let today = moment().format('YYYY-MM-DD');

  let sections = await prisma.dailySections.findMany({
    orderBy: {
      orderIndex: 'asc'
    }
  });

  let sectionsCount = sections.length;

  let compeletedToday = await prisma.dailyCompleted.findMany({
    where: {
      date: today
    }
  });
  let sectionsCompletedCount = compeletedToday.length;

  return {
    date: today,
    sectionsCount,
    sectionsCompletedCount,
    sections,
    compeletedToday
  };
});
