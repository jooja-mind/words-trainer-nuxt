<script setup lang="ts">
useHead({ title: 'Fluency C - Mistake Bank' })

const loading = ref(false)
const items = ref<any[]>([])
const errorText = ref('')
const { track } = useTelemetry()

async function loadItems() {
  loading.value = true
  errorText.value = ''
  try {
    const res = await $fetch<{ items: any[] }>('/api/fluency/c/items')
    items.value = res.items
  } catch (e: any) {
    errorText.value = e?.data?.statusMessage || e?.message || 'Failed to load mistake bank'
  } finally {
    loading.value = false
  }
}

async function markResolved(id: string) {
  track('fluency_c_resolve', { id })
  loading.value = true
  try {
    await $fetch('/api/fluency/c/submit', {
      method: 'POST',
      body: { id, isResolved: true }
    })

    try {
      await $fetch('/api/daily/progress', {
        method: 'POST',
        body: { block: 'fluency_c', event: 'item_resolved' }
      })
    } catch {}

    await loadItems()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  track('fluency_c_view')
  loadItems()
})
</script>

<template>
  <main class="wrap">
    <UPageHeader title="Fluency C" headline="Mistake Bank">
      <template #links>
        <UButton to="/daily" size="sm" variant="outline">Back to Daily</UButton>
      </template>
    </UPageHeader>
    <UPageBody>
      <UAlert v-if="errorText" color="error" variant="subtle" :title="errorText" />

      <UCard variant="subtle">
        <div class="actions">
          <UButton :loading="loading" variant="outline" @click="loadItems">Refresh</UButton>
        </div>
      </UCard>

      <UCard variant="subtle" v-if="items.length">
        <div class="item" v-for="it in items" :key="it.id">
          <div>
            <p><b>{{ it.errorType }}</b> · <span class="muted">{{ it.source }}</span></p>
            <p class="muted">Issue: {{ it.wrongFragment }}</p>
            <p class="muted">Suggestion: {{ it.suggestedFragment }}</p>
            <p class="muted">Reviews: {{ it.reviewCount || 0 }} · Next: {{ it.nextReviewAt ? new Date(it.nextReviewAt).toLocaleDateString() : "-" }}</p>
          </div>
          <UButton size="sm" color="success" variant="soft" :loading="loading" @click="markResolved(it.id)">{{ it.isResolved ? "Practice again" : "Resolve" }}</UButton>
        </div>
      </UCard>

      <UCard variant="subtle" v-else>
        <p>No unresolved mistakes yet. Nice 🔥</p>
      </UCard>
    </UPageBody>
  </main>
</template>

<style scoped>
.actions { display: flex; gap: .6rem; }
.item {
  display: flex;
  justify-content: space-between;
  gap: .8rem;
  border-bottom: 1px solid rgba(255,255,255,.08);
  padding: 10px 0;
}
.item:last-child { border-bottom: none; }
.muted { opacity: .8; font-size: 13px; }

@media (max-width: 640px) {
  .actions :deep(button),
  .actions button {
    width: 100%;
  }
}
</style>
