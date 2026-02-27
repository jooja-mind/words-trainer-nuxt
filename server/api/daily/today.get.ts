import { getOrCreateTodayLesson } from '../../utils/daily'

export default defineEventHandler(async () => {
  const lesson = await getOrCreateTodayLesson()
  return { lesson }
})
