<script setup lang="ts">
const route = useRoute()
const isLogin = computed(() => route.path === '/login')

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  window.location.href = '/login'
}
</script>

<template>
  <div>
    <header v-if="!isLogin" class="topnav">
      <span class="group">Words</span>
      <NuxtLink to="/settings" class="nav-item">Setup</NuxtLink>
      <NuxtLink to="/trainer" class="nav-item">Trainer</NuxtLink>
      <NuxtLink to="/marathon" class="nav-item">Mistakes</NuxtLink>
      <NuxtLink to="/stats" class="nav-item">Stats</NuxtLink>
      <span class="sep">·</span>
      <NuxtLink to="/recap" class="nav-item">Recap</NuxtLink>
      <span class="sep">·</span>
      <button class="nav-item logout" @click="logout">Logout</button>
    </header>
    <NuxtPage />
  </div>
</template>

<style scoped>
.topnav {
  display: flex;
  gap: .6rem; flex-wrap: wrap;
  padding: .8rem 1rem;
  border-bottom: 1px solid #2a2e44;
  background: #12162a;
  position: sticky;
  top: 0;
  z-index: 20;
}
.nav-item {
  color: #dbe1ff;
  text-decoration: none;
  border: 1px solid #39406a;
  padding: .45rem .7rem;
  border-radius: 8px;
  background: #171d36;
  cursor: pointer;
}
.nav-item.router-link-active {
  background: #2a3468;
  border-color: #4a5fcc;
}
.logout { margin-left: auto; }
@media (max-width: 640px){
  .nav-item{padding:.35rem .5rem;font-size:12px}
}
.group{color:#9aa4d8;font-weight:700;padding:.35rem .2rem;letter-spacing:.2px}
.sep{color:#556; padding:0 .2rem}
</style>
