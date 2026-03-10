<script setup lang="ts">
useHead({ title: "Fluency" });
</script>

<template>
  <main class="wrap">
    <UPageHeader title="Fluency Trainer" headline="Extreme" />
    <UPageBody>
      <FluencyTrainer :challange="20"/>
    </UPageBody>
  </main>
</template>

<style scoped lang="scss">

</style>