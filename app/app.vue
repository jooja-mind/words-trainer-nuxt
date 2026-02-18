<template>
  <div>
    <header class="topnav">
      <NuxtLink to="/settings" class="nav-item">⚙️ Settings</NuxtLink>
      <NuxtLink to="/trainer" class="nav-item">🧠 Trainer</NuxtLink>
      <NuxtLink to="/marathon" class="nav-item">🔥 Mistakes Marathon</NuxtLink>
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
}
.nav-item.router-link-active {
  background: #2a3468;
  border-color: #4a5fcc;
}
</style>
