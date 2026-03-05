<script setup lang="ts">
type QuizQuestion = { wordId: string; prompt: string; translation?: string | null; options: Array<{ optionId: string; text: string; translation: string }> }
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

async function submitAnswer({correct}: {correct:boolean}){
  if(correct) quizScore.value++;
}
</script>

<template>
  <main class="wrap">
    <UPageHeader title="Mistakes Marathon" headline="Vocabulary" />
    <UPageBody>
      <Quiz
        :quizCurrent="quizCurrent"
        :start-click-info="`Click “Start marathon” — this mode drills only your weak spots 🔥`"
        :error-message="errorMessage"
        v-model:selectedOptionId="selectedOptionId" 
        v-model:answered="answered"
        v-model:answerResult="answerResult"
        v-model:answerTranslation="answerTranslation"
        v-model:quiz-index="quizIndex"
        v-model:quiz-questions="quizQuestions"
        @start="startMarathon"
        @answer-submitted="submitAnswer"
      >
        <template #stats>
          <span v-if="quizQuestions.length">Score: {{ quizScore }}</span>
        </template>
      </Quiz>
    </UPageBody>
  </main>
</template>
