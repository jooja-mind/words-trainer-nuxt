<script setup lang="ts">
import { useSTT, type HistoryEntry } from '~/composables/stt/useSTT'
import { useInputDevices } from '~/composables/stt/useInputDevices';

const {
  state,
  audioBridge,
  requestStartRecognition,
  requestStopRecognition,
  stopAll,
} = useSTT({
  onBridgeAudio: ({ b16int, sourceType }) => {
    console.log('audioBridge:', { sourceType, b16int })
    // socket.emit('audio', { b16int, sourceType, sessionToken: state.token });
  },
  onBridgeStart: ({ sourceType, token, tokenExpiresAt }) => {
    console.log('requestStartRecognition:', { sourceType, tokenExpiresAt })
    // socket.emit('start_recognition', { sourceType, token, tokenExpiresAt });
  },
  onBridgeStop: ({ sourceType }) => {
    console.log('requestStopRecognition:', { sourceType })
    // socket.emit('stop_recognition', { sourceType });
  },
  onProviderError: ({ sourceType, message }) => {
    console.error('sttError:', { sourceType, message })
  },
  onFinalTranscript: (sourceType, finalizedObject) => {
    console.log('finalTranscript:', { sourceType, finalizedObject });
    answerQuestion(finalizedObject);
  },
});


const {
  vol: micVol,
  isSoundDetected: isMicSoundDetected,
  bindStream: bindMicStream,
  stop: stopMicBridge,
  isActive: isMicActive,
} = useAudioBridgeStream({
  sourceType: 'mic',
  shouldBridge: () => Boolean(state.mic.recognition),
  onAudioBridge: (b16int, sourceType) => audioBridge(b16int, sourceType),
  onRecognitionStart: (sourceType, sampleRate) => requestStartRecognition(sourceType, sampleRate),
  onRecognitionStop: (sourceType) => requestStopRecognition(sourceType),
})

const { inputDevices, selectedInputDevice } = useInputDevices()

async function startMicRecorder() {
  try {
    const stream = await getUserMediaForSelectedInputDevice()
    bindMicStream(stream)
  } catch (error) {
    console.log(error)
  }
}

function stopMicRecorder() {
  stopMicBridge({ stopTracks: true })
}

async function getUserMediaForSelectedInputDevice() {
  if (!selectedInputDevice.value) {
    return navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    })
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: {
        deviceId: { exact: selectedInputDevice.value },
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      },
    })
  } catch (error) {
    const isDeviceUnavailableError =
      error instanceof DOMException &&
      (error.name === 'OverconstrainedError' || error.name === 'NotFoundError')

    if (!isDeviceUnavailableError) {
      throw error
    }

    return navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    })
  }
}

let lastFinalized = computed(()=>{
  const lastHistoryEntry = state.mic.history.slice()[state.mic.history.length - 1]
  return lastHistoryEntry;
})

/////

let screen = ref<'welcome' | 'loading' | 'question' | 'evaluating' | 'result'>('welcome');

// let skillList = ref<{id: number, name: string}[]>([]);
let skill = reactive({
  list: [] as {id: number, name: string}[],
  loading: true,
  selected: 0
})

async function loadSkills(){
  skill.loading = true;
  try {
    const list = (await $fetch('/api/fluency/skill/list')) as unknown as {id: number, name: string}[];
    if(list.length === 0){
      alert('No skills found. Please create some skills in the settings page first.')
      return;
    }
    skill.list = [{'id': 0, 'name': 'All, mixed'}, ...list]
  } catch (error) {
    console.error('Failed to load skill list:', error)
    alert('Failed to load skill list. Please try again later.');
    backToWelcome();
  } finally {
    skill.loading = false;
  }
}

async function startPracticing(){
  screen.value = 'loading';
  await getQuestion();
}

let uniqueQuestionsPassed = ref<number[]>([]);
let questionsCountChallenge = ref(20);
let question = reactive({
  id: 0,
  text: '',
  skill: {
    name: '',
    id: 0
  },
  displayedAt: new Date(),
  loading: false
})
async function getQuestion(){
  if(uniqueQuestionsPassed.value.length >= questionsCountChallenge.value){
    backToWelcome();
    return;
  }

  question.loading = true;
  try {
    let query = {};
    if(skill.selected) query = { skillId: skill.selected }
    const res = await $fetch<{
      id: number;
      createdAt: Date;
      skillId: number;
      text: string;
      timesShown: number;
      skill: {
        name: string;
        id: number;
      };
    }>('/api/fluency/question', { query })
    await startMicRecorder();
    question.id = res.id;
    question.text = res.text;
    question.skill = res.skill;
    question.displayedAt = new Date();
    screen.value = 'question';
    if(!uniqueQuestionsPassed.value.includes(res.id)){
      uniqueQuestionsPassed.value.push(res.id);
    }
  } catch (error) {
    console.error('Failed to load question:', error)
    alert('Failed to load question. Please try again later.');
    backToWelcome();
  } finally {
    question.loading = false;
  }
}

