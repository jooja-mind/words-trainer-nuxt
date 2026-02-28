<script setup lang="ts">
useHead({ title: 'Daily Lesson' })

const lesson = ref<any | null>(null)
const loading = ref(false)
const actionLoading = ref(false)
const errorText = ref('')

const statusText = computed(() => {
  if (!lesson.value) return 'No lesson'
  if (lesson.value.status === 'completed') return 'Completed'
  if (lesson.value.status === 'active') return 'In progress'
  return 'Planned'
})

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
      done: Boolean(p.done),
      progress: p,
      route: routeMap[b.id] || '/'
    }
  })
})

const completedCount = computed(() => blocks.value.filter((b: any) => b.done).length)

const currentBlock = computed(() => blocks.value.find((b: any) => !b.done) || null)
const nextBlock = computed(() => {
  if (!currentBlock.value) return null
  const idx = blocks.value.findIndex((b: any) => b.id === currentBlock.value.id)
  return idx >= 0 ? (blocks.value[idx + 1] || null) : null
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

async function markDone(block: string) {
  if (!['quiz', 'recap', 'interview', 'fluency', 'fluency_c', 'fluency_b'].includes(block)) return
  actionLoading.value = true
  errorText.value = ''
  try {
    const res = await $fetch<{ lesson: any }>('/api/daily/progress', {
      method: 'POST',
      body: { block, event: 'done' }
    })
    lesson.value = res.lesson
  } catch (e: any) {
    errorText.value = e?.data?.statusMessage || e?.message || 'Failed to update progress'
  } finally {
    actionLoading.value = false
  }
}

async function completeDaily() {
  actionLoading.value = true
  errorText.value = ''
  try {
    const res = await $fetch<{ lesson: any }>('/api/daily/complete', { method: 'POST' })
    lesson.value = res.lesson
  } catch (e: any) {
    errorText.value = e?.data?.statusMessage || e?.message || 'Failed to complete daily lesson'
  } finally {
    actionLoading.value = false
  }
}

onMounted(loadToday)
</script>

<template>
  <main class="wrap">
    <UPageHeader title="Daily Lesson" headline="UTC+0" />
    <UPageBody>
      <UCard variant="subtle" v-if="loading">
        <p>Loading daily lesson...</p>
      </UCard>

      <template v-else>
        <UAlert v-if="errorText" color="error" variant="subtle" :title="errorText" />

        <UCard variant="subtle" v-if="lesson">
          <p><b>Date:</b> {{ lesson.dateKey }}</p>
          <p><b>Status:</b> {{ statusText }}</p>
          <p><b>Progress:</b> {{ completedCount }}/{{ blocks.length }}</p>

          <div class="actions">
            <UButton color="primary" :loading="actionLoading" @click="startDaily">Start daily</UButton>
            <UButton variant="outline" :loading="actionLoading" @click="loadToday">Refresh</UButton>
            <UButton color="success" variant="soft" :loading="actionLoading" @click="completeDaily">Complete now</UButton>
          </div>
        </UCard>

        <UCard variant="subtle" v-if="blocks.length">
          <h3>Flow</h3>

          <div v-if="currentBlock" class="focusBlock">
            <p class="muted">Current step</p>
            <p><b>{{ currentBlock.title }}</b></p>
            <p class="muted">Target: {{ JSON.stringify(currentBlock.target) }}</p>
            <div class="actions">
              <UButton size="sm" :to="currentBlock.route" variant="outline">Open module</UButton>
              <UButton size="sm" :loading="actionLoading" @click="markDone(currentBlock.id)">Mark current as done</UButton>
            </div>
          </div>

          <div v-if="nextBlock" class="focusBlock next">
            <p class="muted">Next step</p>
            <p><b>{{ nextBlock.title }}</b></p>
            <p class="muted">Target: {{ JSON.stringify(nextBlock.target) }}</p>
          </div>

          <hr>
          <h4>All blocks</h4>
          <div class="block" v-for="b in blocks" :key="b.id">
            <div>
              <p><b>{{ b.title }}</b></p>
              <p class="muted">Target: {{ JSON.stringify(b.target) }}</p>
              <p class="muted">Done: {{ b.done ? 'yes' : 'no' }}</p>
            </div>
            <div class="actions">
              <UButton size="sm" variant="outline" :to="b.route">Open</UButton>
              <UButton size="sm" :disabled="b.done" :loading="actionLoading" @click="markDone(b.id)">Mark done</UButton>
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
