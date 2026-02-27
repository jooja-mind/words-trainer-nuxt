<script setup lang="ts">
const generatedText = ref('');
const theme = ref('')
const THEME_STORAGE_KEY = 'recap_theme'
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
  const saved = localStorage.getItem(THEME_STORAGE_KEY)
  if (saved) theme.value = saved
})

watch(theme, (val) => {
  if (!import.meta.client) return
  localStorage.setItem(THEME_STORAGE_KEY, val)
})

async function generateText() {
  loading.value = true
  status.generatingText = true
  evaluation.value = null
  try {
    const res = await $fetch<{ text: string }>('/api/recap/generate', {
      method: 'POST',
      body: { theme: theme.value.trim() || undefined }
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
  } catch (error) {
    console.error('Error submitting recording:', error)
    alert('Failed to submit recording. Please try again.')
  }
  status.uploading = false
  loading.value = false
}
</script>

<template>
  <main class="wrap">
    <UPageHeader title="Recap (Speaking)" />
    <UPageBody>
      <section v-if="loading">
        <p v-if="status.generatingText" class="status">Generating text...</p>
        <p v-if="status.uploading" class="status">Uploading & analyzing...</p>
      </section>
      <template v-else>
        <UCard variant="subtle" v-if="step === 'generate'">
          <div class="generateControls">
            <p class="actionInfo">Optional: set a theme for the story (for example: IT, startup life, travel, product design).</p>
            <UTextarea
              v-model="theme"
              :rows="3"
              placeholder="Theme (optional): e.g. A day in a software team preparing for release"
            />
            <UButton size="lg" color="primary" v-if="!generatedText" @click="generateText" style="margin-top: 10px;">Create text</UButton>
            <p class="actionInfo" v-if="!generatedText">Ask GPT to create new text for retelling.</p>
          </div>
        </UCard>

        <UCard variant="subtle" v-if="step === 'record'">
          <pre v-if="generatedText" class="text">{{ generatedText }}</pre>
          <UButton size="sm" variant="outline" style="margin-top: 10px;" @click="generateText">Regenerate text</UButton>
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
    </UPageBody>
  </main>
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

@media (max-width: 640px) {
  .actions {
    flex-direction: column;
    align-items: stretch;
  }
  .actions :deep(button),
  .generateControls :deep(button),
  .generateControls :deep(textarea) {
    width: 100%;
  }
}
</style>
