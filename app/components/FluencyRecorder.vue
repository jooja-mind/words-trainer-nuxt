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
const canRetry = ref(false)
const mediaRecorder = ref<MediaRecorder | null>(null)
const chunks: Blob[] = []
let activeStream: MediaStream | null = null
let lastBlob: Blob | null = null

async function transcribeBlob(blob: Blob) {
  processing.value = true
  try {
    const form = new FormData()
    form.append('audio', blob, 'fluency.webm')

    const res = await fetch('/api/fluency/transcribe', {
      method: 'POST',
      body: form
    })

    if (!res.ok) {
      const msg = await res.text().catch(() => '')
      canRetry.value = true
      emit('error', msg || 'Transcription failed')
      return
    }

    const data = await res.json()
    const text = String(data?.text || '').trim()
    if (!text) {
      canRetry.value = true
      emit('error', 'Transcription returned empty text. Please retry.')
      return
    }

    canRetry.value = false
    emit('transcript-ready', text)
  } catch {
    canRetry.value = true
    emit('error', 'Failed to transcribe recording')
  } finally {
    processing.value = false
  }
}

async function startRecording() {
  if (props.disabled || recording.value) return
  canRetry.value = false
  try {
    activeStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const rec = new MediaRecorder(activeStream)
    chunks.length = 0
    rec.ondataavailable = (e) => chunks.push(e.data)
    rec.onstop = async () => {
      try {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        lastBlob = blob
        await transcribeBlob(blob)
      } finally {
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

async function retryLastTranscription() {
  if (!lastBlob || processing.value) return
  await transcribeBlob(lastBlob)
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
    <UButton v-if="canRetry" :disabled="disabled || processing" variant="soft" @click="retryLastTranscription">
      Retry transcription
    </UButton>
    <span class="muted" v-if="processing">Transcribing...</span>
  </div>
</template>

<style scoped>
.actions { display: flex; gap: .6rem; align-items: center; flex-wrap: wrap; }
.muted { opacity: .8; font-size: 13px; }
</style>
