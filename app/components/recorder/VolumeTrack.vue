<script setup lang="ts">
const props = defineProps(["vol",]);
</script>

<template>
  <div class="holder">
    <div class="volume" :style="{ height: props.vol + '%' }"></div>
  </div>
</template>

<style lang="scss" scoped>
.holder {
  width: 10px;
  height: 20px;
  position: relative;
  background-color: gray;
  overflow: hidden;

  .volume {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 0;
    background-color: green;
  }
}
</style>