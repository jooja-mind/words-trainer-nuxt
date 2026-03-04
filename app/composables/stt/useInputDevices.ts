type InputDevice = {
  label: string
  deviceId: string
}

export function useInputDevices() {
  const inputDevices = ref<InputDevice[]>([])
  const selectedInputDevice = ref<string>('')

  async function loadInputDevices() {
    if(!navigator) return;
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

      inputDevices.value = availableInputDevices

      if (!inputDevices.value.length) {
        selectedInputDevice.value = ''
        return
      }

      const localSelectedInputDevice = localStorage.getItem('selected_input_device')
      const foundInputDevice = inputDevices.value.find((device) => {
        return device.deviceId === localSelectedInputDevice
      })

      const fallbackInputDevice = inputDevices.value[0]
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

  loadInputDevices().catch((error) => {
    console.log(error)
  });

  return {
    inputDevices,
    selectedInputDevice,
    loadInputDevices,
  }
}