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
    skill.list = [{'id': 0, 'name': 'All'}, ...list]
  } catch (error) {
    console.error('Failed to load skill list:', error)
    alert('Failed to load skill list. Please try again later.')
  } finally {
    skill.loading = false;
  }
}

async function startPracticing(){
  screen.value = 'loading';
  await getQuestion();
}

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
  } catch (error) {
    console.error('Failed to load question:', error)
    alert('Failed to load question. Please try again later.')
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
  alert('Failed to answer question. Please try again later.')
 } finally {
  result.loading = false;
 }
}

async function stopTraining(){
  stopListening();
  screen.value = 'welcome';
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

      <UCard variant="subtle" v-if="screen === 'welcome'">
        What skill would you like to practice?
        <div class="skillSelector">
          <USelect style="width: 200px" v-model="skill.selected" :items="skill.list.map(s=>({label: s.name, value: s.id}))" placeholder="Select a skill" />
        </div>
        <UButton @click="startPracticing" label="Start practicing" color="primary" variant="soft" :loading="skill.loading"/>
      </UCard>

      <UCard variant="subtle" v-if="screen === 'loading'">
        Loading question...
      </UCard>

      <UCard variant="subtle" v-if="screen === 'question'">
        <h2>{{ question.skill.name }}</h2>
        <p>{{ question.text }}</p>
        <hr>
        <div class="speaking">
          <div class="live" v-if="!!state.mic.liveText">{{ state.mic.liveText }}</div>
          <div class="final" v-if="!state.mic.liveText && lastFinalized">{{ lastFinalized.text }}</div>
          <div class="empty" v-if="!state.mic.liveText && !lastFinalized">
            <em>Start speaking...</em>
          </div>
        </div>
        <hr>
        <UButton @click="stopTraining" label="Stop training" color="primary" variant="soft" />
      </UCard>

      <UCard variant="subtle" v-if="screen === 'evaluating'">
        Evaluating your answer...
      </UCard>

      <UCard variant="subtle" v-if="screen === 'result'">
        <div v-if="result.passed" class="passed">
          <Icon name="ion:checkmark-circle"/>
        </div>
        <div v-else>
          <div class="yourAnswer">{{ result.yourAnswer }}</div>
          <div class="correctAnswer">{{ result.correctAnswer }}</div>
          <div class="explanation">{{ result.feedback }}</div>
          <UButton @click="getQuestion" label="Try again" color="primary" variant="soft"/>
        </div>
      </UCard>

      <UCard variant="subtle" v-if="isLocalhost">
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
.speaking{
  text-align: center;
  font-size: 1.5em;

  .live{
    color: #ffffff9a;
  }
  .final{
    color: #fff;
  }
}
</style>