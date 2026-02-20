<script setup lang="ts">
const item = ref<{ id: string; question: string; answer?: string | null } | null>(null)
const showAnswer = ref(false)
const status = ref('')
const recording = ref(false)
const mediaRecorder = ref<MediaRecorder | null>(null)
const chunks: Blob[] = []

async function loadQuestion() {
  status.value = 'Loading question...'
  showAnswer.value = false
  const res = await $fetch<{ item: any }>('/api/interview/random')
  item.value = res.item
  status.value = item.value ? '' : 'No interview questions yet'
}

async function startRecording() {
  if (!item.value) return
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
  if (!item.value) return
  status.value = 'Saving recording...'
  const form = new FormData()
  form.append('audio', blob, 'interview.webm')
  form.append('questionId', item.value.id)
  form.append('question', item.value.question)
  await $fetch('/api/interview/submit', { method: 'POST', body: form })
  status.value = 'Saved'
}

onMounted(loadQuestion)
</script>

<template>
  <main class="wrap">
    <h1>Interview Practice</h1>
    <section class="card">
      <button @click="loadQuestion">New question</button>
      <p v-if="status" class="status">{{ status }}</p>
      <div v-if="item" class="question">
        <p><b>Question:</b> {{ item.question }}</p>
        <button class="ghost" @click="showAnswer = !showAnswer">
          {{ showAnswer ? 'Hide answer' : 'Show answer' }}
        </button>
        <p v-if="showAnswer && item.answer" class="answer"><b>Answer:</b> {{ item.answer }}</p>
      </div>
    </section>

    <section class="card" v-if="item">
      <div class="actions">
        <button v-if="!recording" @click="startRecording">Start recording</button>
        <button v-else @click="stopRecording">Stop</button>
      </div>
      <p class="hint">Record your answer aloud. The audio is saved to Shared.</p>
    </section>
  </main>
</template>

<style scoped>
:global(body){font-family:Inter,system-ui,Arial,sans-serif;background:#0f1221;color:#e5e7eb;margin:0}
.wrap{max-width:980px;margin:1.2rem auto;padding:0 1rem}.card{background:#171a2b;border:1px solid #2a2e44;border-radius:12px;padding:1rem;margin-bottom:1rem}
button{padding:.65rem .8rem;border-radius:8px;border:1px solid #343b5a;background:#0f1221;color:#fff;cursor:pointer}
.status{color:#c8d0ff}.question{margin-top:.6rem}.answer{margin-top:.4rem;color:#c8d0ff}
.actions{display:flex;gap:.6rem;align-items:center}.hint{color:#b8bfdb;font-size:12px}
.ghost{border:1px solid #39406a;background:#171d36;color:#dbe1ff;padding:.3rem .55rem;border-radius:8px;cursor:pointer;font-size:12px}
</style>
