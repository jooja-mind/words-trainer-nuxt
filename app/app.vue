<script setup lang="ts">
const route = useRoute()
const isLogin = computed(() => route.path === '/login')
const isSettings = computed(() => route.path === '/settings')
</script>

<template>
  <UApp>
    <Menu v-if="!isLogin" />
    <UContainer>
      <NuxtPage />
      <AddWord v-if="!isLogin && !isSettings" />
    </UContainer>
  </UApp>
</template>

<style scoped>

</style>
