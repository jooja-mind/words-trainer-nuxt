<script setup lang="ts">
useHead({ title: 'Fluency A - Pattern Drills' })

const loading = ref(false)
const promptData = ref<{ mode: 'A'; prompt: string; targetPattern?: string; timeLimitSec: number } | null>(null)
const transcript = ref('')
const result = ref<any | null>(null)
const errorText = ref('')
const { track } = useTelemetry()
const timerRef = ref<any>(null)

async function nextPrompt() {
  loading.value = true
  errorText.value = ''
  result.value = null
  try {
    promptData.value = await $fetch('/api/fluency/a/next', { method: 'POST' })
    transcript.value = ''
  } catch (e: any) {
    errorText.value = e?.data?.statusMessage || e?.message || 'Failed to load prompt'
  } finally {
    loading.value = false
  }
}

function onRecordedTranscript(text: string) {
  if (!text) return
  transcript.value = text
}

async function submit() {
  track('fluency_a_submit')
  if (!promptData.value || !transcript.value.trim()) return
  loading.value = true
  errorText.value = ''
  try {
    result.value = await $fetch('/api/fluency/a/submit', {
      method: 'POST',
      body: {
        prompt: promptData.value.prompt,
        targetPattern: promptData.value.targetPattern,
        transcript: transcript.value.trim()
      }
    })
  } catch (e: any) {
    errorText.value = e?.data?.statusMessage || e?.message || 'Failed to submit answer'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  track('fluency_a_view')
  nextPrompt()
})
</script>

<template>
  <main class="wrap">
    <UPageHeader title="Fluency A" headline="Pattern Drills">
      <template #links>
        <UButton to="/daily" size="sm" variant="outline">Back to Daily</UButton>
      </template>
    </UPageHeader>
    <UPageBody>
      <UAlert v-if="errorText" color="error" variant="subtle" :title="errorText" />

      <UCard variant="subtle" v-if="promptData">
        <p><b>Target pattern:</b> {{ promptData.targetPattern || 'n/a' }}</p>
        <p><b>Time limit:</b> {{ promptData.timeLimitSec }} sec</p>
        <FluencyTimer ref="timerRef" :seconds="promptData.timeLimitSec" />
        <p class="prompt">{{ promptData.prompt }}</p>

        <FluencyRecorder :disabled="loading" @transcript-ready="onRecordedTranscript" @error="errorText = $event" />

        <UTextarea
          v-model="transcript"
          :rows="6"
          placeholder="Paste or type your spoken answer transcript here..."
        />

        <div class="actions">
          <UButton color="primary" :loading="loading" @click="submit">Submit answer</UButton>
          <UButton variant="outline" :loading="loading" @click="nextPrompt">Next prompt</UButton>
        </div>
      </UCard>

      <UCard variant="subtle" v-if="result">
        <p><b>Verdict:</b> {{ result.evaluation?.verdict }}</p>
        <p><b>Score:</b> {{ result.evaluation?.score }}</p>
        <h4>Feedback</h4>
        <ul>
          <li v-for="f in (result.evaluation?.feedback || [])" :key="f">{{ f }}</li>
        </ul>
      </UCard>
    </UPageBody>
  </main>
</template>

<style scoped>
.prompt { margin: 10px 0; }
.actions { display: flex; gap: .6rem; flex-wrap: wrap; margin-top: 10px; }
ul { padding-left: 16px; }
li { list-style: disc; }
</style>
