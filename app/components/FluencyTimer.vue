<script setup lang="ts">
const props = withDefaults(defineProps<{ seconds: number }>(), { seconds: 30 })
const emit = defineEmits<{ finished: [] }>()

const left = ref(props.seconds)
const running = ref(false)
let timer: NodeJS.Timeout | null = null

function start() {
  stop()
  left.value = props.seconds
  running.value = true
  timer = setInterval(() => {
    left.value -= 1
    if (left.value <= 0) {
      stop()
      emit('finished')
    }
  }, 1000)
}

function stop() {
  if (timer) clearInterval(timer)
  timer = null
  running.value = false
}

onBeforeUnmount(stop)
defineExpose({ start, stop })
</script>

<template>
  <div class="timer">
    <span>⏱ {{ left }}s</span>
    <UButton size="xs" variant="outline" @click="start" :disabled="running">Start</UButton>
    <UButton size="xs" variant="ghost" @click="stop" :disabled="!running">Stop</UButton>
  </div>
</template>

<style scoped>
.timer { display: flex; align-items: center; gap: .5rem; margin: 8px 0; }
</style>
