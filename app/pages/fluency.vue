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
          <a v-for="m in modes" :key="m.key" :href="m.to" class="modeLink">{{ m.label }}</a>
        </div>
      </UCard>
    </UPageBody>
  </main>
</template>

<style scoped>
.actions { display: flex; gap: .6rem; flex-wrap: wrap; }
.modeLink {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255,255,255,.25);
  border-radius: 10px;
  padding: 8px 12px;
  text-decoration: none;
  color: inherit;
  background: rgba(255,255,255,.03);
}
.modeLink:hover { background: rgba(255,255,255,.08); }
@media (max-width: 640px) {
  .modeLink { width: 100%; }
}
</style>
