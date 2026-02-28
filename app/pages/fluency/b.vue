<script setup lang="ts">
useHead({ title: 'Fluency B - Minimal Pairs' })

const loading = ref(false)
const item = ref<any | null>(null)
const selected = ref('')
const result = ref<any | null>(null)
const errorText = ref('')

async function nextItem() {
  loading.value = true
  errorText.value = ''
  result.value = null
  selected.value = ''
  try {
    item.value = await $fetch('/api/fluency/b/next', { method: 'POST' })
  } catch (e: any) {
    errorText.value = e?.data?.statusMessage || e?.message || 'Failed to load item'
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!item.value || !selected.value) return
  loading.value = true
  errorText.value = ''
  try {
    result.value = await $fetch('/api/fluency/b/submit', {
      method: 'POST',
      body: {
        prompt: item.value.prompt,
        options: item.value.options,
        correctOption: item.value.correctOption,
        selectedOption: selected.value
      }
    })
  } catch (e: any) {
    errorText.value = e?.data?.statusMessage || e?.message || 'Failed to submit'
  } finally {
    loading.value = false
  }
}

onMounted(nextItem)
</script>

<template>
  <main class="wrap">
    <UPageHeader title="Fluency B" headline="Minimal Pairs">
      <template #links>
        <UButton to="/daily" size="sm" variant="outline">Back to Daily</UButton>
      </template>
    </UPageHeader>
    <UPageBody>
      <UAlert v-if="errorText" color="error" variant="subtle" :title="errorText" />

      <UCard variant="subtle" v-if="item">
        <p><b>Time limit:</b> {{ item.timeLimitSec }} sec</p>
        <p class="prompt">{{ item.prompt }}</p>

        <URadioGroup v-model="selected" :items="item.options.map((o: string) => ({ label: o, value: o }))" />

        <div class="actions">
          <UButton color="primary" :disabled="!selected" :loading="loading" @click="submit">Submit</UButton>
          <UButton variant="outline" :loading="loading" @click="nextItem">Next</UButton>
        </div>
      </UCard>

      <UCard variant="subtle" v-if="result">
        <p><b>Verdict:</b> {{ result.evaluation?.verdict }}</p>
        <p><b>Score:</b> {{ result.evaluation?.score }}</p>
        <ul>
          <li v-for="f in (result.evaluation?.feedback || [])" :key="f">{{ f }}</li>
        </ul>
      </UCard>
    </UPageBody>
  </main>
</template>

<style scoped>
.prompt { margin: 10px 0; }
.actions { display: flex; gap: .6rem; margin-top: 10px; }
ul { padding-left: 16px; }
li { list-style: disc; }
</style>
