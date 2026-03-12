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
let correctCount = ref(0);

let props = defineProps({
  limit: {
    type: Number,
    default: 5
  }
})

async function submitAnswer({correct}: {correct:boolean}){
  if(correct) {
    quizScore.value++;
    correctCount.value++;
  }
  submittedCount.value++;
  emits('submitted', { correct: correctCount.value, submittedCount: submittedCount.value });
}
async function dontKnow(){ 
  submittedCount.value++;
  emits('submitted', { correct: correctCount.value, submittedCount: submittedCount.value });
}

//
let testCount = ref(0);
async function startQuiz(){
  const data = await $fetch<{questions:QuizQuestion[]}>('/api/quiz/next?limit=' + props.limit);
  quizQuestions.value = data.questions;
  quizIndex.value = 0;
  quizScore.value = 0;
  correctCount.value = 0;
  selectedOptionId.value=null;
  answered.value=false;
  answerResult.value=null;
  answerTranslation.value=null
  testCount.value++;
}
</script>

<template>
  <Quiz
    :quizCurrent="quizCurrent" 
    :finished="finished"
    :start-click-info="`Press «Start» — for selection based on mistakes, recency, and rarity of repetition.`"
    :testCount="testCount"
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
      <span v-if="quizQuestions.length">{{ quizProgress }}</span>
    </template>
  </Quiz>
</template>
