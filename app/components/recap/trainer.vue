<script setup lang="ts">
const generatedText = ref('');
const theme = ref('')
const useRandomTheme = ref(true)
const THEME_STORAGE_KEY = 'recap_theme'
const RANDOM_ENABLED_STORAGE_KEY = 'recap_random_enabled'
const PRESET_THEMES = [
  'A routine task becoming unexpectedly complicated',
  'A person adjusting to unfamiliar rules and habits',
  'A team working under pressure while trying to stay calm',
  'Unexpected news changing the mood of an ordinary day',
  'Someone trying something new without feeling fully prepared',
  'A conversation shaped by different priorities',
  'A decision that feels risky even without obvious danger',
  'An everyday service experience that leaves a strong impression',
  'A misunderstanding caused more by assumptions than facts',
  'A moment when confidence turns out to be incomplete',
  'Travel plans being disrupted by small practical problems',
  'Running into someone from the past in a surprising context',
  'Preparing for visitors while several small things go wrong',
  'Losing access to something important for a short time',
  'Trying to handle an unfamiliar task with limited experience',
  'Being asked for help at a slightly inconvenient moment',
  'Realizing too late that something important was forgotten',
  'Questioning an expensive or ambitious choice soon after making it',
  'An ordinary day slowly becoming memorable for unexpected reasons',
  'A small disagreement leading to a more honest exchange',
  'A plan changing because one detail was overlooked',
  'A person trying to look confident while feeling uncertain',
  'Balancing politeness with honesty in a delicate situation',
  'A simple problem turning out to have emotional consequences',
  'An attempt to help creating extra complications',
  'A day shaped by interruptions and shifting priorities',
  'A choice between comfort and opportunity',
  'A familiar place suddenly feeling different',
  'Cooperating with someone whose style is completely different',
  'Trying to fix a mistake without drawing too much attention',
  'A situation where timing matters more than talent',
  'A conversation that changes someone’s first impression',
  'One practical responsibility affecting several other plans',
  'A person noticing a pattern that others ignore',
  'A short interaction with surprisingly lasting consequences',
  'Trying to protect personal time while remaining helpful',
  'Good intentions not being enough to solve a problem',
  'A moment of hesitation before doing something necessary',
  'An event revealing hidden tension inside a group',
  'A person rethinking what success actually means',
  'A software team preparing for a release while key details remain unclear',
  'A developer dealing with a bug that behaves differently every time',
  'A product discussion where technical limits and business goals do not fully match',
  'A new teammate trying to understand an unfamiliar codebase and team routine',
  'A meeting about priorities after several tasks start competing for attention',
  'A project moving forward even though some decisions were never fully agreed on',
  'A person trying to explain a technical problem to someone non-technical',
  'A team noticing late that a small implementation detail affects the whole feature',
  'An engineer balancing speed, quality, and pressure from deadlines',
  'A workday shaped by notifications, context switching, and unfinished thoughts'
]
const status = reactive({
  generatingText: false,
  uploading: false,
});
const loading = ref(false)
const recording = ref(false)
const mediaRecorder = ref<MediaRecorder | null>(null)
const chunks: Blob[] = []
const evaluation = ref<any>(null);
const step = ref<'generate' | 'record' | 'result'>('generate')

onMounted(() => {
  if (!import.meta.client) return
  const saved = localStorage.getItem(THEME_STORAGE_KEY)?.trim() || ''
  if (saved) {
    theme.value = saved
  }

  const randomEnabledItem = localStorage.getItem(RANDOM_ENABLED_STORAGE_KEY)
  const randomEnabled = randomEnabledItem === '1'
  if(randomEnabledItem !== null){
    useRandomTheme.value = randomEnabled;
  }
})

watch(theme, (val) => {
  if (!import.meta.client) return
  localStorage.setItem(THEME_STORAGE_KEY, val)
})

watch(useRandomTheme, (val) => {
  if (!import.meta.client) return
  localStorage.setItem(RANDOM_ENABLED_STORAGE_KEY, val ? '1' : '0')
})

function pickRandomTheme() {
  return PRESET_THEMES[Math.floor(Math.random() * PRESET_THEMES.length)]
}

async function generateText() {
  loading.value = true
  status.generatingText = true
  evaluation.value = null
  const customTheme = theme.value.trim()
  const selectedTheme = useRandomTheme.value
    ? pickRandomTheme()
    : (customTheme || pickRandomTheme())

  try {
    const res = await $fetch<{ text: string }>('/api/recap/generate', {
      method: 'POST',
      body: { theme: selectedTheme }
    });
    generatedText.value = res.text
    step.value = 'record'
  } catch (error) {
    console.error('Error generating text:', error)
    alert('Failed to generate text. Please try again.')
  }
  status.generatingText = false
  loading.value = false
}

