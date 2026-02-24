import { InterviewQA } from '@prisma/client';
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  // statistics for interview questions: top-10 most hard questions based on KPI on timesAnswered and timesIncorrect
  let {limit} = getQuery(event);
  limit = Number(limit) || 10;
  limit = Math.max(1, Math.min(50, limit)); // enforce 1-50

  const allQAs = await prisma.interviewQA.findMany();

  const stats: (InterviewQA & {
    kpi: number
  })[] = [];

  for(const qa of allQAs) {
    const { timesAnswered, timesIncorrect, timesCorrect } = qa;
    if(timesAnswered === 0) continue; // skip never answered questions
    // const kpi = timesIncorrect / timesAnswered;
    // const kpi = wrong ? correct / wrong : 999
    const kpi = timesIncorrect ? timesCorrect / timesIncorrect : 999;
    stats.push({ ...qa, kpi });
  }

  stats.sort((a, b) => a.kpi - b.kpi); // sort by KPI asc

  return { stats: stats.slice(0, limit) }
})
