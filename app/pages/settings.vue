<script setup lang="ts">
type WordStatus = 'NEW' | 'HARD' | 'EASY'
type Word = { id: string; term: string; definition: string | null; example: string | null; status: WordStatus; translationRu: string }

const words = ref<Word[]>([])
const loading = ref(false)
const onlyStatus = ref<'ALL' | WordStatus>('ALL')

async function loadWords() {
  loading.value = true
  try {
    const query = onlyStatus.value === 'ALL' ? '' : `?status=${onlyStatus.value}`
    words.value = await $fetch<Word[]>(`/api/words${query}`)
  } finally {
    loading.value = false
  }
}

let addWordsLoading = ref(false)
let wordsToAdd = ref('');
async function addWords() {
  if (!wordsToAdd.value.trim()) return
  addWordsLoading.value = true
  try {
    await $fetch('/api/words/batch', { method: 'POST', body: { text: wordsToAdd.value } })
    wordsToAdd.value = ''
    await loadWords()
  } finally {
    addWordsLoading.value = false
  }
}

async function removeWord(id: string) {
  let word = words.value.find(w => w.id === id);
  if(!word) return;
  let confirmDelete = confirm(`Are you sure you want to delete "${word.term}"?`)
  if (!confirmDelete) return;
  await $fetch(`/api/words/${id}`, { method: 'DELETE' })
  await loadWords()
}

onMounted(loadWords)
watch(onlyStatus, loadWords)
</script>

<template>
  <main class="wrap">
    <UPageHeader title="Words Settings" headline="Vocabulary" />
    <UPageBody>
      <UCard variant="subtle">
        <h2>Add words</h2>
        <UTextarea v-model="wordsToAdd" class="w-full" :rows="12" :disabled="addWordsLoading" placeholder="Paste words in free format" />
        <UButton size="lg" color="primary" class="mt-3" @click="addWords" :loading="addWordsLoading">Add words</UButton>
      </UCard>

      <UCard variant="subtle">
        <h2>Words ({{ words.length }})</h2>
        <div class="filter">
          <label>Filter:</label>
          <USelect v-model="onlyStatus" :items="[
            { value: 'ALL', label: 'ALL' },
            { value: 'NEW', label: 'NEW' },
            { value: 'HARD', label: 'HARD' },
            { value: 'EASY', label: 'EASY' },
          ]" />
        </div>
        <p v-if="loading">Loading...</p>
        <template v-else>
          <UCard variant="subtle" v-for="w in words" :key="w.id" class="mb-2">
            <div>
              <div class="flex justify-between items-start">
                <div class="word">
                  <b>{{ w.term }}</b>
                  <UBadge :color="({
                    NEW: 'neutral',
                    HARD: 'error',
                    EASY: 'success'
                  }[w.status as WordStatus] || 'neutral') as 'neutral' | 'error' | 'success'" variant="soft">{{ w.status }}</UBadge>
                </div>
                <UButton size="sm" variant="outline" color="error" @click="removeWord(w.id)">Delete</UButton>
              </div>
              <p v-if="w.translationRu" class="mt-1 text-gray-400">{{ w.translationRu }}</p>
              <p v-if="w.definition" class="mt-1">{{ w.definition }}</p>
              <p v-if="w.example" class="mt-1 italic text-sm text-gray-400">Example: {{ w.example }}</p>
            </div>
          </UCard>
        </template>
      </UCard>
    </UPageBody>
  </main>
</template>

<style scoped>
.grid{display:grid;gap:.6rem}input,select{padding:.65rem .8rem;border-radius:8px;border:1px solid #343b5a;background:#0f1221;color:#fff}
.filter{display:flex;gap:.8rem;align-items:center;margin-bottom:.8rem}.list{list-style:none;padding:0;margin:0}
.word{
  display: flex;
  gap: .5rem;
  align-items: center;
}
</style>
