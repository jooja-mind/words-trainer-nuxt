<script setup lang="ts">
const generatedText = ref('')
const status = ref('')
const loading = ref(false)
const recording = ref(false)
const mediaRecorder = ref<MediaRecorder | null>(null)
const chunks: Blob[] = []
const evaluation = ref<any>(null)

async function generateText() {
  loading.value = true
  status.value = 'Generating...'
  evaluation.value = null
  const res = await $fetch<{ text: string }>('/api/recap/generate', { method: 'POST' })
  generatedText.value = res.text
  status.value = 'Text ready'
  loading.value = false
}

async function startRecording() {
  evaluation.value = null
  status.value = ''
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
    status.value = 'Generate a text first'
    return
  }
  loading.value = true
  status.value = 'Uploading & analyzing...'
  const form = new FormData()
  form.append('audio', blob, 'recap.webm')
  form.append('text', generatedText.value)
  const res = await $fetch('/api/recap/submit', { method: 'POST', body: form })
  evaluation.value = res
  status.value = 'Done'
  loading.value = false
}
</script>

<template>
  <main class="wrap">
    <h1>Recap (Speaking)</h1>
    <section class="card">
      <button v-if="!generatedText" @click="generateText">Create text</button>
      <p v-if="status" class="status">{{ status }}</p>
      <p v-if="loading" class="status">Loading...</p>
      <pre v-if="generatedText" class="text">{{ generatedText }}</pre>
    </section>

    <section class="card" v-if="generatedText">
      <div class="actions">
        <button v-if="!recording" @click="startRecording">Start recording</button>
        <button v-else @click="stopRecording">Stop & analyze</button>
      </div>
      <p class="hint">Record ~15–20 minutes retelling the text.</p>
    </section>

    <section class="card" v-if="evaluation">
      <h2>Result</h2>
      <p><b>Score:</b> {{ evaluation.score }}/100</p>
      <ul>
        <li><b>Coverage:</b> {{ evaluation.coverage }}</li>
        <li><b>Structure:</b> {{ evaluation.structure }}</li>
        <li><b>Language:</b> {{ evaluation.language }}</li>
        <li><b>Fluency:</b> {{ evaluation.fluency }}</li>
      </ul>
      <h3>Strengths</h3>
      <ul><li v-for="s in evaluation.strengths" :key="s">{{ s }}</li></ul>
      <h3>Improvements</h3>
      <ul><li v-for="s in evaluation.improvements" :key="s">{{ s }}</li></ul>
      <h3>Fixes</h3>
      <ul><li v-for="s in evaluation.fixes" :key="s">{{ s }}</li></ul>
    </section>
  </main>
</template>

<style scoped>
:global(body){font-family:Inter,system-ui,Arial,sans-serif;background:#0f1221;color:#e5e7eb;margin:0}
.wrap{max-width:980px;margin:1.2rem auto;padding:0 1rem}.card{background:#171a2b;border:1px solid #2a2e44;border-radius:12px;padding:1rem;margin-bottom:1rem}
button{padding:.65rem .8rem;border-radius:8px;border:1px solid #343b5a;background:#0f1221;color:#fff;cursor:pointer}
.text{white-space:pre-wrap;background:#101327;padding:12px;border-radius:10px;border:1px solid #2f3554;}
.status{color:#c8d0ff}
.actions{display:flex;gap:.6rem;align-items:center}
.hint{color:#b8bfdb;font-size:12px}
</style>
