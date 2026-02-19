<script setup lang="ts">
const route = useRoute()
const isLogin = computed(() => route.path === '/login')
</script>

<template>
  <UApp>
    <Menu v-if="!isLogin" />
    <NuxtPage />
  </UApp>
</template>

<style scoped>

</style>