async function startRecording() {
  evaluation.value = null
  status.uploading = false
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const rec = new MediaRecorder(stream)
  chunks.length = 0
  rec.ondataavailable = (e) => chunks.push(e.data)
  rec.onstop = async () => {
    const blob = new Blob(chunks, { type: 'audio/webm' })
    await submitRecording(blob)
    stream.getTracks().forEach((t) => t.stop())
  }
  rec.start()
  mediaRecorder.value = rec
  recording.value = true
}

async function stopRecording() {
  if (mediaRecorder.value && recording.value) {
    mediaRecorder.value.stop()
    recording.value = false
  }
}

async function submitRecording(blob: Blob) {
  if (!generatedText.value.trim()) {
    alert('Please generate a text first')
    return
  }
  try {
    loading.value = true
    status.uploading = true
    const form = new FormData()
    form.append('audio', blob, 'recap.webm')
    form.append('text', generatedText.value)
    const res = await $fetch('/api/recap/submit', { method: 'POST', body: form })
    evaluation.value = res
    step.value = 'result'
    submittedCount.value++
    if(res.score > 50) {
      correctCount.value++;
    }
    emits('submitted', { submittedCount: submittedCount.value, correctCount: correctCount.value });
  } catch (error) {
    console.error('Error submitting recording:', error)
    alert('Failed to submit recording. Please try again.')
  }
  status.uploading = false
  loading.value = false
}

function backToGenerate() {
  step.value = 'generate'
  generatedText.value = ''
}

let emits = defineEmits(['submitted']);
let submittedCount = ref(0);
let correctCount = ref(0);
</script>

<template>
  <section v-if="loading">
     <div class="loaderHolder" v-if="status.generatingText || status.uploading">
      <Loader style="margin: 0 auto;"/>
     </div>
  </section>
  <template v-else>
    <UCard variant="subtle" v-if="step === 'generate'">
      <div class="generateControls">
        <UCheckbox
          v-model="useRandomTheme"
          label="Use one random theme"
        />
        <UTextarea
          v-if="!useRandomTheme"
          v-model="theme"
          :rows="3"
          placeholder="Your theme: e.g. A routine task becoming unexpectedly complicated"
        />
        <div>
          <UButton size="lg" color="primary" v-if="!generatedText" @click="generateText" style="margin-top: 10px;">Generate text</UButton>
          <p class="actionInfo" v-if="!generatedText">Ask GPT to generate new text for retelling.</p>
        </div>
      </div>
    </UCard>

    <UCard variant="subtle" v-if="step === 'record'">
      <pre v-if="generatedText" class="text" :class="{blured: !!recording}">{{ generatedText }}</pre>
      <UButton size="sm" variant="outline" style="margin-top: 10px;" @click="backToGenerate">Regenerate text</UButton>
    </UCard>

    <UCard variant="subtle" v-if="step === 'record'">
      <div class="actions">
        <UButton size="lg" color="primary" v-if="!recording" @click="startRecording">Start recording</UButton>
        <UButton size="lg" color="secondary" variant="outline" v-else @click="stopRecording">Stop & analyze</UButton>
      </div>
      <p class="actionInfo">Record ~5 minutes retelling the text.</p>
    </UCard>

    <UCard variant="subtle" v-if="step === 'result'">
      <h2>Text</h2>
      <pre v-if="generatedText" class="text">{{ generatedText }}</pre>
      <hr>
      <h2>Result</h2>
      <p><b>Score:</b> {{ evaluation.score }}/100</p>
      <p><b>Coverage:</b> {{ evaluation.coverage }}</p>
      <p><b>Structure:</b> {{ evaluation.structure }}</p>
      <p><b>Language:</b> {{ evaluation.language }}</p>
      <p><b>Fluency:</b> {{ evaluation.fluency }}</p>
      <h3>Strengths</h3>
      <ul><li v-for="s in evaluation.strengths" :key="s">{{ s }}</li></ul>
      <h3>Improvements</h3>
      <ul><li v-for="s in evaluation.improvements" :key="s">{{ s }}</li></ul>
      <h3>Fixes</h3>
      <ul><li v-for="s in evaluation.fixes" :key="s">{{ s }}</li></ul>
    </UCard>
  </template>
</template>

<style scoped>
.text{white-space:pre-wrap;background:#101327;padding:12px;border-radius:10px;border:1px solid #2f3554;}
.status{color:#c8d0ff}
.generateControls{display:flex;flex-direction:column;gap:.6rem}
.actions{display:flex;gap:.6rem;align-items:center;flex-wrap:wrap}
.hint{color:#b8bfdb;font-size:12px}
hr{
margin: 20px 0;
opacity: 0.3;
}
h2{
margin-bottom: 10px;
font-size: 24px;
}
h3{
margin-top: 15px;
font-weight: bold;
}
ul{
  padding-left: 16px;
}
ul li{
  list-style: disc;
}

.blured{
  filter: blur(4px);

  &:hover{
    filter: none;
  }
}

@media (max-width: 640px) {
  .actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
