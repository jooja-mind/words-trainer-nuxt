<script setup lang="ts">
type QuizQuestion = { wordId: string; prompt: string; translation?: string | null; options: Array<{ optionId: string; text: string; translation: string }> }
const quizQuestions = ref<QuizQuestion[]>([])
const quizIndex = ref(0)
const selectedOptionId = ref<string | null>(null)
const quizScore = ref(0)
const answered = ref(false)
const answerResult = ref<{ correct: boolean; correctDefinition?: string | null } | null>(null)
const answerTranslation = ref<string | null>(null)
const quizStats = ref<any>(null)

const quizCurrent = computed(() => quizQuestions.value[quizIndex.value] ?? null)
const quizProgress = computed(() => `${Math.min(quizIndex.value + 1, quizQuestions.value.length)}/${quizQuestions.value.length || 0}`)
const finished = computed(() => answered.value && quizIndex.value >= quizQuestions.value.length - 1)

let emits = defineEmits(['submitted']);
let submittedCount = ref(0);

let props = defineProps({
  limit: {
    type: Number,
    default: 5
  }
})

async function submitAnswer({correct}: {correct:boolean}){
  if(correct) quizScore.value++;
  submittedCount.value++;
  emits('submitted', { correct, submittedCount: submittedCount.value });
}
async function dontKnow(){ 
  submittedCount.value++;
  emits('submitted', { correct: false, submittedCount: submittedCount.value });
}

//
async function startQuiz(){
  const data = await $fetch<{questions:QuizQuestion[]}>('/api/quiz/next?limit=' + props.limit);
  quizQuestions.value = data.questions;
  quizIndex.value = 0;
  quizScore.value = 0;
  selectedOptionId.value=null;
  answered.value=false;
  answerResult.value=null;
  answerTranslation.value=null
}
</script>

<template>
  <Quiz
    :quizCurrent="quizCurrent" 
    :finished="finished"
    :start-click-info="`Press «Build test (${props.limit})» — for selection based on mistakes, recency, and rarity of repetition.`"
    v-model:selectedOptionId="selectedOptionId" 
    v-model:answered="answered"
    v-model:answerResult="answerResult"
    v-model:answerTranslation="answerTranslation"
    v-model:quiz-index="quizIndex"
    v-model:quiz-questions="quizQuestions"
    @start="startQuiz"
    @answer-submitted="submitAnswer"
    @dont-knowed="dontKnow"
  >
    <template #stats>
      <span v-if="quizQuestions.length">Progress: {{ quizProgress }}</span>
      <span v-if="quizQuestions.length">Score: {{ quizScore }}</span>
    </template>
  </Quiz>
</template>
