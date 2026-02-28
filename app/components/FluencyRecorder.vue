<script setup lang="ts">
const props = withDefaults(defineProps<{
  disabled?: boolean
}>(), {
  disabled: false
})

const emit = defineEmits<{
  'transcript-ready': [text: string]
  'error': [message: string]
}>()

const recording = ref(false)
const processing = ref(false)
const mediaRecorder = ref<MediaRecorder | null>(null)
const chunks: Blob[] = []
let activeStream: MediaStream | null = null

async function startRecording() {
  if (props.disabled || recording.value) return
  try {
    activeStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const rec = new MediaRecorder(activeStream)
    chunks.length = 0
    rec.ondataavailable = (e) => chunks.push(e.data)
    rec.onstop = async () => {
      try {
        processing.value = true
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const form = new FormData()
        form.append('audio', blob, 'fluency.webm')

        const res = await fetch('/api/fluency/transcribe', {
          method: 'POST',
          body: form
        })

        if (!res.ok) {
          emit('error', 'Transcription failed')
          return
        }

        const data = await res.json()
        emit('transcript-ready', String(data?.text || '').trim())
      } catch {
        emit('error', 'Failed to transcribe recording')
      } finally {
        processing.value = false
        if (activeStream) {
          activeStream.getTracks().forEach((t) => t.stop())
          activeStream = null
        }
      }
    }

    rec.start()
    mediaRecorder.value = rec
    recording.value = true
  } catch {
    emit('error', 'Microphone access failed')
  }
}

function stopRecording() {
  if (mediaRecorder.value && recording.value) {
    mediaRecorder.value.stop()
    recording.value = false
  }
}
</script>

<template>
  <div class="actions">
    <UButton :disabled="disabled || processing" color="primary" v-if="!recording" @click="startRecording">
      Start recording
    </UButton>
    <UButton :disabled="disabled || processing" color="secondary" variant="outline" v-else @click="stopRecording">
      Stop recording
    </UButton>
    <span class="muted" v-if="processing">Transcribing...</span>
  </div>
</template>

<style scoped>
.actions { display: flex; gap: .6rem; align-items: center; flex-wrap: wrap; }
.muted { opacity: .8; font-size: 13px; }
</style>
