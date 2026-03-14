<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { DailyCompleted, DailySections } from '@prisma/client';

let userStore = useUserStore();

const config = useRuntimeConfig()

const items = computed<NavigationMenuItem[]>(() => {
  const base: NavigationMenuItem[] = [
    {
      label: 'Vocab',
      icon: 'ion:library',
      children: [
        { label: 'Trainer', icon: 'ion:book', to: '/vocab/trainer' },
        { label: 'Marathon', icon: 'ion:fireball', to: '/vocab/marathon' },
        { label: 'Stats', icon: 'ion:bar-chart', to: '/vocab/stats' },
        { label: 'Setup', icon: 'ion:ios-settings', to: '/vocab/settings' }
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
    },
    { label: 'Fluency', icon: 'ion:rocket', to: '/fluency' },
  ];

  if(!userStore.dailyData.isCompletedToday){
    base.unshift({ 
      label: 'Daily', 
      icon: 'ion:calendar', 
      to: '/daily', 
      chip: {
        color: userStore.dailyData.loading ? 'info' : 'error'
      }
    })
  }else{
    base.unshift({ 
      label: 'Daily', 
      icon: 'ion:calendar', 
      to: '/daily'
    })
  }

  return base
});

onMounted(() => {
  userStore.fetchDailyData();
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
        @click="userStore.logout()"
      />
    </template>

    <template #right>
      <UButton
        color="error"
        variant="ghost"
        icon="ion:log-out"
        aria-label="Logout"
        class="hidden lg:inline-flex"
        @click="userStore.logout()"
      />
    </template>
  </UHeader>
</template>

<style scoped>
</style>
