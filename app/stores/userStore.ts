import { defineStore } from 'pinia'
import type { DailyCompleted, DailySections } from '@prisma/client';

export const useUserStore = defineStore('userStore', ()=>{
  let loginData = reactive({
    loggedIn: false,
    loading: false,
    error: ''
  });

  async function login({password}: {password: string}) {
    loginData.error = ''
    loginData.loading = true
    try {
      const res = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { password }
      })
      if ((res as any).ok) {
        window.location.href = '/'
      } else {
        loginData.error = 'Wrong password'
      }
    } catch (e) {
      loginData.error = 'Wrong password'
    } finally {
      loginData.loading = false
    }
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  let dailyData = reactive({
    loading: false,
    isCompletedToday: false
  });

  async function fetchDailyData() {
    type DailyResponse = {
      date: string;
      sectionsCount: number;
      sectionsCompletedCount: number;
      sections: DailySections[];
      compeletedToday: DailyCompleted[];
    };
    dailyData.loading = true;
    try {
      let data = await $fetch<DailyResponse>('/api/daily');
      if(data.sectionsCompletedCount == data.sectionsCount){
        dailyData.isCompletedToday = true;
      } else {
        dailyData.isCompletedToday = false;
      }
    } catch (error) {
      console.error('Error loading daily data:', error)
    } finally {
      dailyData.loading = false;
    }
  }

  return {
    loginData,
    login,
    logout,
    dailyData,
    fetchDailyData
  }
})