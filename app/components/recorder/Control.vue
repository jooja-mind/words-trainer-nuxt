<script setup lang="ts">
import VolumeTrack from './VolumeTrack.vue';


defineProps<{
  isActive: boolean;
  vol: number;
  isSoundDetected: boolean;
  inputDevices?: {
    label: string;
    deviceId: string;
  }[];
}>()

const selectedInputDevice = defineModel('selectedInputDevice', {
  type: String,
  default: '',
});

defineEmits<{
  start: [];
  stop: [];
}>()
</script>

<template>
  <div class="holder">
    <VolumeTrack :vol="vol" />
    <UButton color="error" icon="ion:record" @click="$emit('start')" :disabled="isActive">Start</UButton>
    <UButton color="warning" icon="ion:stop-sharp" @click="$emit('stop')" :disabled="!isActive"></UButton>

    <template v-if="isActive">
      <UBadge color="neutral" class="rounded-full" v-if="!isSoundDetected">Waiting for sound...</UBadge>
      <UBadge color="success" class="rounded-full" v-else>Sound OK</UBadge>
    </template>

    <template v-if="inputDevices">
      <USelectMenu
        v-model="selectedInputDevice"
        value-key="value"
        :items="inputDevices.map(d => ({ label: d.label, value: d.deviceId }))"
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
