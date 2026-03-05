<script setup lang="ts">
import VolumeTrack from './VolumeTrack.vue';


defineProps<{
  isActive: boolean;
  vol: number;
  isSoundDetected: boolean;
  isMuted: boolean;
  inputDevices?: {
    label: string;
    deviceId: string;
  }[];
}>()

let emits = defineEmits(['start', 'stop', 'mute', 'unmute']);

const selectedInputDevice = defineModel('selectedInputDevice', {
  type: String,
  default: '',
});

function mute(){
  emits('mute')
}
function unmute(){
  emits('unmute')
}
</script>

<template>
  <div class="holder">
    <!-- <VolumeTrack :vol="vol" /> -->
    <!-- <UButton color="error" icon="ion:record" @click="emits('start')" :disabled="isActive">Start</UButton> -->
    <!-- <UButton color="warning" icon="ion:stop-sharp" @click="emits('stop')" :disabled="!isActive"></UButton> -->

    <div>
      <UButton v-if="!isMuted" @click="mute" icon="ion:ios-mic-off" variant="soft"/>
      <UButton v-else @click="unmute" icon="ion:ios-mic-off" color="error" variant="soft"/>
    </div>

    <!-- <template v-if="isActive">
      <UBadge color="neutral" class="rounded-full" v-if="!isSoundDetected">Waiting for sound...</UBadge>
      <UBadge color="success" class="rounded-full" v-else>Sound OK</UBadge>
    </template> -->

    <template v-if="inputDevices">
      <USelectMenu
        v-model="selectedInputDevice"
        value-key="value"
        :items="inputDevices.map(d => ({ label: d.label, value: d.deviceId }))"
        style="max-width: 200px;"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.holder {
  display: flex;
  align-items: center;
  gap: 8px;

  select {
    margin-left: 16px;
  }
}
</style>
