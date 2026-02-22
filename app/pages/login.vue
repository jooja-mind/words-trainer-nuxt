<script setup lang="ts">
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const res = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { password: password.value }
    })
    if ((res as any).ok) {
      window.location.href = '/'
    } else {
      error.value = 'Wrong password'
    }
  } catch (e) {
    error.value = 'Wrong password'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="wrap">
    <UCard variant="subtle">
      <div class="title">Enter password</div>
      <div class="inputs">
       <UInput v-model="password" type="password" placeholder="Password" @keyup.enter="submit" :disabled="loading" />
       <UButton @click="submit" size="lg" :disabled="loading">Login</UButton>
      </div>
      <p v-if="error" class="err">{{ error }}</p>
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
