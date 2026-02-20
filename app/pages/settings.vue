<script setup lang="ts">
type WordStatus = 'NEW' | 'HARD' | 'EASY'
type Word = { id: string; term: string; definition: string | null; example: string | null; status: WordStatus }

const words = ref<Word[]>([])
const loading = ref(false)
const onlyStatus = ref<'ALL' | WordStatus>('ALL')

const form = reactive({ term: '', definition: '', example: '', status: 'NEW' as WordStatus })

async function loadWords() {
  loading.value = true
  try {
    const query = onlyStatus.value === 'ALL' ? '' : `?status=${onlyStatus.value}`
    words.value = await $fetch<Word[]>(`/api/words${query}`)
  } finally {
    loading.value = false
  }
}

async function addWord() {
  if (!form.term.trim()) return
  await $fetch('/api/words', { method: 'POST', body: { ...form } })
  form.term = ''; form.definition = ''; form.example = ''; form.status = 'NEW'
  await loadWords()
}

async function removeWord(id: string) {
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
        <h2>Add word</h2>
        <div class="grid">
          <input v-model="form.term" placeholder="word" />
          <input v-model="form.definition" placeholder="definition / translation" />
          <input v-model="form.example" placeholder="example (optional)" />
          <select v-model="form.status">
            <option value="NEW">NEW</option>
            <option value="HARD">HARD</option>
            <option value="EASY">EASY</option>
          </select>
          <button @click="addWord">Add</button>
        </div>
      </UCard>

      <UCard variant="subtle">
        <h2>Words ({{ words.length }})</h2>
        <div class="filter">
          <label>Filter:</label>
          <select v-model="onlyStatus">
            <option value="ALL">ALL</option>
            <option value="NEW">NEW</option>
            <option value="HARD">HARD</option>
            <option value="EASY">EASY</option>
          </select>
        </div>
        <p v-if="loading">Loading...</p>
        <ul v-else class="list">
          <li v-for="w in words" :key="w.id">
            <b>{{ w.term }}</b>
            <span class="status">[{{ w.status }}]</span>
            <span v-if="w.definition"> — {{ w.definition }}</span>
            <button @click="removeWord(w.id)">delete</button>
          </li>
        </ul>
      </UCard>
    </UPageBody>
  </main>
</template>

<style scoped>
.grid{display:grid;gap:.6rem}input,select,button{padding:.65rem .8rem;border-radius:8px;border:1px solid #343b5a;background:#0f1221;color:#fff}
button{cursor:pointer}.filter{display:flex;gap:.8rem;align-items:center;margin-bottom:.8rem}.list{list-style:none;padding:0;margin:0}
.list li{display:flex;gap:.5rem;align-items:center;padding:.5rem 0;border-bottom:1px solid #262b44}.status{color:#9ca3af}
</style>
