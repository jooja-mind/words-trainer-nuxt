<script setup lang="ts">
let view = ref<'add' | 'about'>('add');

let wordInput = ref();

let word = ref<string>('');
let wordInfo = reactive({
    "id": "",
    "term": "",
    "definition": "",
    "example": "",
    "translation": "",
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

function closeDescription(){
    view.value = 'add';
  if(!isBigScreen()) {
    minimized.value = true;
  }
}

async function maximize(){
  minimized.value = false;
  await nextTick();
  if(wordInput.value){
    wordInput.value.inputRef.focus();
  }
}

function isBigScreen() {
  return window.innerWidth > 500;
}

let minimized = ref(false);
onMounted(() => {
  minimized.value = !isBigScreen();
})
</script>

<template>
  <div class="mini" v-if="minimized" @click="maximize()">
    <Icon name="material-symbols:book-4-spark"/>
  </div>
  <div class="quickWordAddHolder" :class="{about: view=='about'}" v-else>
    <div class="addWord" v-if="view=='add'">
      <div class="top">
        <div class="title">Add Word</div>
        <UButton class="closeButton" color="primary" variant="link" icon="ion:close" @click="minimized=true" style="display: none;" />
      </div>
      <div class="panel">
        <UInput ref="wordInput" placeholder="Term..." :disabled="loading" v-model="word" @keyup.enter="addWord" />
        <UButton class="addButton" color="primary" variant="link" icon="ion:plus" :loading="loading" @click="addWord" :disabled="!word" />
      </div>
    </div>
    <div class="aboutWord" v-if="view=='about'">
      <div class="flex justify-between items-center">
        <div class="word">{{ wordInfo.term }}</div>
        <UButton color="primary" variant="link" icon="ion:close" @click="closeDescription" class="p-0" />
      </div>
      <p v-if="wordInfo.translation" class="text-gray-400">{{ wordInfo.translation }}</p>
      <p v-if="wordInfo.definition" class="mt-1">{{ wordInfo.definition }}</p>
      <p v-if="wordInfo.example" class="mt-1 italic text-sm text-gray-400">Example: {{ wordInfo.example }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">


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

  .top{
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
  }

  &.about{
    padding-right: 10px;
  }
  .title{
    font-size: 16px;
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
}

/* .quickWordAddHolder.about for iphone */
@media (max-width: 500px) {
  .quickWordAddHolder {
    width: calc(100vw - 40px);
    left: 20px;
    right: 20px;
  }

  :deep(.addButton){
    display: none !important;
  }
  :deep(div){
    width: calc(100% - 2px);
  }

  :deep(.closeButton){
    display: block !important;
    padding: 0;
  }

  .quickWordAddHolder.about{
    width: calc(100vw - 40px);
    left: 20px;
    right: 20px;
    bottom: 20px;
  }
}

.mini{
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #000000;
  border-radius: 50%;
  padding: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.1);
  display: flex;
  height: 64px;
  width: 64px;
  justify-content: center;
  align-items: center;
  font-size: 32px;
}
</style>
