<script setup lang="ts">
useHead({ title: "Interview" })
const item = ref<{ id: string; question: string; answer?: string | null } | null>(null)
const showAnswer = ref(false)
const loading = ref(false)
const recording = ref(false)
const evaluation = ref<any>(null)
const mediaRecorder = ref<MediaRecorder | null>(null)
const chunks: Blob[] = [];
let status = reactive({
  loadingQuestion: false,
  uploading: false
});
let noQuestionInDB = ref(false)

async function loadQuestion() {
  loading.value = true
  status.loadingQuestion = true
  showAnswer.value = false
  evaluation.value = null
  const res = await $fetch<{ item: any }>('/api/interview/random')
  item.value = res.item
  noQuestionInDB.value = !item.value
  status.loadingQuestion = false
  loading.value = false
}

async function startRecording() {
  if (!item.value) return
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
  loading.value = true
  status.uploading = true
  const form = new FormData()
  form.append('audio', blob, 'interview.webm')
  form.append('questionId', item.value.id)
  form.append('question', item.value.question)
  form.append('expected', item.value.answer || '')

  const res = await $fetch('/api/interview/submit', { method: 'POST', body: form })
  evaluation.value = res
  status.uploading = false
  loading.value = false
}

onMounted(async ()=> {
  await loadQuestion();

  if(process.env.NODE_ENV === 'development') {
    evaluation.value = {
      verdict: 'Good job! You covered most of the points.',
      missing_points: ['Point 1', 'Point 2', 'Point 3'],
      short_feedback: ['Feedback 1', 'Feedback 2', 'Feedback 3']
    }
  }
})

</script>

<template>
  <main class="wrap">
    <UPageHeader title="Interview" />
    <UPageBody>
      <section v-if="loading">
        <p v-if="status.uploading" class="status">Uploading & analyzing...</p>
        <p v-else-if="status.loadingQuestion" class="status">Loading question...</p>
      </section>
      <template v-else>
        <section class="card">
          <button @click="loadQuestion">Get question</button>
          <p class="actionInfo" v-if="noQuestionInDB">No interview questions yet. Please add some to DB.</p>
          <div v-if="item" class="questionHolder">
            <p class="question"><b>Question:</b> {{ item.question }}</p>
            <button class="ghost" @click="showAnswer = !showAnswer">
              {{ showAnswer ? 'Hide answer' : 'Show answer' }}
            </button>
            <p v-if="showAnswer && item.answer" class="answer"><b>Expected:</b> {{ item.answer }}</p>
          </div>
        </section>

        <section class="card" v-if="item && !evaluation">
          <div class="actions">
            <button v-if="!recording" @click="startRecording">Start recording</button>
            <button v-else @click="stopRecording">Stop & analyze</button>
          </div>
          <p class="actionInfo">Record your answer aloud.</p>
        </section>

        <section class="card" v-if="evaluation">
          <p><b>Verdict:</b> {{ evaluation.verdict }}</p>
          <div class="evaluationTitle">Missing points</div>
          <ul><li v-for="m in evaluation.missing_points" :key="m">{{ m }}</li></ul>
          <div class="evaluationTitle">Feedback</div>
          <ul><li v-for="m in evaluation.short_feedback" :key="m">{{ m }}</li></ul>
        </section>
      </template>
    </UPageBody>
  </main>
</template>

<style scoped>
.wrap{max-width:980px;margin:1.2rem auto;padding:0 1rem}.card{background:#171a2b;border:1px solid #2a2e44;border-radius:12px;padding:1rem;margin-bottom:1rem}
button{padding:.65rem .8rem;border-radius:8px;border:1px solid #343b5a;background:#0f1221;color:#fff;cursor:pointer}
.status{color:#c8d0ff}
.actions{display:flex;gap:.6rem;align-items:center}.hint{color:#b8bfdb;font-size:12px}
.ghost{border:1px solid #39406a;background:#171d36;color:#dbe1ff;padding:.3rem .55rem;border-radius:8px;cursor:pointer;font-size:12px}
.question{margin-top:10px; margin-bottom:10px}
.answer{margin-top:10px;color:#c8d0ff}
.evaluationTitle{margin-top:10px;margin-bottom:5px; font-weight: bold;}
</style>
