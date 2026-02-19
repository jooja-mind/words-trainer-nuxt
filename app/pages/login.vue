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
    <div class="card">
      <h1>Enter password</h1>
      <input v-model="password" type="password" placeholder="Password" />
      <button :disabled="loading" @click="submit">Login</button>
      <p v-if="error" class="err">{{ error }}</p>
    </div>
  </main>
</template>

<style scoped>
.wrap{min-height:80vh;display:flex;align-items:center;justify-content:center}
.card{background:#171a2b;border:1px solid #2a2e44;border-radius:12px;padding:1.5rem;display:grid;gap:.7rem;min-width:280px}
input,button{padding:.65rem .8rem;border-radius:8px;border:1px solid #343b5a;background:#0f1221;color:#fff}
button{cursor:pointer}
.err{color:#fca5a5}
</style>
