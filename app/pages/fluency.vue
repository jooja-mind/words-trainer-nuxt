<script setup lang="ts">
useHead({ title: 'Fluency Hub' })
</script>

<template>
  <main class="wrap">
    <UPageHeader title="Fluency" headline="A / D MVP" />
    <UPageBody>
      <UCard variant="subtle">
        <p>Choose training mode:</p>
        <div class="actions">
          <UButton to="/fluency/a" color="primary">A - Pattern Drills</UButton>
          <UButton to="/fluency/d" color="secondary" variant="outline">D - Pressure Mode</UButton>
          <UButton to="/fluency/c" variant="soft">C - Mistake Bank</UButton>
        </div>
      </UCard>
    </UPageBody>
  </main>
</template>

<style scoped>
.actions { display: flex; gap: .6rem; flex-wrap: wrap; }
</style>
