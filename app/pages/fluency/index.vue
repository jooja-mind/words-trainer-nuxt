<script setup lang="ts">
import { useSTT } from '~/composables/stt/useSTT'
import { useInputDevices } from '~/composables/stt/useInputDevices';

const {
  state,
  getProviderOptions,
  testTokenWorkerEndpoint,
  audioBridge,
  requestStartRecognition,
  requestStopRecognition,
  stopAll,
} = useSTT({
  onBridgeAudio: ({ b16int, sourceType }) => {
    console.log('audioBridge:', { sourceType, b16int })
    // socket.emit('audio', { b16int, sourceType, sessionToken: state.token });
  },
  onBridgeStart: ({ sourceType, token, tokenExpiresAt }) => {
    console.log('requestStartRecognition:', { sourceType, tokenExpiresAt })
    // socket.emit('start_recognition', { sourceType, token, tokenExpiresAt });
  },
  onBridgeStop: ({ sourceType }) => {
    console.log('requestStopRecognition:', { sourceType })
    // socket.emit('stop_recognition', { sourceType });
  },
  onProviderError: ({ sourceType, message }) => {
    console.error('sttError:', { sourceType, message })
  },
});


const {
  vol: micVol,
  isSoundDetected: isMicSoundDetected,
  bindStream: bindMicStream,
  stop: stopMicBridge,
  isActive: isMicActive,
} = useAudioBridgeStream({
  sourceType: 'mic',
  shouldBridge: () => Boolean(state.mic.recognition),
  onAudioBridge: (b16int, sourceType) => audioBridge(b16int, sourceType),
  onRecognitionStart: (sourceType, sampleRate) => requestStartRecognition(sourceType, sampleRate),
  onRecognitionStop: (sourceType) => requestStopRecognition(sourceType),
})

const { inputDevices, selectedInputDevice } = useInputDevices()

async function startMicRecorder() {
  try {
    const stream = await getUserMediaForSelectedInputDevice()
    bindMicStream(stream)
  } catch (error) {
    console.log(error)
  }
}

function stopMicRecorder() {
  stopMicBridge({ stopTracks: true })
}

async function getUserMediaForSelectedInputDevice() {
  if (!selectedInputDevice.value) {
    return navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    })
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: {
        deviceId: { exact: selectedInputDevice.value },
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      },
    })
  } catch (error) {
    const isDeviceUnavailableError =
      error instanceof DOMException &&
      (error.name === 'OverconstrainedError' || error.name === 'NotFoundError')

    if (!isDeviceUnavailableError) {
      throw error
    }

    return navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    })
  }
}

let lastFinalized = computed(()=>{
  const lastHistoryEntry = state.mic.history.slice()[state.mic.history.length - 1]
  return lastHistoryEntry;
})

onUnmounted(() => {
  stopAll()
})
</script>

<template>
  <main class="wrap">
    <UPageHeader title="Fluency Trainer" headline="Extreme" />
    <UPageBody>
      <UCard variant="subtle">
        <RecorderControl :isActive="isMicActive" :vol="micVol" :isSoundDetected="isMicSoundDetected"
        :inputDevices="inputDevices" @start="startMicRecorder" @stop="stopMicRecorder"
        v-model:selected-input-device="selectedInputDevice" v-show="false" />
        <hr>
        <div class="speaking">
          <div class="live" v-if="!!state.mic.liveText">{{ state.mic.liveText }}</div>
          <div class="final" v-if="!state.mic.liveText && lastFinalized">{{ lastFinalized.text }}</div>
          <div class="empty" v-if="!state.mic.liveText && !lastFinalized">
            <em>Start speaking...</em>
          </div>
        </div>
        <hr>
        <UButton v-if="isMicActive" @click="stopMicRecorder" label="Stop mic recorder" color="error" variant="soft" />
        <UButton v-if="!isMicActive" @click="startMicRecorder" label="Start mic recorder" color="primary" variant="soft" />
      </UCard>
    </UPageBody>
  </main>
</template>

<style scoped lang="scss">
.speaking{
  text-align: center;
  font-size: 1.5em;

  .live{
    color: #ffffff9a;
  }
  .final{
    color: #fff;
  }
}
</style>