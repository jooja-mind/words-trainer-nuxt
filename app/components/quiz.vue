<script setup lang="ts">
type QuizQuestion = { wordId: string; example?: string; prompt: string; translation?: string | null; options: Array<{ optionId: string; text: string; translation: string }> }

let emit = defineEmits(['start', 'nextQuestioned', 'dontKnowed', 'answerSubmitted']);

let { quizDisplayMode, items: quizDisplayModeItems } = useQuizDisplayMode();

let selectedOptionId = defineModel<string | null>('selectedOptionId');
let answered = defineModel<boolean>('answered', { default: false });
let answerResult = defineModel<{ correct: boolean; correctDefinition?: string | null } | null>('answerResult', { default: null });
let answerTranslation = defineModel<string | null>('answerTranslation', { default: null });
let quizIndex = defineModel<number>('quizIndex', { default: 0 });
let quizQuestions = defineModel<QuizQuestion[]>('quizQuestions', { default: () => [] });

function start(){
  translation.value = '';
  emit('start');
}

function nextQuestion(){
  if(quizIndex.value<quizQuestions.value.length-1){ 
    quizIndex.value++;
    selectedOptionId.value=null;
    answered.value=false;
    answerResult.value=null;
    answerTranslation.value=null
    translation.value = '';
    emit('nextQuestioned');
  }
}

let translation = ref('');
let loading = ref(false);

async function submitAnswer(){
  if(quizDisplayMode.value === 'TRANSLATION_INPUT'){
    if(!props.quizCurrent||!translation.value.trim()||answered.value) return;
    loading.value = true;
    const res=await $fetch<{correct:boolean;correctDefinition?:string|null}>('/api/quiz/answerTranslation',{
      method:'POST',
      body:{
        wordId:props.quizCurrent.wordId,
        translation:translation.value
      }
    });
    answered.value=true; 
    answerResult.value=res; 
    answerTranslation.value = props.quizCurrent?.translation || null;
    emit('answerSubmitted', {correct: res.correct});
  }else{
    if(!props.quizCurrent||!selectedOptionId.value||answered.value) return; 
    loading.value = true;
    // Definition or translation mode
    const res=await $fetch<{correct:boolean;correctDefinition?:string|null}>('/api/quiz/answer',{
      method:'POST',
      body:{
        wordId:props.quizCurrent.wordId,
        selectedOptionId:selectedOptionId.value
      }
    }); 
    answered.value=true; 
    answerResult.value=res; 
    answerTranslation.value = props.quizCurrent?.translation || null;
    emit('answerSubmitted', {correct: res.correct});
  }
  loading.value = false;
}

async function dontKnow(){
  if (!props.quizCurrent || answered.value) return
  const res = await $fetch<{ correct: boolean; correctDefinition?: string | null }>('/api/quiz/answer', {
    method: 'POST',
    body: { wordId: props.quizCurrent.wordId, selectedOptionId: props.quizCurrent.wordId, forceWrong: true }
  })
  answered.value = true
  answerResult.value = res
  answerTranslation.value = props.quizCurrent?.translation || null
  emit('dontKnowed');
}

let showExample = ref(false);

let props = defineProps({
  quizCurrent: Object as () => QuizQuestion | null,
  startText: { type: String, default: 'Start' },
  startClickInfo: { type: String, default: '' },
  errorMessage: { type: String, default: '' },
  finished: { type: Boolean, default: false }
})
</script>

