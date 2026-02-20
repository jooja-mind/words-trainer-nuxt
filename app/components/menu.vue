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
        label: 'Setup',
        icon: 'ion:ios-settings',
        to: '/settings'
      },
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
      }
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
], [
  {
    label: 'Logout',
    onClick: logout,
    color: 'error',
  }
]])
</script>

<template>
  <div class="menu">
    <UNavigationMenu :items="items" arrow content-orientation="vertical" class="w-full"/>
  </div>
</template>

<style scoped>
.menu{margin:0.5rem; padding-bottom: 0.5rem; border-bottom:1px solid #2a2e4475;margin-bottom:1rem}
</style>
