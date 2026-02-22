<script setup lang="ts">
let view = ref<'add' | 'about'>('add');

let word = ref<string>('');
let wordInfo = reactive({
    "id": "",
    "term": "",
    "definition": "",
    "example": "",
    "translationRu": "",
    "status": "",
    "lastSeenAt": null,
    "createdAt": "",
    "updatedAt": ""
});

let loading = ref(false);
async function addWord() {
  if(!word.value.trim()) return;
  loading.value = true;
  try {
    let [addedWordData] = await $fetch('/api/words/batch', { method: 'POST', body: { text: word.value } });
    console.log('Added word:', addedWordData);
    Object.assign(wordInfo, addedWordData);
    word.value = '';
    view.value = 'about';
  } catch (error) {
    console.error('Error adding word:', error);
    alert('Failed to add word. Please try again.');
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <div class="quickWordAddHolder" :class="{about: view=='about'}">
    <div class="addWord" v-if="view=='add'">
      <div class="title">Add Word</div>
      <div class="panel">
        <UInput placeholder="Term..." :disabled="loading" v-model="word" @keyup.enter="addWord" />
        <UButton color="primary" variant="link" icon="ion:plus" :loading="loading" @click="addWord" :disabled="!word" />
      </div>
    </div>
    <div class="aboutWord" v-if="view=='about'">
      <div class="flex justify-between items-center">
        <div class="word">{{ wordInfo.term }}</div>
        <UButton color="primary" variant="link" icon="ion:close" @click="view='add'" />
      </div>
      <p v-if="wordInfo.translationRu" class="text-gray-400">{{ wordInfo.translationRu }}</p>
      <p v-if="wordInfo.definition" class="mt-1">{{ wordInfo.definition }}</p>
      <p v-if="wordInfo.example" class="mt-1 italic text-sm text-gray-400">Example: {{ wordInfo.example }}</p>
    </div>
  </div>
</template>

<style scoped>
.quickWordAddHolder{
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #1e293b;
  border-radius: 8px;
  padding: 8px 10px;
  padding-right: 4px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.1);
  max-width: 600px;
}
.quickWordAddHolder.about{
  padding-right: 10px;
}
.title{
  font-size: 14px;
  cursor: default;
}
.panel{
  display: flex;
  gap: 2px;
  margin-top: .5rem;
}
.word{
  font-size: 16px;
  font-weight: 500;
}

/* .quickWordAddHolder.about for iphone */
@media (max-width: 500px) {
  .quickWordAddHolder.about{
    width: calc(100vw - 40px);
    left: 20px;
    right: 20px;
    bottom: 20px;
  }
}
</style>
