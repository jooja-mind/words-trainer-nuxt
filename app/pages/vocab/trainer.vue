<script setup lang="ts">
const quizStats = ref<any>(null)

async function loadStats(){
  quizStats.value = await $fetch('/api/quiz/stats')
}

onMounted(loadStats)
</script>

<template>
  <main class="wrap">
    <UPageHeader title="Trainer" headline="Vocabulary" />
    <UPageBody>
      <VocabTrainer @submitted="loadStats" />

      <UCard variant="subtle" v-if="quizStats">
        <h2>Stats</h2>
        <p>Total words: <b>{{ quizStats.totalWords }}</b></p>
        <p>Total answers: <b>{{ quizStats.totalAnswers }}</b></p>
        <p>Accuracy: <b>{{ (quizStats.accuracy * 100).toFixed(1) }}%</b></p>
        <p>
          Accuracy100:
          <b>{{ (quizStats.accuracy100 * 100).toFixed(1) }}%</b>
        </p>
      </UCard>
    </UPageBody>
  </main>
</template>
