import { nextPressurePrompt } from '../../../utils/fluency'

export default defineEventHandler(async () => {
  return nextPressurePrompt()
})
