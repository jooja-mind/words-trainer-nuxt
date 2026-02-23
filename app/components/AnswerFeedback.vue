<script setup lang="ts">
const props = defineProps<{
  result: {
    correct: boolean;
    correctDefinition?: string | null,
    evaluation?: {
      confidence: number,
      reasonCode: 'meaning_match' | 'near_synonym' | 'typo_ok' | 'wrong_sense' | 'different_meaning' | 'antonym' | 'too_vague' | 'topic_related' | 'form_mismatch'
    }
  } | null
  translation?: string | null,
  mode: 'DEFINITION' | 'TRANSLATION_INPUT' | 'TRANSLATION'
}>();

function reasonText(reasonCode: string) {
  const reasons: Record<string, string> = {
    meaning_match: 'Your answer matches the meaning of the word.',
    near_synonym: 'Your answer is a near synonym, which is acceptable.',
    typo_ok: 'Your answer has minor typos but is understandable.',
    wrong_sense: 'Your answer is correct for a different sense of the word.',
    different_meaning: 'Your answer has a different meaning than the target word.',
    antonym: 'Your answer is an antonym of the correct meaning.',
    too_vague: 'Your answer is too vague to be considered correct.',
    topic_related: 'Your answer is related to the topic but does not match the meaning.',
    form_mismatch: 'Your answer has a form mismatch (e.g. noun vs verb) but is close.'
  };
  return reasons[reasonCode] || 'No specific reason provided.';
}
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
      <div v-if="result.evaluation">
        AI said: {{ reasonText(result.evaluation.reasonCode) }}
      </div>
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
