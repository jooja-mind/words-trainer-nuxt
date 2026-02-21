<script setup lang="ts">
type QuizQuestion = { wordId: string; prompt: string; translationRu?: string | null; options: Array<{ optionId: string; text: string; translation: string }> }
const quizQuestions = ref<QuizQuestion[]>([])
const quizIndex = ref(0)
const selectedOptionId = ref<string | null>(null)
const quizScore = ref(0)
const answered = ref(false)
const answerResult = ref<{ correct: boolean; correctDefinition?: string | null } | null>(null)
const answerTranslation = ref<string | null>(null)
const errorMessage = ref('')

const quizCurrent = computed(() => quizQuestions.value[quizIndex.value] ?? null)

async function startMarathon() {
  const data = await $fetch<{ questions: QuizQuestion[]; reason?: string }>(`/api/quiz/marathon?limit=50`)
  quizQuestions.value = data.questions
  quizIndex.value = 0
  quizScore.value = 0
  selectedOptionId.value = null
  answered.value = false
  answerResult.value = null
  answerTranslation.value = null
  errorMessage.value = ''
  if (!data.questions.length) {
    errorMessage.value = data.reason || 'Not enough words for marathon'
  }
}

async function submitAnswer() {
  if (!quizCurrent.value || !selectedOptionId.value || answered.value) return
  const res = await $fetch<{ correct: boolean; correctDefinition?: string | null }>('/api/quiz/answer', {
    method: 'POST',
    body: { wordId: quizCurrent.value.wordId, selectedOptionId: selectedOptionId.value }
  })
  answered.value = true
  answerResult.value = res
  answerTranslation.value = quizCurrent.value?.translationRu || null
  if (res.correct) quizScore.value++
}

async function dontKnow() {
  if (!quizCurrent.value || answered.value) return
  const res = await $fetch<{ correct: boolean; correctDefinition?: string | null }>('/api/quiz/answer', {
    method: 'POST',
    body: { wordId: quizCurrent.value.wordId, selectedOptionId: quizCurrent.value.wordId, forceWrong: true }
  })
  answered.value = true
  answerResult.value = res
  answerTranslation.value = quizCurrent.value?.translationRu || null
}

function nextQuestion() {
  if (quizIndex.value < quizQuestions.value.length - 1) {
    quizIndex.value++
    selectedOptionId.value = null
    answered.value = false
    answerResult.value = null
    answerTranslation.value = null
  }
}

let { quizDisplayMode, items: quizDisplayModeItems } = useQuizDisplayMode();
</script>

<template>
  <main class="wrap">
    <UPageHeader title="Mistakes Marathon" headline="Vocabulary" />
    <UPageBody>
      <UCard variant="subtle">
        <div class="quiz-top">
          <div class="controls">
            <UButton size="lg" color="success" variant="outline" v-if="!quizCurrent" @click="startMarathon">Start marathon</UButton>
            <USelect size="lg" placeholder="Display mode" v-model="quizDisplayMode" :items="quizDisplayModeItems" />
          </div>
          <div class="stats">
            <span v-if="quizQuestions.length">Score: {{ quizScore }}</span>
          </div>
        </div>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        <div v-if="quizCurrent" class="current">
          <div class="term">{{ quizCurrent.prompt }}</div>
          <div class="options">
            <label v-for="(opt, idx) in quizCurrent.options" :key="opt.optionId" class="option">
              <input type="radio" name="answer" :value="opt.optionId" v-model="selectedOptionId" :disabled="answered" />
              <span><b>{{ idx + 1 }}.</b> {{ quizDisplayMode === 'DEFINITION' ? opt.text : opt.translation }}</span>
            </label>
          </div>
          <div class="actions">
            <UButton size="lg" color="primary" v-if="!answered" :disabled="!selectedOptionId" @click="submitAnswer">Submit answer</UButton>
            <UButton size="lg" color="secondary" variant="outline" v-if="!answered" class="ghost" @click="dontKnow">I don't know</UButton>
            <UButton size="lg" color="primary" v-if="answered" @click="nextQuestion">Next</UButton>
          </div>
          <AnswerFeedback :result="answerResult" :translation="answerTranslation" />
        </div>
        <p class="actionInfo" v-else-if="!errorMessage">Click “Start marathon” — this mode drills only your weak spots 🔥</p>
      </UCard>
    </UPageBody>
  </main>
</template>

<style scoped>
@import '~/assets/css/quiz.css';
</style>
