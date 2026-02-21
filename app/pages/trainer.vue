<script setup lang="ts">
type QuizQuestion = { wordId: string; prompt: string; translationRu?: string | null; options: Array<{ optionId: string; text: string; translation: string }> }
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

async function loadStats(){ quizStats.value = await $fetch('/api/quiz/stats') }
async function startQuiz(){ const data=await $fetch<{questions:QuizQuestion[]}>('/api/quiz/next?limit=20'); quizQuestions.value=data.questions; quizIndex.value=0; quizScore.value=0; selectedOptionId.value=null; answered.value=false; answerResult.value=null; answerTranslation.value=null }
async function submitAnswer(){ if(!quizCurrent.value||!selectedOptionId.value||answered.value) return; const res=await $fetch<{correct:boolean;correctDefinition?:string|null}>('/api/quiz/answer',{method:'POST',body:{wordId:quizCurrent.value.wordId,selectedOptionId:selectedOptionId.value}}); answered.value=true; answerResult.value=res; answerTranslation.value = quizCurrent.value?.translationRu || null; if(res.correct) quizScore.value++; await loadStats() }
async function dontKnow(){ if(!quizCurrent.value||answered.value) return; const res=await $fetch<{correct:boolean;correctDefinition?:string|null}>('/api/quiz/answer',{method:'POST',body:{wordId:quizCurrent.value.wordId,selectedOptionId:quizCurrent.value.wordId, forceWrong:true}}); answered.value=true; answerResult.value=res; answerTranslation.value = quizCurrent.value?.translationRu || null; await loadStats() }
function nextQuestion(){ if(quizIndex.value<quizQuestions.value.length-1){ quizIndex.value++; selectedOptionId.value=null; answered.value=false; answerResult.value=null; answerTranslation.value=null }}

let { quizDisplayMode, items: quizDisplayModeItems } = useQuizDisplayMode();

onMounted(loadStats)
</script>

<template>
  <main class="wrap">
    <UPageHeader title="Multiple Choice Trainer" headline="Vocabulary" />
    <UPageBody>
      <UCard variant="subtle">
        <div class="quiz-top">
          <div class="controls">
            <UButton size="lg" color="success" variant="outline" v-if="!quizCurrent" @click="startQuiz">Build test (20)</UButton>
            <USelect size="lg" placeholder="Display mode" v-model="quizDisplayMode" :items="quizDisplayModeItems" />
          </div>
          <div class="stats">
            <span v-if="quizQuestions.length">Progress: {{ quizProgress }}</span>
            <span v-if="quizQuestions.length">Score: {{ quizScore }}</span>
          </div>
        </div>
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
          <div v-if="finished" class="finish">Test finished. 
            <UButton size="lg" color="primary" @click="startQuiz">Build new test</UButton>
          </div>
        </div>
        <p class="actionInfo" v-else>Press «Build test (20)» — for selection based on mistakes, recency, and rarity of repetition.</p>
      </UCard>

      <UCard variant="subtle" v-if="quizStats">
        <h2>Stats</h2>
        <p>Total words: <b>{{ quizStats.totalWords }}</b></p>
        <p>Total answers: <b>{{ quizStats.totalAnswers }}</b></p>
        <p>Accuracy: <b>{{ (quizStats.accuracy * 100).toFixed(1) }}%</b></p>
      </UCard>
    </UPageBody>
  </main>
</template>

<style scoped>
@import '~/assets/css/quiz.css';
</style>
