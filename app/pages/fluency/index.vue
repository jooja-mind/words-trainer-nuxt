<script setup lang="ts">
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




function handleAudioBridge(b16int: ArrayBuffer, sourceType: STTSourceType) {
  audioBridge(b16int, sourceType)
}

function handleStartRecognition(sourceType: STTSourceType, sampleRate: number) {
  requestStartRecognition(sourceType, sampleRate)
}

function handleStopRecognition(sourceType: STTSourceType) {
  requestStopRecognition(sourceType)
}


const {
  vol: micVol,
  isSoundDetected: isMicSoundDetected,
  bindStream: bindMicStream,
  stop: stopMicBridge,
  isActive: isMicActive,
} = useAudioBridgeStream({
  sourceType: 'mic',
  shouldBridge: () => Boolean(state.mic.recognition),
  onAudioBridge: (b16int, sourceType) => handleAudioBridge(b16int, sourceType),
  onRecognitionStart: (sourceType, sampleRate) => handleStartRecognition(sourceType, sampleRate),
  onRecognitionStop: (sourceType) => handleStopRecognition(sourceType),
})

const { inputDevices, selectedInputDevice, loadInputDevices } = useInputDevices()

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
</script>

<template>
  <main class="wrap">
    <UPageHeader title="Fluency Trainer" headline="Extreme" />
    <UPageBody>
      <UCard variant="subtle">
        <UButton @click="testTokenWorkerEndpoint">
          Start fetching token
        </UButton>
        <hr>
        <RecorderControl :isActive="isMicActive" :vol="micVol" :isSoundDetected="isMicSoundDetected"
        :inputDevices="inputDevices" @start="startMicRecorder" @stop="stopMicRecorder"
        v-model:selected-input-device="selectedInputDevice" />
        <hr>
        <div class="history">
          <div><strong>history mic:</strong></div>
          <ul>
            <li>
              <strong>live:</strong> {{ state.mic.liveText || '—' }}
            </li>
            <li v-for="(entry, index) in state.mic.history.slice().reverse()" :key="index">
              {{ new Date(entry.timestampStart).toLocaleTimeString() }} - {{ new
                Date(entry.timestampEnd).toLocaleTimeString()
              }}:
              {{ entry.text }}
            </li>
          </ul>
        </div>
      </UCard>
    </UPageBody>
  </main>
</template>

<style scoped>

</style>