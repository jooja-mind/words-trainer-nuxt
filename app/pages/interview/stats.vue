<script setup lang="ts">
useHead({ title: "Interview Stats" })
const stats = ref<any[]>([]);
const loading = ref(true)

let limit = 10;
async function loadStats() {
  loading.value = true
  const res = await $fetch<{ stats: any[] }>(`/api/interview/stats?limit=${limit}`)
  stats.value = res.stats
  loading.value = false
}

onMounted(async ()=> {
  await loadStats()
})

</script>

<template>
  <main class="wrap">
    <UPageHeader title="Interview Stats" />
    <UPageBody>
      <section v-if="loading">
        Loading...
      </section>
      <template v-else>
        <UCard variant="subtle">
          <h2>Top‑{{ limit }} hardest (by KPI)</h2>
          <UCard variant="soft" class="mb-2"  v-for="s in stats" :key="s.question">
            <p><b>{{ s.question }}</b></p>
            <div class="stats">
              <p :class="s.kpi > 1 ? 'ok' : ''">KPI: {{ s.kpi.toFixed(2) }}</p>
              <p>W/C: {{ s.timesIncorrect }}/{{ s.timesCorrect }}</p>
            </div>
          </UCard>
        </UCard>
      </template>
    </UPageBody>
  </main>
</template>

<style scoped>
.stats{
  margin-top: 6px;
  display: flex;
  align-content: center;
  justify-content: space-between;
}

.ok{
  color: #4caf50;
}
</style>
