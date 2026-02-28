<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const config = useRuntimeConfig()
const features = config.public.features as { daily?: boolean; fluency?: boolean }

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  window.location.href = '/login'
}

const items = computed<NavigationMenuItem[]>(() => {
  const base: NavigationMenuItem[] = [
    {
      label: 'Vocab',
      icon: 'ion:library',
      children: [
        { label: 'Trainer', icon: 'ion:book', to: '/trainer' },
        { label: 'Marathon', icon: 'ion:fireball', to: '/marathon' },
        { label: 'Stats', icon: 'ion:bar-chart', to: '/stats' },
        { label: 'Setup', icon: 'ion:ios-settings', to: '/settings' }
      ]
    },
    { label: 'Recap', icon: 'ion:sparkles-sharp', to: '/recap' },
    {
      label: 'Interview',
      icon: 'ion:chatbubbles',
      children: [
        { label: 'Train', icon: 'ion:mic', to: '/interview' },
        { label: 'Stats', icon: 'ion:bar-chart', to: '/interview/stats' }
      ]
    }
  ]

  if (features?.fluency !== false) {
    base.push({ label: 'Fluency', icon: 'ion:flash', to: '/fluency' })
  }
  if (features?.daily !== false) {
    base.push({ label: 'Daily', icon: 'ion:today', to: '/daily' })
  }

  return base
})
</script>

<template>
  <UHeader mode="modal">
    <template #title>
      English Trainer
    </template>

    <UNavigationMenu
      :items="items"
      arrow
      content-orientation="vertical"
      class="hidden lg:flex w-full"
    />

    <template #body>
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        class="w-full"
      />

      <div class="my-4 border-t border-default" />

      <UButton
        label="Logout"
        icon="ion:log-out"
        color="error"
        variant="soft"
        class="w-full justify-center"
        @click="logout"
      />
    </template>

    <template #right>
      <UButton
        color="error"
        variant="ghost"
        icon="ion:log-out"
        aria-label="Logout"
        class="hidden lg:inline-flex"
        @click="logout"
      />
    </template>
  </UHeader>
</template>

<style scoped>
</style>
