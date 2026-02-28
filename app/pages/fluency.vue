<script setup lang="ts">
useHead({ title: 'Fluency Hub' })

const modes = [
  { key: 'a', label: 'A - Pattern Drills', to: '/fluency/a' },
  { key: 'b', label: 'B - Minimal Pairs', to: '/fluency/b' },
  { key: 'd', label: 'D - Pressure Mode', to: '/fluency/d' },
  { key: 'c', label: 'C - Mistake Bank', to: '/fluency/c' },
  { key: 'e', label: 'E - Metrics', to: '/fluency/e' }
]

function openMode(path: string) {
  window.location.href = path
}
</script>

<template>
  <main class="wrap">
    <UPageHeader title="Fluency" />
    <UPageBody>
      <UCard variant="subtle">
        <p>Choose training mode:</p>
        <div class="actions">
          <button
            v-for="m in modes"
            :key="m.key"
            class="modeBtn"
            type="button"
            @click="openMode(m.to)"
          >
            {{ m.label }}
          </button>
        </div>
      </UCard>
    </UPageBody>
  </main>
</template>

<style scoped>
.actions { display: flex; gap: .6rem; flex-wrap: wrap; }
.modeBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255,255,255,.25);
  border-radius: 10px;
  padding: 8px 12px;
  color: inherit;
  background: rgba(255,255,255,.03);
  cursor: pointer;
  pointer-events: auto;
}
.modeBtn:hover { background: rgba(255,255,255,.08); }
@media (max-width: 640px) {
  .modeBtn { width: 100%; }
}
</style>
