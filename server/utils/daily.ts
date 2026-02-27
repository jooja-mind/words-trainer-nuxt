import { prisma } from './prisma'

type DailyBlock = 'quiz' | 'recap' | 'interview' | 'fluency'

function buildDefaultPlan() {
  return {
    timezone: 'UTC',
    profile: 'standard',
    blocks: [
      { id: 'quiz', title: 'Quiz', target: { rounds: 10, wordsPerRound: 5 }, required: true },
      { id: 'recap', title: 'Recap', target: { attempts: 1 }, required: true },
      { id: 'interview', title: 'Interview', target: { acceptable: true, maxAttempts: 3 }, required: true },
      { id: 'fluency', title: 'Fluency', target: { prompts: 10 }, required: true }
    ]
  }
}

function buildDefaultProgress() {
  return {
    started: false,
    completed: false,
    blocks: {
      quiz: { answersCompleted: 0, roundsCompleted: 0, done: false },
      recap: { attempts: 0, done: false },
      interview: { attempts: 0, acceptable: false, done: false },
      fluency: { promptsCompleted: 0, done: false }
    }
  }
}

export function getUtcDateKey() {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function ensureProgressShape(progress: any) {
  return {
    started: Boolean(progress?.started),
    completed: Boolean(progress?.completed),
    blocks: {
      quiz: {
        answersCompleted: Number(progress?.blocks?.quiz?.answersCompleted || 0),
        roundsCompleted: Number(progress?.blocks?.quiz?.roundsCompleted || 0),
        done: Boolean(progress?.blocks?.quiz?.done)
      },
      recap: { attempts: Number(progress?.blocks?.recap?.attempts || 0), done: Boolean(progress?.blocks?.recap?.done) },
      interview: {
        attempts: Number(progress?.blocks?.interview?.attempts || 0),
        acceptable: Boolean(progress?.blocks?.interview?.acceptable),
        done: Boolean(progress?.blocks?.interview?.done)
      },
      fluency: { promptsCompleted: Number(progress?.blocks?.fluency?.promptsCompleted || 0), done: Boolean(progress?.blocks?.fluency?.done) }
    }
  }
}

export async function getOrCreateTodayLesson() {
  const dateKey = getUtcDateKey()
  const lesson = await prisma.dailyLesson.upsert({
    where: { dateKey },
    update: {},
    create: {
      dateKey,
      profile: 'standard',
      status: 'planned',
      planJson: buildDefaultPlan(),
      progressJson: buildDefaultProgress()
    }
  })
  return lesson
}

export async function updateDailyProgress(block: DailyBlock, event: string, payload: Record<string, any> = {}) {
  const lesson = await getOrCreateTodayLesson()
  const progress = ensureProgressShape(lesson.progressJson)
  progress.started = true

  switch (block) {
    case 'quiz': {
      if (event === 'answer_submitted') {
        progress.blocks.quiz.answersCompleted += 1
        const derivedRounds = Math.floor(progress.blocks.quiz.answersCompleted / 5)
        if (derivedRounds > progress.blocks.quiz.roundsCompleted) {
          progress.blocks.quiz.roundsCompleted = derivedRounds
        }
      }

      const rounds = Number(payload.roundsCompleted ?? payload.rounds ?? 0)
      if (Number.isFinite(rounds) && rounds > progress.blocks.quiz.roundsCompleted) {
        progress.blocks.quiz.roundsCompleted = rounds
      }

      if (event === 'done' || progress.blocks.quiz.roundsCompleted >= 10) {
        progress.blocks.quiz.done = true
      }
      break
    }
    case 'recap': {
      if (event === 'attempt_completed') {
        progress.blocks.recap.attempts += 1
      }
      if (event === 'done' || progress.blocks.recap.attempts >= 1) {
        progress.blocks.recap.done = true
      }
      break
    }
    case 'interview': {
      if (event === 'attempt_completed') {
        progress.blocks.interview.attempts += 1
      }
      if (payload.acceptable === true) {
        progress.blocks.interview.acceptable = true
      }
      if (
        event === 'done' ||
        progress.blocks.interview.acceptable === true ||
        progress.blocks.interview.attempts >= 3
      ) {
        progress.blocks.interview.done = true
      }
      break
    }
    case 'fluency': {
      const prompts = Number(payload.promptsCompleted ?? payload.prompts ?? 0)
      if (Number.isFinite(prompts) && prompts > progress.blocks.fluency.promptsCompleted) {
        progress.blocks.fluency.promptsCompleted = prompts
      }
      if (event === 'done' || progress.blocks.fluency.promptsCompleted >= 10) {
        progress.blocks.fluency.done = true
      }
      break
    }
  }

  const allDone =
    progress.blocks.quiz.done &&
    progress.blocks.recap.done &&
    progress.blocks.interview.done &&
    progress.blocks.fluency.done

  progress.completed = allDone

  return await prisma.dailyLesson.update({
    where: { dateKey: lesson.dateKey },
    data: {
      status: allDone ? 'completed' : 'active',
      completedAt: allDone ? new Date() : null,
      progressJson: progress
    }
  })
}
