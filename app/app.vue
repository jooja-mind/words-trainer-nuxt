<script setup lang="ts">
const route = useRoute()
const isLogin = computed(() => route.path === '/login')
const showWords = ref(false)

watch(() => route.path, () => { showWords.value = false })

function toggleWords() {
  showWords.value = !showWords.value
}

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  window.location.href = '/login'
}
</script>

<template>
  <div>
    <header v-if="!isLogin" class="topnav">
      <div class="dropdown" @mouseleave="showWords = false">
        <button class="nav-item" @click="toggleWords">Words ▾</button>
        <div v-if="showWords" class="menu">
          <NuxtLink to="/settings" class="menu-item">Setup</NuxtLink>
          <NuxtLink to="/trainer" class="menu-item">Trainer</NuxtLink>
          <NuxtLink to="/marathon" class="menu-item">Mistakes</NuxtLink>
          <NuxtLink to="/stats" class="menu-item">Stats</NuxtLink>
        </div>
      </div>
      <NuxtLink to="/recap" class="nav-item">Recap</NuxtLink>
      <button class="nav-item" @click="logout">Logout</button>
    </header>
    <NuxtPage />
  </div>
</template>

<style scoped>
.topnav {
  display: flex;
  gap: .6rem;
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

.dropdown { position: relative; }
.menu {
  position: absolute;
  top: 110%;
  left: 0;
  background: #171d36;
  border: 1px solid #39406a;
  border-radius: 10px;
  padding: .3rem;
  display: grid;
  gap: .25rem;
  min-width: 160px;
  box-shadow: 0 10px 30px rgba(0,0,0,.35);
}
.menu-item {
  color: #dbe1ff;
  text-decoration: none;
  padding: .4rem .6rem;
  border-radius: 8px;
}
.menu-item:hover { background: #212a52; }

@media (max-width: 640px) {
  .topnav { flex-wrap: wrap; }
  .nav-item { padding: .35rem .5rem; font-size: 12px; }
  .menu { position: static; width: 100%; }
  .dropdown { width: 100%; }
  .menu-item { font-size: 12px; }
}
</style>
