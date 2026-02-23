<script setup lang="ts">
const props = defineProps<{
  result: { correct: boolean; correctDefinition?: string | null } | null
  translation?: string | null,
  mode: 'DEFINITION' | 'TRANSLATION_INPUT' | 'TRANSLATION'
}>()
</script>

<template>
  <div v-if="result" class="feedback" :class="result.correct ? 'ok' : 'bad'">
    <template v-if="result.correct">
      <template v-if="mode == 'TRANSLATION_INPUT'">
        <span v-if="result.correctDefinition"><b>Meaning:</b> {{ result.correctDefinition }}</span>
        <span v-if="translation"><br /><b>Translation:</b> {{ translation }}</span>
      </template>
      <template v-else>
        Correct!
      </template>
    </template>
    <template v-else>
      <span v-if="result.correctDefinition"><b>Correct:</b> {{ result.correctDefinition }}</span>
      <span v-if="translation"><br /><b>Translation:</b> {{ translation }}</span>
    </template>
  </div>
</template>

<style scoped>
.feedback { margin-top: .7rem; padding: .6rem; border-radius: 8px; }
.feedback.ok { background: #14532d; }
.feedback.bad { background: #7c2d12; }
</style>
