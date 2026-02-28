export type FluencyMode = 'A' | 'B' | 'D'

const patternDrills = [
  {
    targetPattern: 'present_perfect_vs_past_simple',
    prompt: 'Describe a feature you have improved recently and what you changed last week.'
  },
  {
    targetPattern: 'articles_a_the_zero',
    prompt: 'Explain a bug you found in an app and how the team fixed the bug.'
  },
  {
    targetPattern: 'conditionals_first_second',
    prompt: 'If your release fails tonight, what will you do? What would you do with one extra week?'
  },
  {
    targetPattern: 'passive_voice',
    prompt: 'Describe how production incidents are handled in your team.'
  },
  {
    targetPattern: 'present_continuous_vs_present_simple',
    prompt: 'What are you working on this week and what do you usually do on weekdays?'
  }
]

const pressurePrompts = [
  'You have 30 seconds: convince your manager to postpone a risky release.',
  'You have 30 seconds: explain a production outage and your immediate plan.',
  'You have 35 seconds: pitch a product idea to a non-technical founder.',
  'You have 25 seconds: answer why your team should prioritize bug fixes now.',
  'You have 30 seconds: explain a technical decision to a junior developer.'
]

function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function nextPatternDrill() {
  const item = randomOf(patternDrills)
  return {
    mode: 'A' as const,
    prompt: item.prompt,
    targetPattern: item.targetPattern,
    timeLimitSec: 40
  }
}

export function nextPressurePrompt() {
  return {
    mode: 'D' as const,
    prompt: randomOf(pressurePrompts),
    timeLimitSec: 30
  }
}


const minimalPairs = [
  {
    prompt: 'Choose the more natural sentence about your current task.',
    options: ['I am working on a new feature now.', 'I work on a new feature now.'],
    correctOption: 'I am working on a new feature now.'
  },
  {
    prompt: 'Choose the correct article usage.',
    options: ['I fixed bug in the payment module.', 'I fixed a bug in the payment module.'],
    correctOption: 'I fixed a bug in the payment module.'
  },
  {
    prompt: 'Choose the better tense for completed action yesterday.',
    options: ['I have deployed it yesterday.', 'I deployed it yesterday.'],
    correctOption: 'I deployed it yesterday.'
  },
  {
    prompt: 'Choose the natural preposition.',
    options: ['We discussed about the issue.', 'We discussed the issue.'],
    correctOption: 'We discussed the issue.'
  },
  {
    prompt: 'Choose the better form for a habitual action.',
    options: ['She checks logs every morning.', 'She is checking logs every morning.'],
    correctOption: 'She checks logs every morning.'
  }
]

export function nextMinimalPair() {
  const item = randomOf(minimalPairs)
  return {
    mode: 'B' as const,
    prompt: item.prompt,
    options: item.options,
    correctOption: item.correctOption,
    timeLimitSec: 15
  }
}
