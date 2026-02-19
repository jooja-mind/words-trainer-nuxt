<script setup lang="ts">
type QuizQuestion = { wordId: string; prompt: string; translationRu?: string | null; options: Array<{ optionId: string; text: string }> }
const quizQuestions = ref<QuizQuestion[]>([])
const quizIndex = ref(0)
const selectedOptionId = ref<string | null>(null)
const quizScore = ref(0)
const answered = ref(false)
const answerResult = ref<{ correct: boolean; correctDefinition?: string | null } | null>(null)
const quizStats = ref<any>(null)

const quizCurrent = computed(() => quizQuestions.value[quizIndex.value] ?? null)
const quizProgress = computed(() => `${Math.min(quizIndex.value + 1, quizQuestions.value.length)}/${quizQuestions.value.length || 0}`)

async function loadStats(){ quizStats.value = await $fetch('/api/quiz/stats') }
async function startQuiz(){ const data=await $fetch<{questions:QuizQuestion[]}>('/api/quiz/next?limit=20'); quizQuestions.value=data.questions; quizIndex.value=0; quizScore.value=0; selectedOptionId.value=null; answered.value=false; answerResult.value=null;  }
async function submitAnswer(){ if(!quizCurrent.value||!selectedOptionId.value||answered.value) return; const res=await $fetch<{correct:boolean;correctDefinition?:string|null}>('/api/quiz/answer',{method:'POST',body:{wordId:quizCurrent.value.wordId,selectedOptionId:selectedOptionId.value}}); answered.value=true; answerResult.value=res; if(res.correct) quizScore.value++; await loadStats() }
async function dontKnow(){ if(!quizCurrent.value||answered.value) return; const res=await $fetch<{correct:boolean;correctDefinition?:string|null}>('/api/quiz/answer',{method:'POST',body:{wordId:quizCurrent.value.wordId,selectedOptionId:quizCurrent.value.wordId, forceWrong:true}}); answered.value=true; answerResult.value=res; await loadStats() }
function nextQuestion(){ if(quizIndex.value<quizQuestions.value.length-1){ quizIndex.value++; selectedOptionId.value=null; answered.value=false; answerResult.value=null;  }}

onMounted(loadStats)
</script>

<template>
  <main class="wrap">
    <h1>Multiple Choice Trainer</h1>
    <section class="card">
      <div class="quiz-top">
        <button @click="startQuiz">Build test (20)</button>
        <span v-if="quizQuestions.length">Progress: {{ quizProgress }}</span>
        <span v-if="quizQuestions.length">Score: {{ quizScore }}</span>
      </div>
      <div v-if="quizCurrent" class="current">
        <div class="term">{{ quizCurrent.prompt }}</div>
        <p class="hint">Choose the correct definition:</p>
        <div class="options">
          <label v-for="(opt, idx) in quizCurrent.options" :key="opt.optionId" class="option">
            <input type="radio" name="answer" :value="opt.optionId" v-model="selectedOptionId" :disabled="answered" />
            <span><b>{{ idx + 1 }}.</b> {{ opt.text }}</span>
          </label>
        </div>
        <div class="actions">
          <button v-if="!answered" :disabled="!selectedOptionId" @click="submitAnswer">Submit answer</button>
          <button v-if="!answered" class="ghost" @click="dontKnow">I don't know</button>
          <button v-else @click="nextQuestion">Next</button>
        </div>
        <div v-if="answerResult" class="feedback" :class="answerResult.correct ? 'ok' : 'bad'">
          <template v-if="answerResult.correct">✅ Correct</template>
          <template v-else>❌ Wrong<br /><span v-if="answerResult.correctDefinition">Correct: {{ answerResult.correctDefinition }}</span></template>
        </div>
      </div>
      <p v-else>Press «Build test (20)» — for selection based on mistakes, recency, and rarity of repetition.</p>
    </section>
    <section class="card" v-if="quizStats">
      <h2>Stats</h2>
      <p>Total words: <b>{{ quizStats.totalWords }}</b></p>
      <p>Total answers: <b>{{ quizStats.totalAnswers }}</b></p>
      <p>Accuracy: <b>{{ (quizStats.accuracy * 100).toFixed(1) }}%</b></p>
    </section>
  </main>
</template>

<style scoped>
:global(body){font-family:Inter,system-ui,Arial,sans-serif;background:#0f1221;color:#e5e7eb;margin:0}
.wrap{max-width:980px;margin:1.2rem auto;padding:0 1rem}.card{background:#171a2b;border:1px solid #2a2e44;border-radius:12px;padding:1rem;margin-bottom:1rem}
.quiz-top{display:flex;gap:.8rem;align-items:center;flex-wrap:wrap}.current{padding:1rem;border:1px dashed #3d4468;border-radius:10px}.term{font-size:1.5rem;font-weight:700;}
.hint{color:#b8bfdb}.options{display:grid;gap:.5rem;margin:.7rem 0}.option{display:flex;gap:.6rem;align-items:flex-start;background:#101327;border:1px solid #2f3554;padding:.55rem;border-radius:8px}
input,button{padding:.65rem .8rem;border-radius:8px;border:1px solid #343b5a;background:#0f1221;color:#fff}button{cursor:pointer}
.actions{display:flex;gap:.5rem;margin-top:.7rem}.feedback{margin-top:.7rem;padding:.6rem;border-radius:8px}.feedback.ok{background:#14532d}.feedback.bad{background:#7c2d12}
</style>
