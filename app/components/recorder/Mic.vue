<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useAudioBridgeStream } from '@/composables/useAudioBridgeStream'

type InputDevice = {
  label: string
  deviceId: string
}

const props = defineProps<{
  state: {
    mic?: {
      recognition: boolean
    }
  }
}>()

const emit = defineEmits<{
  audioBridge: [b16int: ArrayBuffer, sourceType: 'mic']
  requestStartRecognition: [sourceType: 'mic', sampleRate: number]
  requestStopRecognition: [sourceType: 'mic']
}>()

const selectedInputDevice = ref<string>('')
const inputDevices = reactive<InputDevice[]>([])

const { vol, isSoundDetected, bindStream, stop, isActive } = useAudioBridgeStream({
  sourceType: 'mic',
  shouldBridge: () => Boolean(props.state.mic?.recognition),
  onAudioBridge: (b16int, sourceType) => emit('audioBridge', b16int, sourceType),
  onRecognitionStart: (sourceType, sampleRate) =>
    emit('requestStartRecognition', sourceType, sampleRate),
  onRecognitionStop: (sourceType) => emit('requestStopRecognition', sourceType),
})

async function start() {
  try {
    const stream = await getUserMediaForSelectedInputDevice()

    bindStream(stream)
  } catch (error) {
    console.log(error)
  }
}

function stopRecorder() {
  stop({ stopTracks: true })
}

function buildAudioConstraints(deviceId: string): MediaTrackConstraints {
  return {
    deviceId: { exact: deviceId },
    autoGainControl: true,
    echoCancellation: true,
    noiseSuppression: true,
  }
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
      audio: buildAudioConstraints(selectedInputDevice.value),
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

async function loadInputDevices() {
  const probeStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      autoGainControl: true,
      echoCancellation: true,
      noiseSuppression: true,
    },
    video: false,
  })

  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const availableInputDevices = devices
      .filter((device) => device.kind === 'audioinput')
      .map((device, index) => {
        return {
          label: device.label || `Input Device ${index}`,
          deviceId: device.deviceId,
        }
      })

    inputDevices.splice(0, inputDevices.length, ...availableInputDevices)

    if (!inputDevices.length) {
      selectedInputDevice.value = ''
      return
    }

    const localSelectedInputDevice = localStorage.getItem('selected_input_device')
    const foundInputDevice = inputDevices.find((device) => {
      return device.deviceId === localSelectedInputDevice
    })

    const fallbackInputDevice = inputDevices[0]
    if (!fallbackInputDevice) {
      selectedInputDevice.value = ''
      return
    }

    selectedInputDevice.value = foundInputDevice
      ? foundInputDevice.deviceId
      : fallbackInputDevice.deviceId
    localStorage.setItem('selected_input_device', selectedInputDevice.value)
  } finally {
    probeStream.getTracks().forEach((track) => track.stop())
  }
}

function persistSelectedInputDevice() {
  if (!selectedInputDevice.value) {
    return
  }
  localStorage.setItem('selected_input_device', selectedInputDevice.value)
}

async function restartRecorderWithSelectedInputDevice() {
  if (!isActive.value) {
    return
  }

  stop({ stopTracks: true })
  await start()
}

onMounted(() => {
  loadInputDevices().catch((error) => {
    console.log(error)
  })
})

onUnmounted(() => {
  stop({ stopTracks: true, emitStop: false })
})

watch(selectedInputDevice, (nextDeviceId, previousDeviceId) => {
  persistSelectedInputDevice()

  if (!nextDeviceId || nextDeviceId === previousDeviceId) {
    return
  }

  void restartRecorderWithSelectedInputDevice()
})
</script>

<template>
  <RecorderControl
    :isActive="isActive"
    :vol="vol"
    :isSoundDetected="isSoundDetected"
    :inputDevices="inputDevices"
    @start="start"
    @stop="stopRecorder"
    v-model:selected-input-device="selectedInputDevice"
  />
</template>
