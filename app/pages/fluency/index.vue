<script setup lang="ts">
useHead({ title: 'Fluency Hub' })

const modes = [
  { key: 'a', label: 'A - Pattern Drills', to: '/fluency/a' },
  { key: 'b', label: 'B - Minimal Pairs', to: '/fluency/b' },
  { key: 'd', label: 'D - Pressure Mode', to: '/fluency/d' },
  { key: 'c', label: 'C - Mistake Bank', to: '/fluency/c' },
  { key: 'e', label: 'E - Metrics', to: '/fluency/e' }
]
</script>

<template>
  <main class="wrap">
    <UPageHeader title="Fluency" />
    <UPageBody>
      <UCard variant="subtle">
        <p>Choose training mode:</p>
        <div class="actions">
          <UButton
            v-for="m in modes"
            :key="m.key"
            :to="m.to"
            color="primary"
            variant="outline"
          >
            {{ m.label }}
          </UButton>
        </div>
      </UCard>
    </UPageBody>
  </main>
</template>

<style scoped>
.actions { display: flex; gap: .6rem; flex-wrap: wrap; }
@media (max-width: 640px) {
  .actions :deep(button),
  .actions button {
    width: 100%;
  }
}
</style>
