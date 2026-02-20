<script setup lang="ts">
async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  window.location.href = '/login'
}

import type { NavigationMenuItem } from '@nuxt/ui'

const items = ref<NavigationMenuItem[]>([[
  {
    label: 'Vocab',
    icon: 'ion:library',
    children: [
      {
        label: 'Trainer',
        icon: 'ion:book',
        to: '/trainer'
      },
      {
        label: 'Marathon',
        icon: 'ion:fireball',
        to: '/marathon'
      },
      {
        label: 'Stats',
        icon: 'ion:bar-chart',
        to: '/stats'
      },
      {
        label: 'Setup',
        icon: 'ion:ios-settings',
        to: '/settings'
      },
    ]
  },
  {
    label: 'Recap',
    icon: 'ion:sparkles-sharp',
    to: '/recap'
  },
  {
    label: 'Interview',
    icon: 'ion:chatbubbles',
    to: '/interview'
  }
]
])
</script>

<template>
    <UHeader>
        <template #title>
          English Trainer
        </template>

        <UNavigationMenu :items="items" arrow content-orientation="vertical" class="w-full"/>

        <template #right>
          <UButton color="error" variant="ghost" @click="logout" icon="ion:log-out" aria-label="Logout" />
        </template>
      </UHeader>
</template>

<style scoped>
</style>
