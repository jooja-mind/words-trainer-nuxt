<script setup lang="ts">
type WordStatus = 'NEW' | 'HARD' | 'EASY'

type Word = {
  id: string
  term: string
  definition: string | null
  example: string | null
  status: WordStatus
}

type QuizQuestion = {
  wordId: string
  prompt: string
  options: Array<{ optionId: string; text: string }>
}

const words = ref<Word[]>([])
const loading = ref(false)
const onlyStatus = ref<'ALL' | WordStatus>('ALL')

const form = reactive({
  term: '',
  definition: '',
  example: '',
  status: 'NEW' as WordStatus
})

const quizQuestions = ref<QuizQuestion[]>([])
const quizIndex = ref(0)
const selectedOptionId = ref<string | null>(null)
const quizScore = ref(0)
const answered = ref(false)
const answerResult = ref<{ correct: boolean; correctDefinition?: string | null } | null>(null)
const quizStats = ref<any>(null)

const quizCurrent = computed(() => quizQuestions.value[quizIndex.value] ?? null)
const quizProgress = computed(() => `${Math.min(quizIndex.value + 1, quizQuestions.value.length)}/${quizQuestions.value.length || 0}`)

async function loadWords() {
  loading.value = true
  try {
    const query = onlyStatus.value === 'ALL' ? '' : `?status=${onlyStatus.value}`
    words.value = await $fetch<Word[]>(`/api/words${query}`)
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  quizStats.value = await $fetch('/api/quiz/stats')
}

async function addWord() {
  if (!form.term.trim()) return
  await $fetch('/api/words', {
    method: 'POST',
    body: {
      term: form.term,
      definition: form.definition,
      example: form.example,
      status: form.status
    }
  })
  form.term = ''
  form.definition = ''
  form.example = ''
  form.status = 'NEW'
  await Promise.all([loadWords(), loadStats()])
}

async function removeWord(id: string) {
  await $fetch(`/api/words/${id}`, { method: 'DELETE' })
  await Promise.all([loadWords(), loadStats()])
}

async function startQuiz() {
  const data = await $fetch<{ questions: QuizQuestion[] }>('/api/quiz/next?limit=20')
  quizQuestions.value = data.questions
  quizIndex.value = 0
  quizScore.value = 0
  selectedOptionId.value = null
  answered.value = false
  answerResult.value = null
}

async function submitAnswer() {
  if (!quizCurrent.value || !selectedOptionId.value || answered.value) return

  const res = await $fetch<{ correct: boolean; correctDefinition?: string | null }>('/api/quiz/answer', {
    method: 'POST',
    body: {
      wordId: quizCurrent.value.wordId,
      selectedOptionId: selectedOptionId.value
    }
  })

  answered.value = true
  answerResult.value = res
  if (res.correct) quizScore.value++
  await loadStats()
}

function nextQuestion() {
  if (quizIndex.value < quizQuestions.value.length - 1) {
    quizIndex.value++
    selectedOptionId.value = null
    answered.value = false
    answerResult.value = null
  }
}

onMounted(async () => {
  await Promise.all([loadWords(), loadStats()])
})
watch(onlyStatus, loadWords)
</script>

<template>
  <main class="wrap">
    <h1>Words Trainer (PTE-style)</h1>

    <section class="card">
      <h2>Добавить слово</h2>
      <div class="grid">
        <input v-model="form.term" placeholder="word" />
        <input v-model="form.definition" placeholder="definition / translation" />
        <input v-model="form.example" placeholder="example (optional)" />
        <select v-model="form.status">
          <option value="NEW">NEW</option>
          <option value="HARD">HARD</option>
          <option value="EASY">EASY</option>
        </select>
        <button @click="addWord">Добавить</button>
      </div>
    </section>

    <section class="card">
      <h2>Тренажёр с вариантами</h2>
      <div class="quiz-top">
        <button @click="startQuiz">Собрать тест (20)</button>
        <span v-if="quizQuestions.length">Прогресс: {{ quizProgress }}</span>
        <span v-if="quizQuestions.length">Счёт: {{ quizScore }}</span>
      </div>

      <div v-if="quizCurrent" class="current">
        <div class="term">{{ quizCurrent.prompt }}</div>
        <p class="hint">Выбери правильное определение:</p>

        <div class="options">
          <label v-for="(opt, idx) in quizCurrent.options" :key="opt.optionId" class="option">
            <input
              type="radio"
              name="answer"
              :value="opt.optionId"
              v-model="selectedOptionId"
              :disabled="answered"
            />
            <span><b>{{ idx + 1 }}.</b> {{ opt.text }}</span>
          </label>
        </div>

        <div class="actions">
          <button :disabled="!selectedOptionId || answered" @click="submitAnswer">Ответить</button>
          <button :disabled="!answered" @click="nextQuestion">Следующий</button>
        </div>

        <div v-if="answerResult" class="feedback" :class="answerResult.correct ? 'ok' : 'bad'">
          <template v-if="answerResult.correct">✅ Верно</template>
          <template v-else>
            ❌ Неверно<br />
            <span v-if="answerResult.correctDefinition">Правильно: {{ answerResult.correctDefinition }}</span>
          </template>
        </div>
      </div>

      <p v-else>Нажми «Собрать тест (20)» — подбор идёт по ошибкам + давности + редкости повторения.</p>
    </section>

    <section class="card" v-if="quizStats">
      <h2>Статистика</h2>
      <p>Слов всего: <b>{{ quizStats.totalWords }}</b></p>
      <p>Ответов всего: <b>{{ quizStats.totalAnswers }}</b></p>
      <p>Точность: <b>{{ (quizStats.accuracy * 100).toFixed(1) }}%</b></p>

      <h3>Топ проблемных</h3>
      <ul class="list">
        <li v-for="t in quizStats.toughest" :key="t.term">
          <b>{{ t.term }}</b> — ошибок: {{ t.wrong }}, KPI: {{ t.kpi.toFixed(2) }}
        </li>
      </ul>
    </section>

    <section class="card">
      <h2>Слова ({{ words.length }})</h2>
      <div class="filter">
        <label>Фильтр:</label>
        <select v-model="onlyStatus">
          <option value="ALL">ALL</option>
          <option value="NEW">NEW</option>
          <option value="HARD">HARD</option>
          <option value="EASY">EASY</option>
        </select>
      </div>
      <p v-if="loading">Загрузка...</p>
      <ul v-else class="list">
        <li v-for="w in words" :key="w.id">
          <b>{{ w.term }}</b>
          <span class="status">[{{ w.status }}]</span>
          <span v-if="w.definition"> — {{ w.definition }}</span>
          <button @click="removeWord(w.id)">удалить</button>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
:global(body) {
  font-family: Inter, system-ui, Arial, sans-serif;
  background: #0f1221;
  color: #e5e7eb;
  margin: 0;
}
.wrap { max-width: 980px; margin: 2rem auto; padding: 0 1rem; }
h1 { margin-bottom: 1rem; }
.card { background: #171a2b; border: 1px solid #2a2e44; border-radius: 12px; padding: 1rem; margin-bottom: 1rem; }
.grid { display: grid; gap: .6rem; }
input, select, button { padding: .65rem .8rem; border-radius: 8px; border: 1px solid #343b5a; background: #0f1221; color: #fff; }
button { cursor: pointer; }
.filter, .quiz-top { display: flex; gap: .8rem; align-items: center; margin-bottom: .8rem; flex-wrap: wrap; }
.current { padding: 1rem; border: 1px dashed #3d4468; border-radius: 10px; }
.term { font-size: 1.5rem; font-weight: 700; margin-bottom: .2rem; }
.hint { color: #b8bfdb; }
.options { display: grid; gap: .5rem; margin: .7rem 0; }
.option { display: flex; gap: .6rem; align-items: flex-start; background: #101327; border: 1px solid #2f3554; padding: .55rem; border-radius: 8px; }
.actions { display: flex; gap: .5rem; margin-top: .7rem; }
.feedback { margin-top: .7rem; padding: .6rem; border-radius: 8px; }
.feedback.ok { background: #14532d; }
.feedback.bad { background: #7c2d12; }
.list { list-style: none; padding: 0; margin: 0; }
.list li { display: flex; gap: .5rem; align-items: center; padding: .5rem 0; border-bottom: 1px solid #262b44; }
.status { color: #9ca3af; }
</style>