<template>
  <UCard variant="subtle">
    <div class="quiz-top">
      <div class="controls">
        <UButton size="lg" color="success" variant="outline" v-if="!quizCurrent" @click="start">{{ startText }}</UButton>
        <USelect size="lg" placeholder="Display mode" v-model="quizDisplayMode" :items="quizDisplayModeItems" />
      </div>
      <div class="stats">
        <!-- slot for #stats template -->
        <slot name="stats"></slot>
      </div>
    </div>
    <p v-if="!!errorMessage" class="error">{{ errorMessage }}</p>
    <div v-if="quizCurrent" class="current">
      <div class="term">{{ quizCurrent.prompt }}</div>
      <UButton v-if="!showExample" class="mt-2" size="sm" icon="ion:eye" variant="outline" @click="showExample = !showExample">Show in sentence</UButton>
      <div class="exampleHolder" v-if="quizCurrent.example && showExample">
        <UButton size="sm" icon="ion:eye-off" variant="link" @click="showExample = !showExample" style="margin-top: 0px;"/>
        <div class="example">
          {{ quizCurrent.example }}
        </div>
      </div>
      <div class="options" v-if="quizDisplayMode == 'DEFINITION' || quizDisplayMode == 'TRANSLATION'">
        <label v-for="(opt, idx) in quizCurrent.options" :key="opt.optionId" class="option">
          <input type="radio" name="answer" :value="opt.optionId" v-model="selectedOptionId" :disabled="answered" />
          <span><b>{{ idx + 1 }}.</b> {{ quizDisplayMode === 'DEFINITION' ? opt.text : opt.translation }}</span>
        </label>
      </div>
      <div v-if="quizDisplayMode === 'TRANSLATION_INPUT'">
        <input type="text" class="w-full mt-2" v-model="translation" :disabled="answered || loading" placeholder="Type your translation here" @keypress.enter="submitAnswer" />
      </div>
      <div class="actions" v-if="!finished">
        <UButton size="lg" color="primary" v-if="!answered" :disabled="quizDisplayMode === 'TRANSLATION_INPUT' ? !translation : !selectedOptionId" @click="submitAnswer" :loading="loading">Submit answer</UButton>
        <UButton size="lg" color="secondary" variant="outline" v-if="!answered" class="ghost" @click="dontKnow" :disabled="loading">I don't know</UButton>
        <UButton size="lg" color="primary" v-if="answered" @click="nextQuestion" :disabled="loading">Next</UButton>
      </div>
      <AnswerFeedback :result="answerResult" :translation="answerTranslation" :mode="quizDisplayMode" />
      <div v-if="finished" class="finish">Test finished. 
        <UButton size="lg" color="primary" @click="start">Build new test</UButton>
      </div>
    </div>
    <p class="actionInfo" v-else-if="!errorMessage && !!startClickInfo">{{ startClickInfo }}</p>
  </UCard>
</template>

<style scoped>
.quiz-top{
  display:flex;
  gap:.8rem;
  align-items:center;
  flex-wrap:wrap;
  margin-bottom: 10px;
  justify-content: space-between;
}
.quiz-top .stats{
  color:#b8bfdb;
  font-size:14px;
  display:flex;
  gap:1rem;
}
.quiz-top .controls{
  display:flex;
  gap:.5rem;
}
.current{padding:1rem;border:1px dashed #3d4468;border-radius:10px}
.term{font-size:1.5rem;font-weight:700;margin-top: -10px;}
.hint{color:#b8bfdb}.options{display:grid;gap:.5rem;margin:.7rem 0}.option{display:flex;gap:.6rem;align-items:center;background:#101327;border:1px solid #2f3554;padding:.55rem;border-radius:8px}
input{padding:.65rem .8rem;border-radius:8px;border:1px solid #343b5a;background:#0f1221;color:#fff}
.actions{display:flex;gap:.5rem;margin-top:.7rem}.ghost{border:1px solid #39406a;background:#171d36;color:#dbe1ff;padding:.3rem .75rem;border-radius:8px;cursor:pointer;font-size:12px}.finish{margin-top:.7rem;color:#c8d0ff;display:flex;gap:.6rem;align-items:center}

.example{
  font-style: italic;
  color: #b8bfdb;
  cursor: default;
}

.exampleHolder{
  margin-top: 8px;
  display: flex;
  gap: 4px;
  align-items: flex-start;
}
</style>