let result = reactive({
  loading: false,
  passed: false,
  yourAnswer: '',
  correctAnswer: '',
  feedback: '',
});
async function answerQuestion(finalizedObject: HistoryEntry){
  if(finalizedObject.text.trim() === '') return;
  let countWords = finalizedObject.text.trim().split(/\s+/).length;
  if(countWords <= 1) return;
  stopListening();
  screen.value = 'evaluating';

  result.loading = true;
  try {
    let body = {
      questionId: question.id,
      answer: finalizedObject.text,
      speechDurationMs: finalizedObject.timestampEnd - finalizedObject.timestampStart,
      reactionDelayMs: finalizedObject.timestampStart - question.displayedAt.getTime(),
    }
    let res = await $fetch<{ 
      evaluation: {
        target_skill_passed: boolean;
        explanation: string;
        corrected_answer: string;
        short_feedback: string;
        primary_error: "none" | "off_topic" | "wrong_tense" | "wrong_verb_form" | "missing_article" | "wrong_article" | "missing_auxiliary" | "grammar_other" | "format_not_followed";
      },
      body: typeof body
    }>('/api/fluency/question/submitAnswer', {
      method: 'POST',
      body
    });

    result.yourAnswer = body.answer;
    result.correctAnswer = res.evaluation.corrected_answer;
    result.feedback = res.evaluation.short_feedback;
    result.passed = res.evaluation.target_skill_passed;
    screen.value = 'result';

    if(res.evaluation.target_skill_passed){
      setTimeout(()=>{
        getQuestion();
      }, 1000)
    }
  } catch (error) {
    console.error('Failed to answer question:', error)
    alert('Failed to answer question. Please try again later.');
    backToWelcome();
  } finally {
    result.loading = false;
  }
}

async function stopTraining(){
  stopListening();
  backToWelcome();
}

let isLocalhost = ref(false);


function stopListening(){
  stopAll();
  stopMicRecorder();
}

function debugScreen(targetScreen: 'welcome' | 'loading' | 'question' | 'evaluating' | 'resultBad' | 'resultGood'){
  stopListening();
  if(targetScreen === 'resultBad'){
    screen.value = 'result';
    result.passed = false;
    result.yourAnswer = 'I want to go to park';
    result.correctAnswer = 'I want to go to the park';
    result.feedback = 'You missed the article "the" before "park".';
  }else if(targetScreen === 'resultGood'){
    screen.value = 'result';
    result.passed = true;
  }else if(targetScreen === 'question'){
    screen.value = 'question';
    question.text = 'What do you like to do in your free time?\nSay it in past tense.';
    question.skill.name = 'Small Talk';
  }else{
    screen.value = targetScreen;
  }
}

function backToWelcome(){
  uniqueQuestionsPassed.value = [];
  uniqueQuestionsPassed.value.length = 0;
  screen.value = 'welcome';
}

onMounted(()=>{
  loadSkills()
  if(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'){
    isLocalhost.value = true;
  }
})

onUnmounted(() => {
  stopListening();
})
</script>

