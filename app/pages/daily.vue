<script setup lang="ts">
useHead({ title: 'Daily Lesson' })

const lesson = ref<any | null>(null)
const loading = ref(false)
const actionLoading = ref(false)
const errorText = ref('')
const { track } = useTelemetry()

const statusText = computed(() => {
  if (!lesson.value) return 'No lesson'
  if (lesson.value.status === 'completed') return 'Completed'
  if (lesson.value.status === 'active') return 'In progress'
  return 'Planned'
})

function formatTarget(target: any) {
  if (!target || typeof target !== 'object') return '-'
  const parts: string[] = []
  if (target.rounds) parts.push(`${target.rounds} rounds`)
  if (target.wordsPerRound) parts.push(`${target.wordsPerRound} words/round`)
  if (target.attempts) parts.push(`${target.attempts} attempt(s)`)
  if (target.prompts) parts.push(`${target.prompts} prompt(s)`)
  if (target.items) parts.push(`${target.items} item(s)`)
  if (target.maxAttempts) parts.push(`max ${target.maxAttempts} attempts`)
  if (target.acceptable) parts.push('until acceptable')
  return parts.length ? parts.join(' · ') : JSON.stringify(target)
}

const blocks = computed(() => {
  const planBlocks = lesson.value?.planJson?.blocks || []
  const progressBlocks = lesson.value?.progressJson?.blocks || {}

  return planBlocks.map((b: any) => {
    const p = progressBlocks[b.id] || {}
    const routeMap: Record<string, string> = {
      quiz: '/trainer',
      recap: '/recap',
      interview: '/interview',
      fluency: '/fluency',
      fluency_c: '/fluency/c',
      fluency_b: '/fluency/b'
    }

    return {
      id: b.id,
      title: b.title,
      target: b.target,
      required: b.required !== false,
      done: Boolean(p.done),
      progress: p,
      route: routeMap[b.id] || '/'
    }
  })
})

const requiredBlocks = computed(() => blocks.value.filter((b: any) => b.required))
const completedRequiredCount = computed(() => requiredBlocks.value.filter((b: any) => b.done).length)

const currentBlock = computed(() => requiredBlocks.value.find((b: any) => !b.done) || null)
const nextBlock = computed(() => {
  if (!currentBlock.value) return null
  const idx = requiredBlocks.value.findIndex((b: any) => b.id === currentBlock.value.id)
  return idx >= 0 ? (requiredBlocks.value[idx + 1] || null) : null
})

async function loadToday() {
  loading.value = true
  errorText.value = ''
  try {
    const res = await $fetch<{ lesson: any }>('/api/daily/today')
    lesson.value = res.lesson
  } catch (e: any) {
    errorText.value = e?.data?.statusMessage || e?.message || 'Failed to load daily lesson'
  } finally {
    loading.value = false
  }
}

async function startDaily() {
  actionLoading.value = true
  track('daily_start_clicked')
  errorText.value = ''
  try {
    const res = await $fetch<{ lesson: any }>('/api/daily/start', { method: 'POST' })
    lesson.value = res.lesson
  } catch (e: any) {
    errorText.value = e?.data?.statusMessage || e?.message || 'Failed to start daily lesson'
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  track('daily_page_view')
  loadToday()
})
</script>

<template>
  <main class="wrap">
    <UPageHeader title="Daily Lesson" />
    <UPageBody>
      <UCard variant="subtle" v-if="loading">
        <p>Loading daily lesson...</p>
      </UCard>

      <template v-else>
        <UAlert v-if="errorText" color="error" variant="subtle" :title="errorText" />

        <UCard variant="subtle" v-if="lesson">
          <p><b>Date:</b> {{ lesson.dateKey }}</p>
          <p><b>Status:</b> {{ statusText }}</p>
          <p><b>Progress:</b> {{ completedRequiredCount }}/{{ requiredBlocks.length }} required blocks</p>

          <div class="actions">
            <UButton color="primary" :loading="actionLoading" @click="startDaily">Start daily</UButton>
            <UButton variant="outline" :loading="actionLoading" @click="loadToday">Refresh</UButton>
          </div>
        </UCard>

        <UCard variant="subtle" v-if="requiredBlocks.length">
          <h3>Flow</h3>

          <div v-if="currentBlock" class="focusBlock">
            <p class="muted">Current step</p>
            <p><b>{{ currentBlock.title }}</b></p>
            <p class="muted">Target: {{ formatTarget(currentBlock.target) }}</p>
            <div class="actions">
              <UButton size="sm" :to="currentBlock.route" variant="outline">Open module</UButton>
            </div>
          </div>

          <div v-if="nextBlock" class="focusBlock next">
            <p class="muted">Next step</p>
            <p><b>{{ nextBlock.title }}</b></p>
            <p class="muted">Target: {{ formatTarget(nextBlock.target) }}</p>
          </div>

          <hr>
          <h4>All blocks</h4>
          <div class="block" v-for="b in blocks" :key="b.id">
            <div>
              <p><b>{{ b.title }}</b> <span class="muted" v-if="!b.required">(optional)</span></p>
              <p class="muted">Target: {{ formatTarget(b.target) }}</p>
              <p class="muted">Done: {{ b.done ? 'yes' : 'no' }}</p>
            </div>
            <div class="actions">
              <UButton size="sm" variant="outline" :to="b.route">Open</UButton>
            </div>
          </div>
        </UCard>

        <UCard variant="subtle" color="success" v-if="lesson?.status === 'completed' || lesson?.progressJson?.completed">
          <h2>🎉 Congratulations!</h2>
          <p>You completed today’s daily lesson.</p>
        </UCard>
      </template>
    </UPageBody>
  </main>
</template>

<style scoped>
.actions { display: flex; gap: .6rem; flex-wrap: wrap; margin-top: 10px; }
.focusBlock {
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 10px;
  padding: 10px;
  margin-top: 8px;
}
.focusBlock.next {
  opacity: .9;
}
hr {
  margin: 14px 0;
  opacity: .3;
}
h4 {
  margin-bottom: 6px;
}
.block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .8rem;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,.08);
}
.block:last-child { border-bottom: none; }
.muted { opacity: .8; font-size: 13px; }
</style>
