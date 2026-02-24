<script setup lang="ts">
export type Stats = {
  accuracy: number
  accuracy100: number
  accuracy100Answers: number
  accuracy100Window: number
  accuracyLearningProgress: { i: number; a: number; a100: number }[]
  topHardest: { term: string; wrong: number; correct: number; kpi: number }[]
  totalAnswers: number
  totalCorrect: number
  totalWords: number
  totalWrong: number
  toughest: { term: string; wrong: number; correct: number; kpi: number }[]
}

const data = ref<Stats | null>(null)

async function load() {
  data.value = await $fetch<Stats>('/api/quiz/stats')
}

const chartTabs = [
  { label: 'All time', slot: 'accuracy' },
  { label: 'Last 100 answers', slot: 'accuracy100' }
]
const categories = {
  a: {
    name: 'Accuracy',
    color: '#3b82f6'
  }
};
const chartDataAccuracy = computed(() => {
  return data.value?.accuracyLearningProgress.map(p => ({ i: p.i, a: Number((p.a).toFixed(3)) })) || []
})
const chartDataAccuracy100 = computed(() => {
  return data.value?.accuracyLearningProgress.map(p => ({ i: p.i, a100: Number((p.a100).toFixed(3)) })) || []
})

onMounted(load)
</script>

<template>
  <main class="wrap">
    <UPageHeader title="Stats" headline="Vocabulary" />
    <UPageBody>
      <UCard variant="subtle" v-if="data">
        <p>Total words: <b>{{ data.totalWords }}</b></p>
        <p>Total answers: <b>{{ data.totalAnswers }}</b></p>
        <p>Accuracy: <b>{{ (data.accuracy * 100).toFixed(1) }}%</b></p>
        <p>
          Accuracy100:
          <b>{{ (data.accuracy100 * 100).toFixed(1) }}%</b>
        </p>
      </UCard>

      <UCard variant="subtle">
        <h2>Accuracy charts</h2>
        <UTabs :items="chartTabs">
          <template #accuracy>
            <LineChart
              :data="chartDataAccuracy"
              :categories="categories"
              :height="300"
              xLabel="Times answered"
              yLabel="Accuracy"
            />
          </template>
          <template #accuracy100>
            <LineChart
              :data="chartDataAccuracy100"
              :categories="categories"
              :height="300"
              xLabel="Times answered"
              yLabel="Accuracy"
            />
          </template>
        </UTabs>

      </UCard>

      <UCard variant="subtle" v-if="data?.topHardest">
        <h2>Top‑20 hardest (by KPI)</h2>
        <table>
          <thead>
            <tr>
              <th>Term</th>
              <th>W/C</th>
              <th>KPI</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="w in data.topHardest" :key="w.term">
              <td><b>{{ w.term }}</b></td>
              <td>{{ w.wrong }}/{{ w.correct }}</td>
              <td>{{ w.kpi.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </UCard>
    </UPageBody>
  </main>
</template>

<style scoped>
.list{padding-left:1.2rem}.list li{margin:.4rem 0}
table{width:100%;border-collapse:collapse;margin-top:1rem}
th,td{border:1px solid #2a2e44;padding:.6rem;text-align:left}
th{background:#2a2e44}
</style>
