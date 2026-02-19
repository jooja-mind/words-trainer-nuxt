<script setup lang="ts">
const props = defineProps<{
  result: { correct: boolean; correctDefinition?: string | null } | null
  translation?: string | null
}>()
</script>

<template>
  <div v-if="result" class="feedback" :class="result.correct ? 'ok' : 'bad'">
    <template v-if="result.correct">✅ Correct</template>
    <template v-else>
      ❌ Wrong<br />
      <span v-if="result.correctDefinition">Correct: {{ result.correctDefinition }}</span>
      <span v-if="translation"><br />Translation: {{ translation }}</span>
    </template>
  </div>
</template>

<style scoped>
.feedback { margin-top: .7rem; padding: .6rem; border-radius: 8px; }
.feedback.ok { background: #14532d; }
.feedback.bad { background: #7c2d12; }
</style>
