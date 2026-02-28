<script setup lang="ts">
const route = useRoute()
const isLogin = computed(() => route.path === '/login')
const isSettings = computed(() => route.path === '/settings')
const config = useRuntimeConfig()
const appVersion = computed(() => String(config.public.appVersion || 'dev'))
</script>

<template>
  <UApp>
    <Menu v-if="!isLogin" />
    <UContainer>
      <NuxtPage />
      <AddWord v-if="!isLogin && !isSettings" />
      <footer class="versionFooter" v-if="!isLogin">
        <span>version: {{ appVersion }}</span>
      </footer>
    </UContainer>
  </UApp>
</template>

<style scoped>
.versionFooter {
  margin: 20px 0 10px;
  opacity: .65;
  font-size: 12px;
  text-align: center;
}
</style>