<template>
  <main class="wrap">
    <UPageHeader title="Fluency Trainer" headline="Extreme" />
    <UPageBody>
      <RecorderControl :isActive="isMicActive" :vol="micVol" :isSoundDetected="isMicSoundDetected"
      :inputDevices="inputDevices" @start="startMicRecorder" @stop="stopMicRecorder"
      v-model:selected-input-device="selectedInputDevice" v-show="false" />

      <div class="challenge" :class="{passed: uniqueQuestionsPassed.length == questionsCountChallenge}" v-if="screen != 'welcome'">
        {{ uniqueQuestionsPassed.length }} / {{ questionsCountChallenge }}
      </div>

      <UCard variant="subtle" v-if="screen === 'welcome'">
        What skill would you like to practice?
        <div class="skillSelector">
          <USelect style="max-width: 350px; width: 100%;" v-model="skill.selected" :items="skill.list.map(s=>({label: s.name, value: s.id}))" placeholder="Select a skill" :disabled="skill.loading" />
        </div>
        <UButton @click="startPracticing" label="Start practicing" size="lg" color="primary" :loading="skill.loading"/>
      </UCard>

      <UCard variant="subtle" v-if="screen === 'loading'">
        <Loader style="margin: 0 auto;"/>
      </UCard>

      <UCard variant="subtle" v-if="screen === 'question'">
        <div class="question">
          <div class="skillName">{{ question.skill.name }}</div>
          <p class="questionText">{{ question.text }}</p>
          <div class="speaking">
            <div class="live" v-if="!!state.mic.liveText">{{ state.mic.liveText }}</div>
            <div class="final" v-if="!state.mic.liveText && lastFinalized">{{ lastFinalized.text }}</div>
            <div class="empty shimmer" v-if="!state.mic.liveText && !lastFinalized">
              Start speaking...
            </div>
          </div>
          <div class="actions">
            <UButton @click="stopTraining" label="Stop training" color="error" variant="soft" />
          </div>
        </div>
      </UCard>

      <UCard variant="subtle" v-if="screen === 'evaluating'">
        <Loader style="margin: 0 auto;"/>
      </UCard>

      <UCard variant="subtle" v-if="screen === 'result'">
        <div class="result">
          <div v-if="result.passed" class="passed">
            <Icon name="ion:checkmark-circle"/>
          </div>
          <div v-else>
            <div class="yourAnswer">{{ result.yourAnswer }}</div>
            <div class="correctAnswer">{{ result.correctAnswer }}</div>
            <div class="explanation">{{ result.feedback }}</div>
            <UButton @click="getQuestion" label="Try again" color="primary" icon="ion:refresh"/>
          </div>
        </div>
      </UCard>

      <UCard variant="outline" v-if="isLocalhost">
        Debug:
        Mic state: {{ isMicActive ? 'active' : 'inactive' }}, vol: {{ micVol.toFixed(2) }}, sound detected: {{ isMicSoundDetected }}
        <br>
        Recognition: {{ state.mic.recognition ? 'active' : 'inactive' }}
        <hr>
        <UButton @click="debugScreen('welcome')" label="Go to welcome" color="primary" variant="outline"/>
        <UButton @click="debugScreen('loading')" label="Go to loading" color="primary" variant="outline"/>
        <UButton @click="debugScreen('question')" label="Go to question" color="primary" variant="outline"/>
        <UButton @click="debugScreen('evaluating')" label="Go to evaluating" color="primary" variant="outline"/>
        <UButton @click="debugScreen('resultBad')" label="Go to result - bad" color="primary" variant="outline"/>
        <UButton @click="debugScreen('resultGood')" label="Go to result - good" color="primary" variant="outline"/>
      </UCard>
    </UPageBody>
  </main>
</template>

<style scoped lang="scss">
.challenge{
  text-align: right;
  font-size: 14px;
  color: #b8bfdb;
  margin-bottom: 1rem;

  &.passed{
    color: #4ade80;
    font-weight: bold;
  }
}

.skillSelector{
  margin: 1rem 0;
}

.question{
  .skillName{
    text-align: center;
    font-style: italic;
    font-size: 14px;
    color: #b8bfdb;
  }

  .questionText{
    margin: 1rem 0;
    white-space: pre-wrap;
    font-size: 18px;
    text-align: center;
    font-weight: bold;
  }

  .speaking{
    text-align: center;
    font-size: 1.5em;
    margin: 10px 0;

    .live{
      color: #ffffff9a;
    }
    .final{
      color: #fff;
    }
    .empty{
      color: rgba(255, 255, 255, 0.18);
      font-style: italic;
    }
  }

  .actions{
    display: flex;
    justify-content: center;
    margin-top: 40px;
  }
}

.result{
  text-align: center;

  .passed{
    color: #4ade80;
    font-size: 4em;
    margin-bottom: -15px;
  }

  .yourAnswer{
    font-size: 16px;
    margin-bottom: 1rem;
    text-decoration: line-through;
  }

  .correctAnswer{
    font-size: 18px;
    margin-bottom: 1rem;
  }

  .explanation{
    font-size: 14px;
    color: #b8bfdb;
    margin-bottom: 2rem;
  }
}
</style>