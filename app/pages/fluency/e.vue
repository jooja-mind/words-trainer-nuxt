<script setup lang="ts">
useHead({ title: 'Fluency E - Metrics' })

const loading = ref(false)
const data = ref<any | null>(null)
const errorText = ref('')

function barWidth(value: number, max = 100) {
  const v = Math.max(0, Math.min(value || 0, max))
  return `${v}%`
}

async function loadMetrics() {
  loading.value = true
  errorText.value = ''
  try {
    data.value = await $fetch('/api/fluency/metrics')
  } catch (e: any) {
    errorText.value = e?.data?.statusMessage || e?.message || 'Failed to load metrics'
  } finally {
    loading.value = false
  }
}

onMounted(loadMetrics)
</script>

<template>
  <main class="wrap">
    <UPageHeader title="Fluency E" headline="Metrics">
      <template #links>
        <UButton to="/daily" size="sm" variant="outline">Back to Daily</UButton>
      </template>
    </UPageHeader>
    <UPageBody>
      <UAlert v-if="errorText" color="error" variant="subtle" :title="errorText" />

      <UCard variant="subtle" v-if="data?.summary">
        <p><b>Attempts:</b> {{ data.summary.attempts }}</p>
        <p><b>Acceptable rate:</b> {{ data.summary.acceptableRate }}%</p>
        <p><b>Avg score:</b> {{ data.summary.scoreAvg }}</p>
        <p><b>Avg WPM:</b> {{ data.summary.wpmAvg }}</p>
        <p><b>Avg long pauses:</b> {{ data.summary.pausesAvg }}</p>
        <p><b>Avg self-corrections:</b> {{ data.summary.selfCorrectionsAvg }}</p>
      </UCard>

      <UCard variant="subtle" v-if="data?.week?.length">
        <h4>Week-over-week</h4>
        <div class="weekRow" v-for="w in data.week" :key="w.date">
          <div class="date">{{ w.date }}</div>
          <div class="metric">
            <span class="muted">Score {{ w.scoreAvg || 0 }}</span>
            <div class="bar"><div class="fill score" :style="{ width: barWidth(w.scoreAvg || 0) }" /></div>
          </div>
          <div class="metric">
            <span class="muted">Acceptable {{ w.acceptableRate || 0 }}%</span>
            <div class="bar"><div class="fill ok" :style="{ width: barWidth(w.acceptableRate || 0) }" /></div>
          </div>
        </div>
      </UCard>

      <UCard variant="subtle" v-if="data?.recent?.length">
        <h4>Recent attempts</h4>
        <div class="row" v-for="r in data.recent" :key="r.id">
          <span>{{ r.mode }}</span>
          <span>{{ r.verdict }}</span>
          <span>{{ r.score ?? '-' }}</span>
          <span>{{ new Date(r.createdAt).toLocaleString() }}</span>
        </div>
      </UCard>
    </UPageBody>
  </main>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 80px 140px 80px 1fr;
  gap: .6rem;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,.08);
}
.row:last-child { border-bottom: none; }
.weekRow { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,.08); }
.weekRow:last-child { border-bottom: none; }
.date { font-weight: 600; margin-bottom: 6px; }
.metric { margin: 6px 0; }
.muted { opacity: .8; font-size: 12px; }
.bar { height: 8px; background: rgba(255,255,255,.12); border-radius: 999px; overflow: hidden; }
.fill { height: 100%; }
.fill.score { background: #7c8cff; }
.fill.ok { background: #22c55e; }
</style>
