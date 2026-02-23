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


async function submitAnswer(){ if(!quizCurrent.value||!selectedOptionId.value||answered.value) return; const res=await $fetch<{correct:boolean;correctDefinition?:string|null}>('/api/quiz/answer',{method:'POST',body:{wordId:quizCurrent.value.wordId,selectedOptionId:selectedOptionId.value}}); answered.value=true; answerResult.value=res; answerTranslation.value = quizCurrent.value?.translation || null; if(res.correct) quizScore.value++; await loadStats() }
async function dontKnow(){ if(!quizCurrent.value||answered.value) return; const res=await $fetch<{correct:boolean;correctDefinition?:string|null}>('/api/quiz/answer',{method:'POST',body:{wordId:quizCurrent.value.wordId,selectedOptionId:quizCurrent.value.wordId, forceWrong:true}}); answered.value=true; answerResult.value=res; answerTranslation.value = quizCurrent.value?.translation || null; await loadStats() }
function nextQuestion(){ if(quizIndex.value<quizQuestions.value.length-1){ quizIndex.value++; selectedOptionId.value=null; answered.value=false; answerResult.value=null; answerTranslation.value=null }}

//

async function startQuiz(){
  const data = await $fetch<{questions:QuizQuestion[]}>('/api/quiz/next?limit=20');
  quizQuestions.value = data.questions;
  quizIndex.value = 0;
  quizScore.value = 0;
  selectedOptionId.value=null;
  answered.value=false;
  answerResult.value=null;
  answerTranslation.value=null
}

async function loadStats(){ quizStats.value = await $fetch('/api/quiz/stats') }

onMounted(loadStats)
</script>

<template>
  <main class="wrap">
    <UPageHeader title="Multiple Choice Trainer" headline="Vocabulary" />
    <UPageBody>
      <Quiz
        :quizCurrent="quizCurrent" 
        :finished="finished"
        :start-click-info="`Press «Build test (20)» — for selection based on mistakes, recency, and rarity of repetition.`"
        v-model:selectedOptionId="selectedOptionId" 
        v-model:answered="answered"
        v-model:answerResult="answerResult"
        v-model:answerTranslation="answerTranslation"
        @start="startQuiz"
        @submitAnswer="submitAnswer"
        @dontKnow="dontKnow"
        @nextQuestion="nextQuestion"
      >
        <template #stats>
          <span v-if="quizQuestions.length">Progress: {{ quizProgress }}</span>
          <span v-if="quizQuestions.length">Score: {{ quizScore }}</span>
        </template>
      </Quiz>

      <UCard variant="subtle" v-if="quizStats">
        <h2>Stats</h2>
        <p>Total words: <b>{{ quizStats.totalWords }}</b></p>
        <p>Total answers: <b>{{ quizStats.totalAnswers }}</b></p>
        <p>Accuracy: <b>{{ (quizStats.accuracy * 100).toFixed(1) }}%</b></p>
      </UCard>
    </UPageBody>
  </main>
</template>
