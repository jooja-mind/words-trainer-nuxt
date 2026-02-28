<script setup lang="ts">
useHead({ title: 'Fluency D - Pressure Mode' })

const loading = ref(false)
const promptData = ref<{ mode: 'D'; prompt: string; timeLimitSec: number } | null>(null)
const transcript = ref('')
const result = ref<any | null>(null)
const errorText = ref('')

async function nextPrompt() {
  loading.value = true
  errorText.value = ''
  result.value = null
  try {
    promptData.value = await $fetch('/api/fluency/d/next', { method: 'POST' })
    transcript.value = ''
  } catch (e: any) {
    errorText.value = e?.data?.statusMessage || e?.message || 'Failed to load prompt'
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!promptData.value || !transcript.value.trim()) return
  loading.value = true
  errorText.value = ''
  try {
    result.value = await $fetch('/api/fluency/d/submit', {
      method: 'POST',
      body: {
        prompt: promptData.value.prompt,
        timeLimitSec: promptData.value.timeLimitSec,
        transcript: transcript.value.trim()
      }
    })
  } catch (e: any) {
    errorText.value = e?.data?.statusMessage || e?.message || 'Failed to submit answer'
  } finally {
    loading.value = false
  }
}

onMounted(nextPrompt)
</script>

<template>
  <main class="wrap">
    <UPageHeader title="Fluency D" headline="Pressure Mode" />
    <UPageBody>
      <UAlert v-if="errorText" color="error" variant="subtle" :title="errorText" />

      <UCard variant="subtle" v-if="promptData">
        <p><b>Time limit:</b> {{ promptData.timeLimitSec }} sec</p>
        <p class="prompt">{{ promptData.prompt }}</p>

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
