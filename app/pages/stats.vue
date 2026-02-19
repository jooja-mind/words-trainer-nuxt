<script setup lang="ts">
const data = ref<any>(null)

async function load() {
  data.value = await $fetch('/api/quiz/stats')
}

onMounted(load)
</script>

<template>
  <main class="wrap">
    <h1>Stats</h1>
    <section class="card" v-if="data">
      <p>Total words: <b>{{ data.totalWords }}</b></p>
      <p>Total answers: <b>{{ data.totalAnswers }}</b></p>
      <p>Accuracy: <b>{{ (data.accuracy * 100).toFixed(1) }}%</b></p>
    </section>

    <section class="card" v-if="data?.topHardest">
      <h2>Top‑20 hardest (by KPI)</h2>
      <ol class="list">
        <li v-for="w in data.topHardest" :key="w.term">
          <b>{{ w.term }}</b> — wrong: {{ w.wrong }}, correct: {{ w.correct }}, KPI: {{ w.kpi.toFixed(2) }}
        </li>
      </ol>
    </section>
  </main>
</template>

<style scoped>
:global(body){font-family:Inter,system-ui,Arial,sans-serif;background:#0f1221;color:#e5e7eb;margin:0}
.wrap{max-width:980px;margin:1.2rem auto;padding:0 1rem}.card{background:#171a2b;border:1px solid #2a2e44;border-radius:12px;padding:1rem;margin-bottom:1rem}
.list{padding-left:1.2rem}.list li{margin:.4rem 0}
</style>
