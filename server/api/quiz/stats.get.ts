import * as stats from '../../utils/stats'

export default defineEventHandler(async () => {
  return await stats.get()
})
