<script setup lang="ts">
const route = useRoute()
const isLogin = computed(() => route.path === '/login')
const showWords = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

watch(() => route.path, () => { showWords.value = false })

function toggleWords() { showWords.value = !showWords.value }
function closeWords() { showWords.value = false }

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  window.location.href = '/login'
}

onMounted(() => {
  const onDocClick = (e: MouseEvent) => {
    if (!dropdownRef.value) return
    if (!dropdownRef.value.contains(e.target as Node)) {
      showWords.value = false
    }
  }
  document.addEventListener('click', onDocClick)
  onUnmounted(() => document.removeEventListener('click', onDocClick))
})
</script>

<template>
  <div>
    <header v-if="!isLogin" class="topnav">
      <div class="dropdown" ref="dropdownRef">
        <button class="nav-item" @click="toggleWords">Words ▾</button>
        <div v-if="showWords" class="menu">
          <NuxtLink to="/settings" class="menu-item" @click="closeWords">Setup</NuxtLink>
          <NuxtLink to="/trainer" class="menu-item" @click="closeWords">Trainer</NuxtLink>
          <NuxtLink to="/marathon" class="menu-item" @click="closeWords">Mistakes</NuxtLink>
          <NuxtLink to="/stats" class="menu-item" @click="closeWords">Stats</NuxtLink>
        </div>
      </div>
      <NuxtLink to="/recap" class="nav-item">Recap</NuxtLink>
      <button class="nav-item logout" @click="logout">Logout</button>
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
  align-items: center;
}
.nav-item {
  color: #dbe1ff;
  text-decoration: none;
  border: 1px solid #39406a;
  padding: .45rem .7rem;
  border-radius: 8px;
  background: #171d36;
  cursor: pointer;
  font-size: 13px;
}

.dropdown { position: relative; }
.menu {
  position: absolute;
  top: calc(100% + 6px);
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

.logout {
  margin-left: auto;
  border-color: rgba(255,107,107,.7);
  background: rgba(255,107,107,.12);
  color: #ffb4b4;
}

@media (max-width: 640px) {
  .topnav { flex-wrap: wrap; }
  .nav-item { padding: .35rem .5rem; font-size: 12px; }
  .menu { position: static; width: 100%; }
  .dropdown { width: 100%; }
  .menu-item { font-size: 12px; }
}
</style>
