<script setup lang="ts">
let userStore = useUserStore();
let password = ref('');
</script>

<template>
  <main class="wrap">
    <UCard variant="subtle">
      <div class="title">Enter password</div>
      <div class="inputs">
       <UInput v-model="password" type="password" placeholder="Password" @keyup.enter="userStore.login({ password })" :disabled="userStore.loginData.loading" />
       <UButton @click="userStore.login({ password })" size="lg" :disabled="userStore.loginData.loading">Login</UButton>
      </div>
      <p v-if="userStore.loginData.error" class="err">{{ userStore.loginData.error }}</p>
    </UCard>
  </main>
</template>

<style scoped>
.title{
  font-size: 18px;
  font-weight: 500;
  cursor: default;
}
.err{
  color:#fca5a5;
  margin-top: 10px;
  font-size: 12px;
}
.wrap{
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
.inputs{
  margin-top: 10px;
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  justify-content: flex-start;
}
</style>
